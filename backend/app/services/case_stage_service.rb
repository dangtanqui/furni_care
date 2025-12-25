# Service for case stage transitions and stage-related operations
class CaseStageService < BaseService
  include StageConstants

  def initialize(case_record:, current_user:)
    @case = case_record
    @current_user = current_user
  end

  def advance_stage
    @case.reload
    
    return failure(['Already at final stage']) if @case.current_stage >= STAGE_5
    
    # Check cost approval for stage 3
    if @case.current_stage == STAGE_3 && @case.cost_required && @case.cost_status != CaseConstants::COST_STATUSES[:APPROVED]
      return failure(['Cost approval required before advancing'])
    end
    
    # Check estimated_cost is present when cost_required is true (0 is allowed as a valid value)
    if @case.current_stage == STAGE_3 && @case.cost_required && @case.estimated_cost.nil?
      return failure(['Estimated cost is required when cost is required'])
    end
    
    old_stage = @case.current_stage
    new_stage = @case.current_stage + 1
    update_attrs = { current_stage: new_stage }
    
    # If advancing from Stage 1 to Stage 2, Stage 2 to Stage 3, Stage 3 to Stage 4, set status to in_progress
    if @case.current_stage == STAGE_1 || @case.current_stage == STAGE_2 || @case.current_stage == STAGE_3
      update_attrs[:status] = CaseConstants::STATUSES[:IN_PROGRESS]
    # If advancing from Stage 4 to Stage 5
    elsif new_stage == STAGE_5
      # If cost was required and approved in Stage 3, CS needs to input final cost
      # So status should be 'in_progress' to allow CS to work on final cost
      # Only set status to 'completed' if no cost was required
      if @case.cost_required && @case.cost_status == CaseConstants::COST_STATUSES[:APPROVED]
        update_attrs[:status] = CaseConstants::STATUSES[:IN_PROGRESS] # CS needs to input final cost
      else
        update_attrs[:status] = CaseConstants::STATUSES[:COMPLETED] # no cost required, can complete
      end
    end
    
    # Wrap in transaction to ensure atomicity
    ActiveRecord::Base.transaction do
      return failure(@case.errors.messages) unless @case.update(update_attrs)

      result_case = @case.reload
      
      # Log stage advancement event
      BusinessEventLogger.log_stage_advanced(
        case_id: result_case.id,
        user_id: @current_user.id,
        from_stage: old_stage,
        to_stage: new_stage
      )
      
      # Send email notification when advancing to Stage 5 (after successful update)
      # Email is sent asynchronously and errors are caught, so it won't rollback the transaction
      send_execution_summary_email if new_stage == STAGE_5
      
      success(result_case)
    end
  end

  def redo_case
    ActiveRecord::Base.transaction do
      # Reset cost-related fields when redoing case
      update_params = {
        current_stage: STAGE_3,
        attempt_number: @case.attempt_number + 1,
        status: CaseConstants::STATUSES[:IN_PROGRESS],
        cost_status: nil,
        cost_approved_by_id: nil
      }
      
      # If final_cost_status was approved, reset to 'pending' when redoing back to Stage 3
      if @case.final_cost_status == CaseConstants::FINAL_COST_STATUSES[:APPROVED]
        update_params[:final_cost_status] = CaseConstants::FINAL_COST_STATUSES[:PENDING]
      end
      
      if @case.update(update_params)
        success(@case.reload)
      else
        failure(@case.errors.messages)
      end
    end
  end

  private

  def send_execution_summary_email
    # Enqueue background job to send email notification when advancing to Stage 5
    # Email is sent asynchronously, so errors won't block the stage advancement
    if @case.current_stage == STAGE_5
      begin
        CaseExecutionSummaryJob.perform_later(@case.id)
      rescue => e
        # Log error but don't fail the operation
        Rails.logger.error "Failed to enqueue execution summary email job: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
      end
    end
  end
end

