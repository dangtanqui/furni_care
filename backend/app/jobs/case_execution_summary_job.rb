# Background job for sending case execution summary email
class CaseExecutionSummaryJob < ApplicationJob
  queue_as :default

  def perform(case_id)
    case_record = Case.find(case_id)
    
    # Only send if case is at Stage 5
    return unless case_record.current_stage == StageConstants::STAGE_5
    
    contact_email = case_record.contact&.email.presence
    client_email = case_record.client&.email.presence
    
    # Only send if there's an email address
    return unless contact_email.present? || client_email.present?
    
    CaseMailer.execution_summary(case_record).deliver_now
  rescue ActiveRecord::RecordNotFound => e
    # Case was deleted, log but don't raise
    Rails.logger.warn "CaseExecutionSummaryJob: Case #{case_id} not found - #{e.message}"
  rescue => e
    # Log error but don't fail the job (email failures shouldn't block the operation)
    Rails.logger.error "CaseExecutionSummaryJob failed: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    # Re-raise to allow job retry mechanism if configured
    raise
  end
end

