class CaseCostService < BaseService
  include StageConstants

  def initialize(case_record:, current_user:)
    @case = case_record
    @current_user = current_user
  end

  def approve_cost
    # Authorization is handled by controller via Policy
    # Check estimated_cost is present when cost_required is true (0 is allowed as a valid value)
    if @case.cost_required && @case.estimated_cost.nil?
      return failure(['Estimated cost is required when cost is required'])
    end
    
    ActiveRecord::Base.transaction do
      @case.update(
        cost_status: CaseConstants::COST_STATUSES[:APPROVED],
        current_stage: STAGE_4,
        status: CaseConstants::STATUSES[:IN_PROGRESS],
        cost_approved_by: @current_user
      )
      
      BusinessEventLogger.log_cost_approved(case_id: @case.id, user_id: @current_user.id)
      success(@case.reload)
    end
  end

  def reject_cost
    # Authorization is handled by controller via Policy
    # When cost is rejected, keep case at Stage 3 so CS can cancel or Technician can update cost
    # Set status to 'rejected' to indicate the case was rejected
    ActiveRecord::Base.transaction do
      @case.update(
        cost_status: CaseConstants::COST_STATUSES[:REJECTED],
        status: CaseConstants::STATUSES[:REJECTED]
      )
      BusinessEventLogger.log_cost_rejected(case_id: @case.id, user_id: @current_user.id)
      success(@case.reload)
    end
  end

  def handle_cost_update
    # If cost fields are updated and cost was previously rejected, reset cost_status
    if @case.cost_status == CaseConstants::COST_STATUSES[:REJECTED]
      @case.update(cost_status: nil, status: CaseConstants::STATUSES[:PENDING])
    end
    
    # If cost fields are updated and cost was previously approved, reset cost_status
    # This allows Technician to update cost and re-submit for approval
    # Note: This check happens after the rejected check, so we need to reload
    @case.reload
    if @case.cost_status == CaseConstants::COST_STATUSES[:APPROVED]
      @case.update(cost_status: nil, status: CaseConstants::STATUSES[:PENDING], cost_approved_by_id: nil)
    end
  end
end
