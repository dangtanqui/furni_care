# Service for case business logic operations
class CaseService < BaseService
  def initialize(case_record:, current_user:, params: {})
    @case = case_record
    @current_user = current_user
    @params = params
  end

  def create
    @case.created_by = @current_user
    @case.current_stage = 1
    @case.status = Case::STATUSES_HASH[:OPEN]
    
    if @case.save
      success(@case)
    else
      failure(@case.errors.messages)
    end
  end

  def update(case_params)
    # Detect what fields are being updated
    cost_fields_updated = detect_cost_fields_update(case_params)
    final_cost_updated, old_final_cost_status = detect_final_cost_update(case_params)
    stage1_fields_updated = detect_stage1_fields_update(case_params)
    assigned_to_changed = detect_assigned_to_change(case_params)
    
    # Prepare update parameters with business logic
    update_params = prepare_update_params(
      case_params: case_params,
      stage1_fields_updated: stage1_fields_updated,
      assigned_to_changed: assigned_to_changed
    )
    
    ActiveRecord::Base.transaction do
      if @case.update(update_params)
        handle_cost_update(cost_fields_updated) if cost_fields_updated
        handle_final_cost_update(final_cost_updated, old_final_cost_status) if final_cost_updated
        handle_stage_rollback
        success(@case.reload)
      else
        failure(@case.errors.messages)
      end
    end
  end

  def advance_stage
    @case.reload
    
    return failure(['Already at final stage']) if @case.current_stage >= 5
    
    # Check cost approval for stage 3
    if @case.current_stage == 3 && @case.cost_required && @case.cost_status != Case::COST_STATUSES_HASH[:APPROVED]
      return failure(['Cost approval required before advancing'])
    end
    
    # Check estimated_cost is present when cost_required is true (0 is allowed as a valid value)
    if @case.current_stage == 3 && @case.cost_required && @case.estimated_cost.nil?
      return failure(['Estimated cost is required when cost is required'])
    end
    
    new_stage = @case.current_stage + 1
    update_attrs = { current_stage: new_stage }
    
    # If advancing from Stage 4 to Stage 5
    if new_stage == 5
      # If cost was required and approved in Stage 3, CS needs to input final cost
      # So status should be 'in_progress' to allow CS to work on final cost
      # Only set status to 'completed' if no cost was required
      if @case.cost_required && @case.cost_status == Case::COST_STATUSES_HASH[:APPROVED]
        update_attrs[:status] = Case::STATUSES_HASH[:IN_PROGRESS] # CS needs to input final cost
      else
        update_attrs[:status] = Case::STATUSES_HASH[:COMPLETED] # no cost required, can complete
      end
    # If advancing from Stage 1 to Stage 2, set status to in_progress
    elsif @case.current_stage == 1
      update_attrs[:status] = Case::STATUSES_HASH[:IN_PROGRESS]
    # If advancing from Stage 2 to Stage 3, set status to in_progress
    elsif @case.current_stage == 2
      update_attrs[:status] = Case::STATUSES_HASH[:IN_PROGRESS]
    end
    
    # Wrap in transaction to ensure atomicity
    ActiveRecord::Base.transaction do
      unless @case.update(update_attrs)
        return failure(@case.errors.messages)
      end
      
      result_case = @case.reload
      
      # Send email notification when advancing to Stage 5 (after successful update)
      # Email is sent asynchronously and errors are caught, so it won't rollback the transaction
      if new_stage == 5
        send_execution_summary_email
      end
      
      success(result_case)
    end
  end

  def approve_cost
    # Authorization is handled by controller via Policy
    # Check estimated_cost is present when cost_required is true (0 is allowed as a valid value)
    if @case.cost_required && @case.estimated_cost.nil?
      return failure(['Estimated cost is required when cost is required'])
    end
    
    ActiveRecord::Base.transaction do
      @case.update(cost_status: Case::COST_STATUSES_HASH[:APPROVED], cost_approved_by: @current_user)
      
      # If Stage 3 cost is approved and current_stage is 3, automatically advance to Stage 4
      if @case.current_stage == 3 && @case.cost_required && @case.cost_status == Case::COST_STATUSES_HASH[:APPROVED]
        status_to_set = @case.status == Case::STATUSES_HASH[:PENDING] ? Case::STATUSES_HASH[:IN_PROGRESS] : @case.status
        @case.update(current_stage: 4, status: status_to_set)
      end
      
      success(@case.reload)
    end
  end

  def reject_cost
    # Authorization is handled by controller via Policy
    # When cost is rejected, keep case at Stage 3 so CS can cancel or Technician can update cost
    # Set status to 'rejected' to indicate the case was rejected
    ActiveRecord::Base.transaction do
      @case.update(
        cost_status: Case::COST_STATUSES_HASH[:REJECTED],
        status: Case::STATUSES_HASH[:REJECTED], # indicates case was rejected
        current_stage: 3 # Ensure case stays at Stage 3
      )
      success(@case.reload)
    end
  end

  def redo_case
    ActiveRecord::Base.transaction do
      # Reset cost-related fields when redoing case
      update_params = {
        current_stage: 3,
        attempt_number: @case.attempt_number + 1,
        status: Case::STATUSES_HASH[:IN_PROGRESS],
        cost_status: nil,
        cost_approved_by_id: nil
      }
      
      # If final_cost_status was approved, reset to 'pending' when redoing back to Stage 3
      if @case.final_cost_status == Case::FINAL_COST_STATUSES_HASH[:APPROVED]
        update_params[:final_cost_status] = Case::FINAL_COST_STATUSES_HASH[:PENDING]
        update_params[:final_cost_approved_by_id] = nil
      end
      
      # If cost_required is true but estimated_cost is missing (not zero, as 0 is valid), 
      # set cost_required to false to avoid validation error
      if @case.cost_required && @case.estimated_cost.nil?
        update_params[:cost_required] = false
      end
      
      if @case.update(update_params)
        success(@case.reload)
      else
        failure(@case.errors.messages)
      end
    end
  end

  def cancel_case
    # Authorization is handled by controller via Policy
    # When cancelling, we need to handle validation issues
    # If cost_required is true but estimated_cost is nil, validation will fail
    # So we use update_all to bypass validations completely for this special operation
    # update_all updates directly to database and commits immediately
    
    case_id = @case.id
    cancelled_status = Case::STATUSES_HASH[:CANCELLED]
    
    # Build update hash
    update_hash = { 
      status: cancelled_status,
      updated_at: Time.current
    }
    
    # If cost_required is true but estimated_cost is missing, set cost_required to false
    # This must be done before updating status to avoid validation errors
    if @case.cost_required && @case.estimated_cost.nil?
      update_hash[:cost_required] = false
    end
    
    # Use update_all to bypass all validations and update directly in database
    # This is safe because we're only updating status and cost_required (if needed)
    rows_updated = Case.where(id: case_id).update_all(update_hash)
    
    if rows_updated > 0
      # Get completely fresh instance from database
      @case = Case.find(case_id)
      
      # Verify status was updated
      if @case.status == cancelled_status
        success(@case)
      else
        failure(["Failed to cancel case: status is still #{@case.status}"])
      end
    else
      failure(["Failed to cancel case: no rows were updated"])
    end
  end

  def approve_final_cost
    # Authorization is handled by controller via Policy
    unless @case.current_stage == 5
      return failure(['Final cost can only be approved in Stage 5'])
    end
    
    # Allow 0 as a valid final cost value
    unless @case.final_cost.present?
      return failure(['Final cost must be set before approval'])
    end
    
    ActiveRecord::Base.transaction do
      @case.update(
        final_cost_status: Case::FINAL_COST_STATUSES_HASH[:APPROVED],
        final_cost_approved_by: @current_user,
        status: Case::STATUSES_HASH[:COMPLETED] # but CS still needs to close the case
      )
      success(@case.reload)
    end
  end

  def reject_final_cost
    # Authorization is handled by controller via Policy
    # When final cost is rejected, set status to 'rejected' (similar to Stage 3 cost rejection)
    unless @case.current_stage == 5
      return failure(['Final cost can only be rejected in Stage 5'])
    end
    
    ActiveRecord::Base.transaction do
      @case.update(
        final_cost_status: Case::FINAL_COST_STATUSES_HASH[:REJECTED],
        status: Case::STATUSES_HASH[:REJECTED] # similar to Stage 3 cost rejection
      )
      success(@case.reload)
    end
  end

  private

  # Detect if cost-related fields are being updated
  def detect_cost_fields_update(case_params)
    case_params.key?(:estimated_cost) || 
    case_params.key?(:cost_description) || 
    case_params.key?(:cost_required)
  end

  # Detect if final_cost is being updated and return update status
  def detect_final_cost_update(case_params)
    return [false, nil] unless case_params.key?(:final_cost)
    
    old_final_cost_status = @case.final_cost_status
    old_final_cost = @case.final_cost
    new_final_cost = case_params[:final_cost].blank? ? nil : case_params[:final_cost].to_f
    
    # Check if value changed OR if it was rejected (need to reset status even if value unchanged)
    updated = old_final_cost.to_f != new_final_cost.to_f || old_final_cost_status == Case::FINAL_COST_STATUSES_HASH[:REJECTED]
    [updated, old_final_cost_status]
  end

  # Detect if Stage 1 fields are being updated
  def detect_stage1_fields_update(case_params)
    stage1_fields = [:assigned_to_id, :description]
    stage1_fields.any? { |field| case_params.key?(field) }
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
    should_rollback_stage1 = stage1_fields_updated && @case.current_stage >= 3
    if should_rollback_stage1 && !update_params.key?(:current_stage)
      update_params[:current_stage] = 2
    end
  end

  # Apply technician reassignment logic
  def apply_technician_reassignment(update_params, assigned_to_changed)
    return unless assigned_to_changed
    
    # Set status to 'in_progress' when reassigning
    update_params[:status] = Case::STATUSES_HASH[:IN_PROGRESS] unless update_params.key?(:status)
    
    # Handle cost_status reset based on current stage
    reset_cost_status_on_reassignment(update_params)
    
    # Handle final_cost_status reset if at Stage 5
    reset_final_cost_status_on_reassignment(update_params)
  end

  # Reset cost_status when reassigning technician
  def reset_cost_status_on_reassignment(update_params)
    if @case.current_stage == 3
      # At Stage 3: reset cost_status to null if pending or rejected
      if @case.cost_status == Case::COST_STATUSES_HASH[:PENDING] || @case.cost_status == Case::COST_STATUSES_HASH[:REJECTED]
        update_params[:cost_status] = nil
        update_params[:cost_approved_by_id] = nil
      end
    elsif @case.current_stage >= 4 && @case.cost_status == Case::COST_STATUSES_HASH[:APPROVED]
      # At Stage 4+: if cost was approved, reset to 'pending' so new technician can review
      update_params[:cost_status] = Case::COST_STATUSES_HASH[:PENDING]
      update_params[:cost_approved_by_id] = nil
    end
  end

  # Reset final_cost_status when reassigning technician at Stage 5
  def reset_final_cost_status_on_reassignment(update_params)
    if @case.current_stage == 5 && @case.final_cost_status == Case::FINAL_COST_STATUSES_HASH[:APPROVED]
      update_params[:final_cost_status] = Case::FINAL_COST_STATUSES_HASH[:PENDING]
      update_params[:final_cost_approved_by_id] = nil
    end
  end

  def handle_cost_update(cost_fields_updated)
    # If cost fields are updated and cost was previously rejected, reset cost_status
    if @case.cost_status == Case::COST_STATUSES_HASH[:REJECTED]
      @case.update(cost_status: nil, status: Case::STATUSES_HASH[:PENDING])
    end
    
    # If cost fields are updated and cost was previously approved, reset cost_status
    # This allows Technician to update cost and re-submit for approval
    # Note: This check happens after the rejected check, so we need to reload
    @case.reload
    if @case.cost_status == Case::COST_STATUSES_HASH[:APPROVED]
      @case.update(cost_status: nil, status: Case::STATUSES_HASH[:PENDING], cost_approved_by_id: nil)
    end
  end

  def handle_stage_rollback
    # If Stage 3 cost is required but not approved, and case has advanced past Stage 3,
    # roll back to Stage 3 to wait for approval
    if @case.cost_required && @case.cost_status != Case::COST_STATUSES_HASH[:APPROVED] && @case.current_stage > 3
      update_attrs = { current_stage: 3 }
      
      # Reset final_cost_status if it was rejected when rolling back to Stage 3
      if @case.final_cost_status == Case::FINAL_COST_STATUSES_HASH[:REJECTED]
        update_attrs[:final_cost_status] = Case::FINAL_COST_STATUSES_HASH[:PENDING]
        update_attrs[:final_cost_approved_by_id] = nil
      end
      
      @case.update(update_attrs)
    end
  end

  def handle_final_cost_update(final_cost_updated, old_final_cost_status = nil)
    return unless final_cost_updated
    
    @case.reload
    
    # Use provided old_final_cost_status or fallback to current status if not provided
    was_rejected = (old_final_cost_status || @case.final_cost_status) == Case::FINAL_COST_STATUSES_HASH[:REJECTED]
    
    # Get old and new final_cost values
    old_final_cost = @case.final_cost_was
    new_final_cost = @case.final_cost
    estimated_cost = @case.estimated_cost
    
    # Check if final_cost changed from previous value
    final_cost_value_changed = old_final_cost.to_f != new_final_cost.to_f
    
    # Check if final_cost is different from estimated_cost
    # If same as estimated_cost, no approval needed - keep status as nil (not 'approved')
    # If different, need Leader approval - set to 'pending'
    # Allow 0 as a valid value - compare numeric values directly
    estimated_cost_value = estimated_cost.nil? ? nil : estimated_cost.to_f
    new_final_cost_value = new_final_cost.nil? ? nil : new_final_cost.to_f
    
    # Check if values differ (including when one is 0 and other is not)
    differs_from_estimated = !estimated_cost.nil? && !new_final_cost.nil? && (new_final_cost_value != estimated_cost_value)
    
    # If was rejected, always reset status to 'pending' when CS updates
    if was_rejected
      if differs_from_estimated
        # Final cost is different from estimated cost - need Leader approval
        update_attrs = {
          final_cost_status: Case::FINAL_COST_STATUSES_HASH[:PENDING],
          final_cost_approved_by_id: nil,
          status: Case::STATUSES_HASH[:PENDING] # wait for Leader approval
        }
        @case.update(update_attrs)
      else
        # Final cost is same as estimated cost - no approval needed, but still reset case status
        update_attrs = {
          final_cost_status: nil,
          final_cost_approved_by_id: nil,
          status: Case::STATUSES_HASH[:PENDING] # reset case status
        }
        @case.update(update_attrs)
      end
    elsif final_cost_value_changed
      if differs_from_estimated
        # Final cost is different from estimated cost (including 0 vs non-zero) - need Leader approval
        # Set status to 'pending' to wait for Leader approval (similar to Stage 3)
        update_attrs = {
          final_cost_status: Case::FINAL_COST_STATUSES_HASH[:PENDING],
          final_cost_approved_by_id: nil,
          status: Case::STATUSES_HASH[:PENDING] # wait for Leader approval
        }
        @case.update(update_attrs)
      elsif !new_final_cost.nil? && !differs_from_estimated
        # Final cost is same as estimated cost (including both being 0) - no approval needed
        # Set status to 'completed' since no approval is needed, case can be completed
        update_attrs = {
          final_cost_status: nil,
          final_cost_approved_by_id: nil,
          status: Case::STATUSES_HASH[:COMPLETED] # no approval needed, can complete
        }
        @case.update(update_attrs)
      end
    elsif @case.final_cost_status == Case::FINAL_COST_STATUSES_HASH[:APPROVED]
      # If was approved and CS changes the value, reset to pending
      @case.update(
        final_cost_status: Case::FINAL_COST_STATUSES_HASH[:PENDING],
        final_cost_approved_by_id: nil
      )
    end
  end

  def send_execution_summary_email
    # Send email notification when advancing to Stage 5
    # Email is sent if contact or client has email address
    # This is called AFTER the transaction commits, so errors won't rollback the stage advancement
    if @case.current_stage == 5
      contact_email = @case.contact&.email.presence
      client_email = @case.client&.email.presence
      
      if contact_email.present? || client_email.present?
        begin
          CaseMailer.execution_summary(@case).deliver_later
        rescue => e
          # Log error but don't fail the operation
          Rails.logger.error "Failed to send execution summary email: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
        end
      end
    end
  rescue => e
    # Log error but don't fail the operation
    Rails.logger.error "Failed to send execution summary email: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
  end
end
