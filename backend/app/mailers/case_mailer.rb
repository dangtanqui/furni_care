class CaseMailer < ApplicationMailer
  def execution_summary(case_record)
    @case = case_record
    @contact = case_record.contact
    @client = case_record.client
    @site = case_record.site
    
    # Get recipient email from contact or client
    recipient_email = @contact&.email.presence || @client&.email.presence
    
    return unless recipient_email.present?
    
    mail(
      to: recipient_email,
      subject: "Case #{@case.case_number} - Execution Summary"
    )
  end
end
