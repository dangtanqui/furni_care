class CaseMailer < ApplicationMailer
  def execution_summary(case_record)
    @case = case_record
    @contact = case_record.contact
    @client = case_record.client
    @site = case_record.site
    
    # Get recipient email from contact
    recipient_email = @contact&.email.presence
    
    return unless recipient_email.present?
    
    # Header information
    @priority = case_record.priority
    @attempt_number = case_record.attempt_number
    
    # Stage 1 information
    @description = case_record.description
    @case_type = case_record.case_type
    
    # Stage 2 information
    @investigation_report = case_record.investigation_report
    @investigation_checklist = parse_checklist(case_record.investigation_checklist, [
      'Check furniture condition',
      'Document damage areas',
      'Take measurements'
    ])
    
    # Stage 3 information
    @root_cause = case_record.root_cause
    @solution_description = case_record.solution_description
    @planned_execution_date = case_record.planned_execution_date
    @cost_required = case_record.cost_required
    @estimated_cost = case_record.estimated_cost
    @cost_description = case_record.cost_description
    @solution_checklist = parse_checklist(case_record.solution_checklist, [
      'Prepare materials',
      'Schedule with client'
    ])
    
    # Stage 4 information (already in template but ensure available)
    @execution_report = case_record.execution_report
    @execution_checklist = parse_checklist(case_record.execution_checklist, [
      'Work completed as planned',
      'Client satisfied with work'
    ])
    @client_feedback = case_record.client_feedback
    @client_rating = case_record.client_rating
    
    mail(
      to: recipient_email,
      subject: "Case #{@case.case_number} - Execution Summary"
    )
  end
  
  private
  
  def parse_checklist(checklist_json, item_names)
    return [] if checklist_json.blank?
    
    begin
      checklist_array = JSON.parse(checklist_json)
      item_names.map.with_index do |name, index|
        {
          name: name,
          checked: checklist_array[index] == true
        }
      end
    rescue JSON::ParserError
      []
    end
  end
end
