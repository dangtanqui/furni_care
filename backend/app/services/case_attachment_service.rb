# Service for case attachment operations
class CaseAttachmentService < BaseService
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
    attachment = @case.case_attachments.find(attachment_id)
    attachment.destroy
    success(nil)
  end

  private

  def serialize_attachment(attachment)
    {
      id: attachment.id,
      filename: attachment.file.filename.to_s,
      url: rails_blob_url(attachment.file, host: @request.base_url),
      stage: attachment.stage,
      attachment_type: attachment.attachment_type
    }
  end

  def rails_blob_url(attachment, host:)
    Rails.application.routes.url_helpers.rails_blob_url(attachment, host: host)
  end
end
