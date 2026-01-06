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

    attachments = []
    created_attachments = []
    
    begin
      files.each do |upload|
        attachment = nil
        begin
          attachment = @case.case_attachments.create!(stage: stage_num, attachment_type: attachment_type)
          attachment.file.attach(upload)
          created_attachments << attachment
          
          # Try to serialize attachment - if this fails, we need to clean up
          serialized = serialize_attachment(attachment)
          attachments << serialized
        rescue => e
          # If attachment creation or serialization fails, clean up this attachment
          attachment&.destroy
          Rails.logger.error("Failed to create attachment: #{e.message}")
          Rails.logger.error(e.backtrace.join("\n"))
          raise e
        end
      end
    rescue => e
      # If any attachment fails, clean up all created attachments
      created_attachments.each(&:destroy)
      error_message = e.message
      # Provide a more user-friendly error message for Redis errors
      if error_message.include?('Redis') || error_message.include?('ECONNREFUSED')
        return failure(['Redis is not available. Please start Redis server and try again.'], status: :service_unavailable)
      end
      return failure(["Failed to process attachments: #{error_message}"], status: :internal_server_error)
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
      begin
        helper.rails_blob_url(blob_attachment, host: @request.base_url)
      rescue => e
        # Fallback if rails_blob_url fails (e.g., Redis not available)
        construct_fallback_url(blob_attachment)
      end
    else
      # Fallback: construct URL manually if helper not available
      construct_fallback_url(blob_attachment)
    end
  end

  def construct_fallback_url(blob_attachment)
    blob = blob_attachment.blob if blob_attachment.respond_to?(:blob)
    blob ||= blob_attachment
    begin
      signed_id = blob.signed_id
      filename = blob.filename.to_s
      "#{@request.base_url}/rails/active_storage/blobs/redirect/#{signed_id}/#{filename}"
    rescue => e
      # If signed_id fails (e.g., Redis not available), use a temporary URL
      # This should not happen in production, but handles development gracefully
      Rails.logger.error("Failed to generate blob URL: #{e.message}")
      "#{@request.base_url}/rails/active_storage/blobs/redirect/#{blob.id}/#{blob.filename}"
    end
  end
end
