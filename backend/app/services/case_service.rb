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
    
    # Check if final_cost is in params
    # Store old final_cost_status before update to check if it was rejected
    old_final_cost_status = @case.final_cost_status if case_params.key?(:final_cost)
    
    final_cost_updated = if case_params.key?(:final_cost)
      old_final_cost = @case.final_cost
      new_final_cost = case_params[:final_cost].blank? ? nil : case_params[:final_cost].to_f
      # Check if value changed OR if it was rejected (need to reset status even if value unchanged)
      old_final_cost.to_f != new_final_cost.to_f || old_final_cost_status == Case::FINAL_COST_STATUSES[2] # 'rejected'
    else
      false
    end
    
    ActiveRecord::Base.transaction do
      if @case.update(case_params)
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
    if @case.current_stage == 3 && @case.cost_required && @case.cost_status != Case::COST_STATUSES[1] # 'approved'
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
      if @case.cost_required && @case.cost_status == Case::COST_STATUSES[1] # 'approved'
        update_attrs[:status] = Case::STATUSES[2] # 'in_progress' - CS needs to input final cost
      else
        update_attrs[:status] = Case::STATUSES[3] # 'completed' - no cost required, can complete
      end
    # If advancing from Stage 1 to Stage 2, set status to in_progress
    elsif @case.current_stage == 1
      update_attrs[:status] = Case::STATUSES[2] # 'in_progress'
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
    # When cost is rejected, keep case at Stage 3 so CS can cancel or Technician can update cost
    # Only update cost_status, keep current_stage at 3, and set status to 'pending' for further action
    ActiveRecord::Base.transaction do
      @case.update(
        cost_status: Case::COST_STATUSES[2], # 'rejected'
        status: Case::STATUSES[1], # 'pending' - allows CS to cancel or Technician to update cost
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
        status: Case::STATUSES[2], # 'in_progress'
        cost_status: nil,
        cost_approved_by_id: nil
      }
      
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
    @case.update(status: Case::STATUSES[7]) # 'cancelled'
    success(@case.reload)
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
        final_cost_status: Case::FINAL_COST_STATUSES[1], # 'approved'
        final_cost_approved_by: @current_user,
        status: Case::STATUSES[3] # 'completed' - but CS still needs to close the case
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
        final_cost_status: Case::FINAL_COST_STATUSES[2], # 'rejected'
        status: Case::STATUSES[5] # 'rejected' - similar to Stage 3 cost rejection
      )
      success(@case.reload)
    end
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

  def handle_final_cost_update(final_cost_updated, old_final_cost_status = nil)
    return unless final_cost_updated
    
    @case.reload
    
    # Use provided old_final_cost_status or fallback to current status if not provided
    was_rejected = (old_final_cost_status || @case.final_cost_status) == Case::FINAL_COST_STATUSES[2] # 'rejected'
    
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
          final_cost_status: Case::FINAL_COST_STATUSES[0], # 'pending'
          final_cost_approved_by_id: nil,
          status: Case::STATUSES[1] # 'pending' - wait for Leader approval
        }
        @case.update(update_attrs)
      else
        # Final cost is same as estimated cost - no approval needed, but still reset case status
        update_attrs = {
          final_cost_status: nil,
          final_cost_approved_by_id: nil,
          status: Case::STATUSES[1] # 'pending' - reset case status
        }
        @case.update(update_attrs)
      end
    elsif final_cost_value_changed
      if differs_from_estimated
        # Final cost is different from estimated cost (including 0 vs non-zero) - need Leader approval
        # Set status to 'pending' to wait for Leader approval (similar to Stage 3)
        update_attrs = {
          final_cost_status: Case::FINAL_COST_STATUSES[0], # 'pending'
          final_cost_approved_by_id: nil,
          status: Case::STATUSES[1] # 'pending' - wait for Leader approval
        }
        @case.update(update_attrs)
      elsif !new_final_cost.nil? && !differs_from_estimated
        # Final cost is same as estimated cost (including both being 0) - no approval needed, clear status
        # Don't set to 'approved', just leave it nil (no approval needed)
        update_attrs = {
          final_cost_status: nil,
          final_cost_approved_by_id: nil
        }
        @case.update(update_attrs)
      end
    elsif @case.final_cost_status == Case::FINAL_COST_STATUSES[1] # 'approved'
      # If was approved and CS changes the value, reset to pending
      @case.update(
        final_cost_status: Case::FINAL_COST_STATUSES[0], # 'pending'
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
