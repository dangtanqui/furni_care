class CaseStageService < BaseService
  include StageConstants

  def initialize(case_record:, current_user:)
    @case = case_record
    @current_user = current_user
  end

  def advance_stage
    old_stage = @case.current_stage
    return failure(['Already at final stage']) if old_stage >= STAGE_5
    
    # Check cost approval for stage 3
    if old_stage == STAGE_3 && @case.cost_required
      return failure(['Cost approval required before advancing']) if @case.cost_status != CaseConstants::COST_STATUSES[:APPROVED]
      # Check estimated_cost is present when cost_required is true (0 is allowed as a valid value)
      return failure(['Estimated cost is required when cost is required']) if @case.estimated_cost.nil?
    end
    
    new_stage = old_stage + 1
    update_attrs = { current_stage: new_stage }
    
    if old_stage == STAGE_1 || old_stage == STAGE_2 || old_stage == STAGE_3
      update_attrs[:status] = CaseConstants::STATUSES[:IN_PROGRESS]
    elsif old_stage == STAGE_4
      if @case.cost_required && @case.cost_status == CaseConstants::COST_STATUSES[:APPROVED]
        update_attrs[:status] = CaseConstants::STATUSES[:IN_PROGRESS] 
      else
        update_attrs[:status] = CaseConstants::STATUSES[:COMPLETED]
      end
    end
    
    ActiveRecord::Base.transaction do
      return failure(@case.errors.messages) unless @case.update(update_attrs)

      BusinessEventLogger.log_stage_advanced(
        case_id: @case.id,
        user_id: @current_user.id,
        from_stage: old_stage,
        to_stage: new_stage
      )
      
      send_execution_summary_email if old_stage == STAGE_4
      
      success(@case)
    end
  end

  def redo_case
    ActiveRecord::Base.transaction do
      update_params = {
        current_stage: STAGE_3,
        attempt_number: @case.attempt_number + 1,
        status: CaseConstants::STATUSES[:IN_PROGRESS],
        cost_status: nil,
        cost_approved_by_id: nil,
        final_cost_status: nil,
        final_cost_approved_by_id: nil
      }
      
      if @case.update(update_params)
        success(@case)
      else
        failure(@case.errors.messages)
      end
    end
  end

  private

  def send_execution_summary_email
    begin
      CaseExecutionSummaryJob.perform_later(@case.id)
    rescue => e
      Rails.logger.error "Failed to enqueue execution summary email job: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
    end
  end
end
