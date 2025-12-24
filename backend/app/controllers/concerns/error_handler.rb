# Concern for handling errors consistently across controllers
module ErrorHandler
  extend ActiveSupport::Concern

  included do
    rescue_from ActiveRecord::RecordNotFound, with: :handle_record_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :handle_record_invalid
    rescue_from ActionController::ParameterMissing, with: :handle_parameter_missing
    rescue_from StandardError, with: :handle_standard_error
  end

  private

  def handle_record_not_found(exception)
    render json: { error: 'Record not found' }, status: :not_found
  end

  def handle_record_invalid(exception)
    render json: { errors: exception.record.errors.messages }, status: :unprocessable_entity
  end

  def handle_parameter_missing(exception)
    render json: { error: "Missing parameter: #{exception.param}" }, status: :bad_request
  end

  def handle_standard_error(exception)
    # Track error with error tracking service
    ErrorTracker.capture_exception(exception, {
      user_id: current_user&.id,
      request_path: request.path,
      request_method: request.method,
      params: params.to_unsafe_h.except(:password, :password_confirmation)
    })
    
    Rails.logger.error "Unhandled error: #{exception.class} - #{exception.message}"
    Rails.logger.error exception.backtrace.join("\n")
    
    if Rails.env.development?
      render json: { 
        error: exception.message, 
        backtrace: exception.backtrace 
      }, status: :internal_server_error
    else
      render json: { error: 'Internal server error' }, status: :internal_server_error
    end
  end
end
