# Service for serializing case data to JSON
class CaseSerializer
  include Rails.application.routes.url_helpers

  def initialize(case_record, request: nil)
    @case = case_record
    @request = request
  end

  def as_json(options = {})
    if options[:detail]
      case_detail_json
    else
      case_json
    end
  end

  private

  def case_json
    {
      id: @case.id,
      case_number: @case.case_number,
      client: @case.client&.name,
      site: @case.site&.name,
      current_stage: @case.current_stage,
      stage_name: @case.stage_name,
      status: @case.status,
      priority: @case.priority,
      assigned_to: @case.assigned_to&.name,
      created_at: @case.created_at
    }
  end

  def case_detail_json
    {
      id: @case.id,
      case_number: @case.case_number,
      current_stage: @case.current_stage,
      stage_name: @case.stage_name,
      status: @case.status,
      attempt_number: @case.attempt_number,
      
      # Relations
      client: { id: @case.client_id, name: @case.client&.name },
      site: { id: @case.site_id, name: @case.site&.name, city: @case.site&.city },
      contact: { id: @case.contact_id, name: @case.contact&.name, phone: @case.contact&.phone },
      created_by: { id: @case.created_by_id, name: @case.created_by&.name },
      assigned_to: @case.assigned_to ? { id: @case.assigned_to_id, name: @case.assigned_to.name } : nil,
      
      # Stage 1
      description: @case.description,
      case_type: @case.case_type,
      priority: @case.priority,
      
      # Stage 2
      investigation_report: @case.investigation_report,
      investigation_checklist: @case.investigation_checklist,
      
      # Stage 3
      root_cause: @case.root_cause,
      solution_description: @case.solution_description,
      solution_checklist: @case.solution_checklist,
      planned_execution_date: @case.planned_execution_date,
      cost_required: @case.cost_required,
      estimated_cost: @case.estimated_cost,
      cost_description: @case.cost_description,
      cost_status: @case.cost_status,
      
      # Stage 4
      execution_report: @case.execution_report,
      execution_checklist: @case.execution_checklist,
      client_signature: @case.client_signature,
      client_feedback: @case.client_feedback,
      client_rating: @case.client_rating,
      
      # Stage 5
      cs_notes: @case.cs_notes,
      final_feedback: @case.final_feedback,
      final_rating: @case.final_rating,

      stage_attachments: attachments_hash,
      
      created_at: @case.created_at,
      updated_at: @case.updated_at
    }
  end

  def attachments_hash
    return {} unless @request
    
    @case.case_attachments.includes(file_attachment: :blob).group_by(&:stage).transform_values do |atts|
      atts.map do |attachment|
        {
          id: attachment.id,
          filename: attachment.file.filename.to_s,
          url: rails_blob_url(attachment.file, host: @request.base_url),
          stage: attachment.stage,
          attachment_type: attachment.attachment_type
        }
      end
    end
  end
end
