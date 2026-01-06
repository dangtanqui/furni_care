class CaseFinalCostService < BaseService
  include StageConstants

  def initialize(case_record:, current_user:)
    @case = case_record
    @current_user = current_user
  end

  def approve_final_cost
    # Authorization is handled by controller via Policy
    @case.reload # Ensure we have the latest data
    unless @case.current_stage == STAGE_5
      return failure(['Final cost can only be approved in Stage 5'], status: :unprocessable_entity)
    end
    
    # Allow 0 as a valid final cost value, but nil is not allowed
    # Check both the object attribute and reload from database to be sure
    if @case.final_cost.nil?
      return failure(['Final cost must be set before approval'], status: :unprocessable_entity)
    end
    
    ActiveRecord::Base.transaction do
      @case.update(
        final_cost_status: CaseConstants::FINAL_COST_STATUSES[:APPROVED],
        final_cost_approved_by: @current_user,
        approved_final_cost: @case.final_cost, # Save the approved value for comparison later
        status: CaseConstants::STATUSES[:COMPLETED] # but CS still needs to close the case
      )
      BusinessEventLogger.log_final_cost_approved(case_id: @case.id, user_id: @current_user.id)
      success(@case.reload)
    end
  end

  def reject_final_cost
    # Authorization is handled by controller via Policy
    # When final cost is rejected, set status to 'rejected' (similar to Stage 3 cost rejection)
    unless @case.current_stage == STAGE_5
      return failure(['Final cost can only be rejected in Stage 5'])
    end
    
    ActiveRecord::Base.transaction do
      @case.update(
        final_cost_status: CaseConstants::FINAL_COST_STATUSES[:REJECTED],
        status: CaseConstants::STATUSES[:REJECTED] # similar to Stage 3 cost rejection
      )
      BusinessEventLogger.log_final_cost_rejected(case_id: @case.id, user_id: @current_user.id)
      success(@case.reload)
    end
  end

  def handle_final_cost_update(old_final_cost_status = nil)
    @case.reload
    
    # Don't update final_cost_status if case is being closed
    # When closing, final_cost_status should remain as approved
    if @case.status == CaseConstants::STATUSES[:CLOSED]
      return
    end
    
    # Use provided old_final_cost_status or fallback to current status if not provided
    was_rejected = (old_final_cost_status || @case.final_cost_status) == CaseConstants::FINAL_COST_STATUSES[:REJECTED]
    
    # Get old and new final_cost values
    # Use attribute_was to get the previous value before the update
    old_final_cost = @case.attribute_was(:final_cost)
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
          final_cost_status: CaseConstants::FINAL_COST_STATUSES[:PENDING],
          final_cost_approved_by_id: nil,
          status: CaseConstants::STATUSES[:PENDING] # wait for Leader approval
        }
        @case.update(update_attrs)
      else
        # Final cost is same as estimated cost - no approval needed, but still reset case status
        update_attrs = {
          final_cost_status: nil,
          final_cost_approved_by_id: nil,
          status: CaseConstants::STATUSES[:PENDING] # reset case status
        }
        @case.update(update_attrs)
      end
    elsif final_cost_value_changed
      if differs_from_estimated
        # Final cost is different from estimated cost (including 0 vs non-zero) - need Leader approval
        # Set status to 'pending' to wait for Leader approval (similar to Stage 3)
        update_attrs = {
          final_cost_status: CaseConstants::FINAL_COST_STATUSES[:PENDING],
          final_cost_approved_by_id: nil,
          status: CaseConstants::STATUSES[:PENDING] # wait for Leader approval
        }
        @case.update(update_attrs)
      elsif !new_final_cost.nil? && !differs_from_estimated
        # Final cost is same as estimated cost (including both being 0) - no approval needed
        # Set status to 'completed' since no approval is needed, case can be completed
        update_attrs = {
          final_cost_status: nil,
          final_cost_approved_by_id: nil,
          status: CaseConstants::STATUSES[:COMPLETED] # no approval needed, can complete
        }
        @case.update(update_attrs)
      end
    elsif @case.final_cost_status == CaseConstants::FINAL_COST_STATUSES[:APPROVED]
      # If was approved and CS changes the value, reset to pending
      @case.update(
        final_cost_status: CaseConstants::FINAL_COST_STATUSES[:PENDING],
        final_cost_approved_by_id: nil
      )
    end
  end
end
