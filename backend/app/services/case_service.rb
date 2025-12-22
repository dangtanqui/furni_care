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
    @case.status = Case::STATUSES.first # 'open'
    
    if @case.save
      success(@case)
    else
      failure(@case.errors.messages)
    end
  end

  def update(case_params)
    cost_fields_updated = case_params.key?(:estimated_cost) || 
                          case_params.key?(:cost_description) || 
                          case_params.key?(:cost_required)
    
    ActiveRecord::Base.transaction do
      if @case.update(case_params)
        handle_cost_update(cost_fields_updated) if cost_fields_updated
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
    if @case.current_stage == 3 && @case.cost_required && @case.cost_status != Case::COST_STATUSES[1] # 'approved'
      return failure(['Cost approval required before advancing'])
    end
    
    new_stage = @case.current_stage + 1
    update_attrs = { current_stage: new_stage }
    
    # If advancing from Stage 4 to Stage 5, automatically set status to completed
    if new_stage == 5
      update_attrs[:status] = Case::STATUSES[3] # 'completed'
    # If advancing from Stage 1 to Stage 2, set status to in_progress
    elsif @case.current_stage == 1
      update_attrs[:status] = Case::STATUSES[2] # 'in_progress'
    end
    
    @case.update(update_attrs)
    success(@case.reload)
  end

  def approve_cost
    # Authorization is handled by controller via Policy
    ActiveRecord::Base.transaction do
      @case.update(cost_status: Case::COST_STATUSES[1], cost_approved_by: @current_user) # 'approved'
      
      # If Stage 3 cost is approved and current_stage is 3, automatically advance to Stage 4
      if @case.current_stage == 3 && @case.cost_required && @case.cost_status == Case::COST_STATUSES[1] # 'approved'
        status_to_set = @case.status == Case::STATUSES[1] ? Case::STATUSES[2] : @case.status # 'pending' ? 'in_progress'
        @case.update(current_stage: 4, status: status_to_set)
      end
      
      success(@case.reload)
    end
  end

  def reject_cost
    # Authorization is handled by controller via Policy
    @case.update(cost_status: Case::COST_STATUSES[2], status: Case::STATUSES[6]) # 'rejected'
    success(@case.reload)
  end

  def redo_case
    ActiveRecord::Base.transaction do
      @case.update(
        current_stage: 3,
        attempt_number: @case.attempt_number + 1,
        status: Case::STATUSES[2], # 'in_progress'
        cost_status: nil,
        cost_approved_by_id: nil
      )
      success(@case.reload)
    end
  end

  def cancel_case
    # Authorization is handled by controller via Policy
    @case.update(status: Case::STATUSES[7]) # 'cancelled'
    success(@case.reload)
  end

  private

  def handle_cost_update(cost_fields_updated)
    # If cost fields are updated and cost was previously rejected, reset cost_status
    if @case.cost_status == Case::COST_STATUSES[2] # 'rejected'
      @case.update(cost_status: nil, status: Case::STATUSES[1]) # 'pending'
    end
    
    # If cost fields are updated and cost was previously approved, reset cost_status
    # This allows Technician to update cost and re-submit for approval
    # Note: This check happens after the rejected check, so we need to reload
    @case.reload
    if @case.cost_status == Case::COST_STATUSES[1] # 'approved'
      @case.update(cost_status: nil, status: Case::STATUSES[1], cost_approved_by_id: nil) # 'pending'
    end
  end

  def handle_stage_rollback
    # If Stage 3 cost is required but not approved, and case has advanced past Stage 3,
    # roll back to Stage 3 to wait for approval
    if @case.cost_required && @case.cost_status != Case::COST_STATUSES[1] && @case.current_stage > 3 # 'approved'
      @case.update(current_stage: 3)
    end
  end
end
