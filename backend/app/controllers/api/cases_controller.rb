class Api::CasesController < ApplicationController
  include Authorizable
  include ServiceResponse
  
  before_action :set_case, only: [:show, :update, :destroy, :advance_stage, :approve_cost, :reject_cost, :approve_final_cost, :reject_final_cost, :cancel_case, :redo_case]
  
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
    @case = Case.includes(
      :client, :site, :contact, :assigned_to, :created_by,
      :cost_approved_by, :final_cost_approved_by,
      case_attachments: { file_attachment: :blob }
    ).find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Case not found by id: #{params[:id]}" }, status: :not_found
  end
  
  def create_case_params
    params.permit(
      :client_id, :site_id, :contact_id,
      :description, :case_type, :priority
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
