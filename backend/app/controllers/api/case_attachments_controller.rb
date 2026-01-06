class Api::CaseAttachmentsController < ApplicationController
  include ServiceResponse
  
  before_action :set_case

  def create
    result = CaseAttachmentService.new(case_record: @case, request: request).create(
      files: params[:files],
      stage: params[:stage],
      attachment_type: params[:attachment_type]
    )
    
    render_service_result(result, status: :created) # TODO: Test this
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
    case_id = params[:case_id] || params[:id] # TODO: Thống nhất sử dụng case_id cho tất cả các endpoints
    @case = Case.find(case_id)
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Case not found by id: #{params[:case_id] || params[:id]}" }, status: :not_found
  end
end
