class CaseUpdateService < BaseService
  include StageConstants

  def initialize(case_record:, current_user:)
    @case = case_record
    @current_user = current_user
  end

  def update(case_params)
    cost_fields_updated = detect_cost_fields_update(case_params)
    final_cost_updated = detect_final_cost_update(case_params)
    stage1_fields_updated = detect_stage1_fields_update(case_params)
    assigned_to_changed = detect_assigned_to_change(case_params)
    
    # Prepare update parameters with business logic
    update_params = prepare_update_params(
      case_params: case_params,
      stage1_fields_updated: stage1_fields_updated,
      assigned_to_changed: assigned_to_changed
    )
    
    ActiveRecord::Base.transaction do
      old_assigned_to_id = @case.assigned_to_id
      old_status = @case.status
      old_final_cost_status = @case.final_cost_status
      is_closing = case_params[:status] == CaseConstants::STATUSES[:CLOSED]
      
      if @case.update(update_params)
        handle_cost_update(cost_fields_updated) if cost_fields_updated
        # Don't handle final_cost_update when closing case - preserve final_cost_status
        handle_final_cost_update(final_cost_updated, old_final_cost_status) if final_cost_updated && !is_closing
        handle_stage_rollback
        
        updated_case = @case.reload
        
        # Log technician reassignment if assigned_to changed
        if assigned_to_changed && old_assigned_to_id != updated_case.assigned_to_id
          BusinessEventLogger.log_technician_reassigned(
            case_id: updated_case.id,
            user_id: @current_user.id,
            from_technician_id: old_assigned_to_id,
            to_technician_id: updated_case.assigned_to_id
          )
        end
        
        # Log case closed if status changed to closed
        if old_status != CaseConstants::STATUSES[:CLOSED] && updated_case.status == CaseConstants::STATUSES[:CLOSED]
          BusinessEventLogger.log_case_closed(case_id: updated_case.id, user_id: @current_user.id)
        end
        
        success(updated_case)
      else
        failure(@case.errors.messages)
      end
    end
  end

  private

  def detect_cost_fields_update(case_params)
    case_params.key?(:cost_required) || case_params.key?(:estimated_cost)
  end

  def detect_final_cost_update(case_params)
    return false unless case_params.key?(:final_cost)
    
    old_final_cost_status = @case.final_cost_status
    old_final_cost = @case.final_cost
    
    # Handle nil/blank values properly
    new_final_cost_value = case_params[:final_cost].blank? ? nil : case_params[:final_cost].to_f
    old_final_cost_value = old_final_cost.nil? ? nil : old_final_cost.to_f
    
    # Check if value changed OR if it was rejected (need to reset status even if value unchanged)
    updated = old_final_cost_value != new_final_cost_value || old_final_cost_status == CaseConstants::FINAL_COST_STATUSES[:REJECTED]
    updated
  end

  def detect_stage1_fields_update(case_params)
    case_params.key?(:assigned_to_id)
  end

  # Detect if assigned_to_id is being changed
  def detect_assigned_to_change(case_params)
    case_params.key?(:assigned_to_id) && 
    @case.assigned_to_id != case_params[:assigned_to_id].to_i
  end

  # Prepare update parameters with business logic applied
  def prepare_update_params(case_params:, stage1_fields_updated:, assigned_to_changed:)
    update_params = case_params.dup
    
    # Handle Stage 1 rollback if needed
    apply_stage1_rollback(update_params, stage1_fields_updated)
    
    # Handle technician reassignment
    apply_technician_reassignment(update_params, assigned_to_changed)
    
    update_params
  end

  # Apply Stage 1 rollback logic
  def apply_stage1_rollback(update_params, stage1_fields_updated)
    should_rollback_stage1 = stage1_fields_updated && @case.current_stage >= STAGE_3
    if should_rollback_stage1 && !update_params.key?(:current_stage)
      update_params[:current_stage] = STAGE_2
    end
  end

  # Apply technician reassignment logic
  def apply_technician_reassignment(update_params, assigned_to_changed)
    return unless assigned_to_changed
    
    # Set status to 'in_progress' when reassigning
    update_params[:status] = CaseConstants::STATUSES[:IN_PROGRESS] unless update_params.key?(:status)
    
    # Handle cost_status reset based on current stage
    reset_cost_status_on_reassignment(update_params)
    
    # Handle final_cost_status reset if at Stage 5
    reset_final_cost_status_on_reassignment(update_params)
  end

  # Reset cost_status when reassigning technician
  def reset_cost_status_on_reassignment(update_params)
    if @case.current_stage == STAGE_3
      # At Stage 3: reset cost_status to null if pending or rejected
      if @case.cost_status == CaseConstants::COST_STATUSES[:PENDING] || @case.cost_status == CaseConstants::COST_STATUSES[:REJECTED]
        update_params[:cost_status] = nil
        update_params[:cost_approved_by_id] = nil
      end
    elsif @case.current_stage >= STAGE_4 && @case.cost_status == CaseConstants::COST_STATUSES[:APPROVED]
      # At Stage 4+: if cost was approved, reset to 'pending' so new technician can review
      update_params[:cost_status] = CaseConstants::COST_STATUSES[:PENDING]
      update_params[:cost_approved_by_id] = nil
    end
  end

  # Reset final_cost_status when reassigning technician at Stage 5
  def reset_final_cost_status_on_reassignment(update_params)
    if @case.current_stage == STAGE_5 && @case.final_cost_status == CaseConstants::FINAL_COST_STATUSES[:APPROVED]
      update_params[:final_cost_status] = CaseConstants::FINAL_COST_STATUSES[:PENDING]
      update_params[:final_cost_approved_by_id] = nil
    end
  end

  def handle_cost_update(cost_fields_updated)
    CaseCostService.new(case_record: @case, current_user: @current_user).handle_cost_update
  end

  def handle_final_cost_update(final_cost_updated, old_final_cost_status = nil)
    return unless final_cost_updated
    
    CaseFinalCostService.new(case_record: @case, current_user: @current_user).handle_final_cost_update(old_final_cost_status)
  end

  def handle_stage_rollback
    # If Stage 3 cost is required but not approved, and case has advanced past Stage 3,
    # roll back to Stage 3 to wait for approval
    if @case.cost_required && @case.cost_status != CaseConstants::COST_STATUSES[:APPROVED] && @case.current_stage > STAGE_3
      update_attrs = { current_stage: STAGE_3 }
      
      # Reset final_cost_status if it was rejected when rolling back to Stage 3
      if @case.final_cost_status == CaseConstants::FINAL_COST_STATUSES[:REJECTED]
        update_attrs[:final_cost_status] = CaseConstants::FINAL_COST_STATUSES[:PENDING]
        update_attrs[:final_cost_approved_by_id] = nil
      end
      
      @case.update(update_attrs)
    end
  end
end
