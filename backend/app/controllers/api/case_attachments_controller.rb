class Api::CaseAttachmentsController < ApplicationController
  include ServiceResponse
  
  before_action :set_case

  def create
    result = CaseAttachmentService.new(case_record: @case, request: request).create(
      files: params[:files],
      stage: params[:stage],
      attachment_type: params[:attachment_type]
    )
    
    if result.success?
      render json: result.data, status: :created
    else
      render_service_result(result)
    end
  end

  def destroy
    result = CaseAttachmentService.new(case_record: @case, request: request).destroy(
      attachment_id: params[:id]
    )
    
    if result.success?
      head :no_content
    else
      render_service_result(result)
    end
  end

  private

  def set_case
    # For create: params[:id] is the case id
    # For destroy: params[:case_id] is the case id, params[:id] is the attachment id
    case_id = params[:case_id] || params[:id]
    @case = Case.find(case_id)
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Record not found' }, status: :not_found
  end
end

