class Api::CasesController < ApplicationController
  include Rails.application.routes.url_helpers
  before_action :set_case, only: [:show, :update, :destroy, :advance_stage, :approve_cost, :reject_cost]
  
  def index
    cases = Case.includes(:client, :site, :contact, :assigned_to, :created_by)
    
    cases = cases.where(status: params[:status]) if params[:status].present?
    cases = cases.where(case_type: params[:case_type]) if params[:case_type].present?
    if params[:assigned_to].present?
      if params[:assigned_to] == 'unassigned'
        cases = cases.where(assigned_to_id: nil)
      else
        cases = cases.where(assigned_to_id: params[:assigned_to])
      end
    end
    cases = cases.where(current_stage: params[:stage]) if params[:stage].present?
    
    # Sorting
    sort_by = params[:sort_by] || 'created_at'
    sort_direction = params[:sort_direction]&.downcase == 'asc' ? 'asc' : 'desc'
    
    # Map frontend column names to database columns (whitelist for security)
    case sort_by
    when 'case_number'
      cases = cases.order(case_number: sort_direction.to_sym)
    when 'client'
      cases = cases.joins(:client).order('clients.name' => sort_direction.to_sym)
    when 'site'
      cases = cases.joins(:site).order('sites.name' => sort_direction.to_sym)
    when 'current_stage'
      cases = cases.order(current_stage: sort_direction.to_sym)
    when 'status'
      cases = cases.order(status: sort_direction.to_sym)
    when 'priority'
      cases = cases.order(priority: sort_direction.to_sym)
    when 'assigned_to'
      cases = cases.order(assigned_to_id: sort_direction.to_sym)
    else
      cases = cases.order(created_at: :desc)
    end
    
    # Pagination
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 20
    per_page = [per_page, 100].min # Max 100 per page
    
    total = cases.count
    paginated_cases = cases.offset((page - 1) * per_page).limit(per_page)
    
    render json: {
      data: paginated_cases.map { |c| case_json(c) },
      pagination: {
        page: page,
        per_page: per_page,
        total: total,
        total_pages: (total.to_f / per_page).ceil
      }
    }
  end
  
  def show
    render json: case_detail_json(@case)
  end
  
  def create
    @case = Case.new(case_params)
    @case.created_by = current_user
    @case.current_stage = 1
    @case.status = 'open'
    
    if @case.save
      render json: case_detail_json(@case), status: :created
    else
      render json: { errors: @case.errors.full_messages }, status: :unprocessable_entity
    end
  end
  
  def update
    # Check if cost fields are being updated
    cost_fields_updated = case_params.key?(:estimated_cost) || case_params.key?(:cost_description) || case_params.key?(:cost_required)
    
    if @case.update(case_params)
      # If cost fields are updated and cost was previously rejected, reset cost_status to nil and status to pending
      if cost_fields_updated && @case.cost_status == 'rejected'
        @case.update(cost_status: nil, status: 'pending')
        @case.reload
      end
      
      # If cost fields are updated and cost was previously approved, reset cost_status to nil and status to pending
      # This allows Technician to update cost and re-submit for approval
      if cost_fields_updated && @case.cost_status == 'approved'
        @case.update(cost_status: nil, status: 'pending', cost_approved_by_id: nil)
        @case.reload
      end
      
      # If Stage 3 cost is required but not approved, and case has advanced past Stage 3,
      # roll back to Stage 3 to wait for approval
      if @case.cost_required && @case.cost_status != 'approved' && @case.current_stage > 3
        @case.update(current_stage: 3)
        @case.reload
      end
      
      render json: case_detail_json(@case)
    else
      render json: { errors: @case.errors.full_messages }, status: :unprocessable_entity
    end
  end
  
  def destroy
    @case.destroy
    head :no_content
  end
  
  def advance_stage
    @case.reload # Ensure we have the latest data
    if @case.current_stage < 5
      # Check cost approval for stage 3
      if @case.current_stage == 3 && @case.cost_required && @case.cost_status != 'approved'
        return render json: { error: 'Cost approval required before advancing' }, status: :unprocessable_entity
      end
      
      @case.update(current_stage: @case.current_stage + 1)
      render json: case_detail_json(@case)
    else
      render json: { error: 'Already at final stage' }, status: :unprocessable_entity
    end
  end
  
  def approve_cost
    unless current_user.leader?
      return render json: { error: 'Only leaders can approve costs' }, status: :forbidden
    end
    
    @case.update(cost_status: 'approved', cost_approved_by: current_user)
    
    # If Stage 3 cost is approved and current_stage is 3, automatically advance to Stage 4
    if @case.current_stage == 3 && @case.cost_required && @case.cost_status == 'approved'
      @case.update(current_stage: 4)
      @case.reload
    end
    
    render json: case_detail_json(@case)
  end
  
  def reject_cost
    unless current_user.leader?
      return render json: { error: 'Only leaders can reject costs' }, status: :forbidden
    end
    
    @case.update(cost_status: 'rejected', status: 'rejected')
    render json: case_detail_json(@case)
  end
  
  def redo_case
    @case = Case.find(params[:id])
    @case.update(
      current_stage: 3,
      attempt_number: @case.attempt_number + 1,
      status: 'in_progress',
      cost_status: nil, # Reset cost_status to allow Technician to edit and re-submit
      cost_approved_by_id: nil # Clear previous approval
    )
    render json: case_detail_json(@case)
  end
  
  private
  
  def set_case
    @case = Case.find(params[:id])
  end
  
  def case_params
    params.permit(
      :client_id, :site_id, :contact_id, :assigned_to_id,
      :description, :case_type, :priority,
      :investigation_report, :investigation_checklist,
      :root_cause, :solution_description, :solution_checklist, :planned_execution_date,
      :cost_required, :estimated_cost, :cost_description,
      :execution_report, :execution_checklist, :client_signature, :client_feedback, :client_rating,
      :cs_notes, :final_feedback, :final_rating,
      :status
    )
  end
  
  def case_json(c)
    attachments_hash = c.case_attachments.includes(file_attachment: :blob).group_by(&:stage).transform_values do |atts|
      atts.map do |attachment|
        {
          id: attachment.id,
          filename: attachment.file.filename.to_s,
          url: rails_blob_url(attachment.file, host: request.base_url),
          stage: attachment.stage,
          attachment_type: attachment.attachment_type
        }
      end
    end

    {
      id: c.id,
      case_number: c.case_number,
      client: c.client&.name,
      site: c.site&.name,
      current_stage: c.current_stage,
      stage_name: c.stage_name,
      status: c.status,
      priority: c.priority,
      assigned_to: c.assigned_to&.name,
      created_at: c.created_at
    }
  end
  
  def case_detail_json(c)
    attachments_hash = c.case_attachments.includes(file_attachment: :blob).group_by(&:stage).transform_values do |atts|
      atts.map do |attachment|
        {
          id: attachment.id,
          filename: attachment.file.filename.to_s,
          url: rails_blob_url(attachment.file, host: request.base_url),
          stage: attachment.stage,
          attachment_type: attachment.attachment_type
        }
      end
    end

    {
      id: c.id,
      case_number: c.case_number,
      current_stage: c.current_stage,
      stage_name: c.stage_name,
      status: c.status,
      attempt_number: c.attempt_number,
      
      # Relations
      client: { id: c.client_id, name: c.client&.name },
      site: { id: c.site_id, name: c.site&.name, city: c.site&.city },
      contact: { id: c.contact_id, name: c.contact&.name, phone: c.contact&.phone },
      created_by: { id: c.created_by_id, name: c.created_by&.name },
      assigned_to: c.assigned_to ? { id: c.assigned_to_id, name: c.assigned_to.name } : nil,
      
      # Stage 1
      description: c.description,
      case_type: c.case_type,
      priority: c.priority,
      
      # Stage 2
      investigation_report: c.investigation_report,
      investigation_checklist: c.investigation_checklist,
      
      # Stage 3
      root_cause: c.root_cause,
      solution_description: c.solution_description,
      solution_checklist: c.solution_checklist,
      planned_execution_date: c.planned_execution_date,
      cost_required: c.cost_required,
      estimated_cost: c.estimated_cost,
      cost_description: c.cost_description,
      cost_status: c.cost_status,
      
      # Stage 4
      execution_report: c.execution_report,
      execution_checklist: c.execution_checklist,
      client_signature: c.client_signature,
      client_feedback: c.client_feedback,
      client_rating: c.client_rating,
      
      # Stage 5
      cs_notes: c.cs_notes,
      final_feedback: c.final_feedback,
      final_rating: c.final_rating,

      stage_attachments: attachments_hash,
      
      created_at: c.created_at,
      updated_at: c.updated_at
    }
  end
end

