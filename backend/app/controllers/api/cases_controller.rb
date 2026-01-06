# API Controller for case management endpoints
# 
# Endpoints:
#   GET    /api/cases - List cases with filtering, sorting, and pagination (authorized users only)
#   GET    /api/cases/:id - Get case details (authorized users only)
#   POST   /api/cases - Create new case (CS only)
#   PUT    /api/cases/:id - Update case (authorized users only)
#   DELETE /api/cases/:id - Delete case (CS only)
#   POST   /api/cases/:id/advance_stage - Advance case to next stage (authorized users only)
#   POST   /api/cases/:id/approve_cost - Approve cost estimate (Leader only)
#   POST   /api/cases/:id/reject_cost - Reject cost estimate (Leader only)
#   POST   /api/cases/:id/approve_final_cost - Approve final cost (Leader only)
#   POST   /api/cases/:id/reject_final_cost - Reject final cost (Leader only)
#   POST   /api/cases/:id/redo_case - Redo case from Stage 5 (CS only)
#   POST   /api/cases/:id/cancel_case - Cancel case (CS only)
class Api::CasesController < ApplicationController
  include Authorizable
  include ServiceResponse
  
  before_action :set_case, only: [:show, :update, :destroy, :advance_stage, :approve_cost, :reject_cost, :approve_final_cost, :reject_final_cost, :cancel_case]
  
  # GET /api/cases
  # List cases with filtering, sorting, and pagination
  # @param status [String] Filter by status (open, pending, in_progress, completed, closed, rejected, cancelled)
  # @param case_type [String] Filter by case type
  # @param assigned_to [String|Integer] Filter by assigned technician ID or 'unassigned'
  # @param stage [Integer] Filter by current stage (1-5)
  # @param sort_by [String] Sort field (case_number, client, site, current_stage, status, priority, assigned_to, created_at)
  # @param sort_direction [String] Sort direction (asc, desc)
  # @param page [Integer] Page number (default: 1)
  # @param per_page [Integer] Items per page (default: 20, max: 100)
  # @return [JSON] { data: [cases], pagination: { page, per_page, total, total_pages } }
  def index
    result = CaseQueryService.call(params: params, current_user: current_user)
    
    if result.success?
      render json: {
        data: result.data[:data].map { |c| CaseSerializer.new(c).as_json },
        pagination: result.data[:pagination]
      }
    else
      render_service_result(result)
    end
  end
  
  def show
    render json: CaseSerializer.new(@case, request: request).as_json(detail: true)
  end
  
  def create
    authorize_case_action(:create)
    # Use create_case_params to exclude fields that shouldn't be set during creation
    @case = Case.new(create_case_params)
    result = CaseService.new(case_record: @case, current_user: current_user).create
    render_service_result(result, serializer: CaseSerializer, detail: true, status: :created)
  end
  
  def update
    authorize_case_action(:update)
    result = CaseService.new(case_record: @case, current_user: current_user).update(case_params)
    render_service_result(result, serializer: CaseSerializer, detail: true)
  end
  
  def advance_stage
    authorize_case_action(:advance_stage)
    result = CaseService.new(case_record: @case, current_user: current_user).advance_stage
    render_service_result(result, serializer: CaseSerializer, detail: true)
  end
  
  def approve_cost
    authorize_case_action(:approve_cost)
    result = CaseService.new(case_record: @case, current_user: current_user).approve_cost
    render_service_result(result, serializer: CaseSerializer, detail: true)
  end
  
  def reject_cost
    authorize_case_action(:reject_cost)
    result = CaseService.new(case_record: @case, current_user: current_user).reject_cost
    render_service_result(result, serializer: CaseSerializer, detail: true)
  end
  
  def redo_case
    @case = Case.find(params[:id]) # TODO: Use set_case method instead
    authorize_case_action(:redo, @case)
    result = CaseService.new(case_record: @case, current_user: current_user).redo_case
    render_service_result(result, serializer: CaseSerializer, detail: true)
  end

  def cancel_case
    authorize_case_action(:cancel)
    result = CaseService.new(case_record: @case, current_user: current_user).cancel_case
    render_service_result(result, serializer: CaseSerializer, detail: true)
  end

  def approve_final_cost
    authorize_case_action(:approve_final_cost)
    # TODO: Why do we need to reload the case here?
    @case.reload # Ensure we have the latest data before calling service
    result = CaseService.new(case_record: @case, current_user: current_user).approve_final_cost
    render_service_result(result, serializer: CaseSerializer, detail: true)
  end

  def reject_final_cost
    authorize_case_action(:reject_final_cost)
    result = CaseService.new(case_record: @case, current_user: current_user).reject_final_cost
    render_service_result(result, serializer: CaseSerializer, detail: true)
  end
  
  def destroy
    authorize_case_action(:destroy)
    @case.destroy
    head :no_content
  end
  
  private
  
  def set_case
    # Eager load all associations to avoid N + 1 queries in serializer
    @case = Case.includes(
      :client, :site, :contact, :assigned_to, :created_by,
      :cost_approved_by, :final_cost_approved_by,
      case_attachments: { file_attachment: :blob }
    ).find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Case not found by id: #{params[:id]}" }, status: :not_found
  end
  
  def create_case_params
    # Only permit fields that can be set during case creation
    # current_stage and status are set by the service
    # assigned_to_id can be set during creation if explicitly provided
    params.permit(
      :client_id, :site_id, :contact_id,
      :description, :case_type, :priority,
      :assigned_to_id
    )
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
      :final_cost, :final_cost_status,
      :status
    )
  end
end

