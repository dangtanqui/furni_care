class CaseAttachmentService < BaseService
  include ActionView::Helpers::UrlHelper
  include Rails.application.routes.url_helpers

  def initialize(case_record:, request:)
    @case = case_record
    @request = request
  end

  def create(files:, stage:, attachment_type: nil)
    return failure(['No files uploaded'], status: :bad_request) unless files.present?

    stage_num = stage.to_i
    attachment_type ||= "stage_#{stage_num}"

    attachments = files.map do |upload|
      attachment = @case.case_attachments.create!(stage: stage_num, attachment_type: attachment_type)
      attachment.file.attach(upload)
      serialize_attachment(attachment)
    end

    success({ stage: stage_num, attachments: attachments })
  end

  def destroy(attachment_id:)
    attachment = @case.case_attachments.find_by(id: attachment_id)
    return failure(['Attachment not found'], status: :not_found) unless attachment
    
    attachment.destroy
    success(nil)
  end

  private

  def serialize_attachment(attachment)
    {
      id: attachment.id,
      filename: attachment.file.filename.to_s,
      url: blob_url(attachment.file),
      stage: attachment.stage,
      attachment_type: attachment.attachment_type
    }
  end

  def blob_url(blob_attachment)
    # Use rails_blob_url directly since we've included Rails.application.routes.url_helpers
    # Ensure routes are loaded by calling it in a way that works in both app and test contexts
    helper = Rails.application.routes.url_helpers
    if helper.respond_to?(:rails_blob_url)
      helper.rails_blob_url(blob_attachment, host: @request.base_url)
    else
      # Fallback: construct URL manually if helper not available
      blob = blob_attachment.blob if blob_attachment.respond_to?(:blob)
      blob ||= blob_attachment
      signed_id = blob.signed_id
      filename = blob.filename.to_s
      "#{@request.base_url}/rails/active_storage/blobs/redirect/#{signed_id}/#{filename}"
    end
  end
end
