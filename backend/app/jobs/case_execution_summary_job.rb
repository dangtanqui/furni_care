class CaseExecutionSummaryJob < ApplicationJob
  queue_as :default

  def perform(case_id)
    case_record = Case.find(case_id)
    return unless case_record.current_stage == StageConstants::STAGE_5
    
    contact_email = case_record.contact&.email.presence
    return unless contact_email.present?
    
    CaseMailer.execution_summary(case_record).deliver_now
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.warn "CaseExecutionSummaryJob: Case #{case_id} not found - #{e.message}"
  rescue => e
    Rails.logger.error "CaseExecutionSummaryJob failed: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    raise
  end
end
