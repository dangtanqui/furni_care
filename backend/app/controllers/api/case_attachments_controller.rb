class Api::CaseAttachmentsController < ApplicationController
  include ServiceResponse
  
  before_action :set_case

  def create
    result = CaseAttachmentService.new(case_record: @case, request: request).create(
      files: params[:files],
      stage: params[:stage],
      attachment_type: params[:attachment_type]
    )
    
    render_service_result(result, status: :created)
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
    # Both create and destroy use :case_id from nested route
    case_id = params[:case_id]
    @case = Case.find(case_id)
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Case not found by id: #{case_id}" }, status: :not_found
  end
end
