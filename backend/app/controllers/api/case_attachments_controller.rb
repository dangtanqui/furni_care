class Api::CaseAttachmentsController < ApplicationController
  include Rails.application.routes.url_helpers
  before_action :set_case

  def create
    return render json: { error: 'No files uploaded' }, status: :bad_request unless params[:files].present?

    stage = params[:stage].to_i
    attachment_type = params[:attachment_type].presence || "stage_#{stage}"

    attachments = params[:files].map do |upload|
      attachment = @case.case_attachments.create!(stage: stage, attachment_type: attachment_type)
      attachment.file.attach(upload)
      serialize_attachment(attachment)
    end

    render json: { stage: stage, attachments: attachments }, status: :created
  end

  private

  def set_case
    @case = Case.find(params[:case_id])
  end

  def serialize_attachment(attachment)
    {
      id: attachment.id,
      filename: attachment.file.filename.to_s,
      url: rails_blob_url(attachment.file, host: request.base_url),
      stage: attachment.stage,
      attachment_type: attachment.attachment_type
    }
  end
end

