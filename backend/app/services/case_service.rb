class CaseService < BaseService
  include StageConstants

  def initialize(case_record:, current_user:, params: {})
    @case = case_record
    @current_user = current_user
    @params = params
  end

  def create
    @case.created_by = @current_user
    @case.current_stage = STAGE_1
    @case.status = CaseConstants::STATUSES[:OPEN]
    
    if @case.save
      BusinessEventLogger.log_case_created(case_id: @case.id, user_id: @current_user.id)
      success(@case)
    else
      failure(@case.errors.messages)
    end
  end

  def update(case_params)
    CaseUpdateService.new(case_record: @case, current_user: @current_user).update(case_params)
  end

  def advance_stage
    CaseStageService.new(case_record: @case, current_user: @current_user).advance_stage
  end

  def approve_cost
    CaseCostService.new(case_record: @case, current_user: @current_user).approve_cost
  end

  def reject_cost
    CaseCostService.new(case_record: @case, current_user: @current_user).reject_cost
  end

  def redo_case
    CaseStageService.new(case_record: @case, current_user: @current_user).redo_case
  end

  def cancel_case
    # Authorization is handled by controller via Policy
    # When cancelling, we need to handle validation issues
    # If cost_required is true but estimated_cost is nil, validation will fail
    # So we use update_all to bypass validations completely for this special operation
    # update_all updates directly to database and commits immediately
    case_id = @case.id
    cancelled_status = CaseConstants::STATUSES[:CANCELLED]
    
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
        BusinessEventLogger.log_case_cancelled(case_id: case_id, user_id: @current_user.id)
        success(@case)
      else
        failure(["Failed to cancel case: status is still #{@case.status}"])
      end
    else
      failure(["Failed to cancel case: no rows were updated"])
    end
  end

  def approve_final_cost
    CaseFinalCostService.new(case_record: @case, current_user: @current_user).approve_final_cost
  end

  def reject_final_cost
    CaseFinalCostService.new(case_record: @case, current_user: @current_user).reject_final_cost
  end
end
