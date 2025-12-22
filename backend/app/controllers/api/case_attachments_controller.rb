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
    @case = Case.find(params[:id])
  end
end

