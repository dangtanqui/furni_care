# Concern for handling errors consistently across controllers
module ErrorHandler
  extend ActiveSupport::Concern

  included do
    rescue_from ActiveRecord::RecordNotFound, with: :handle_record_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :handle_record_invalid
    rescue_from ActionController::ParameterMissing, with: :handle_parameter_missing
    rescue_from ApplicationError, with: :handle_application_error
    rescue_from AuthorizationError, with: :handle_authorization_error
    rescue_from BusinessLogicError, with: :handle_business_logic_error
    rescue_from ValidationError, with: :handle_validation_error
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

  def handle_application_error(exception)
    render json: { 
      error: exception.message,
      details: exception.details
    }, status: exception.status
  end

  def handle_authorization_error(exception)
    render json: { 
      error: exception.message,
      details: exception.details
    }, status: exception.status
  end

  def handle_business_logic_error(exception)
    render json: { 
      error: exception.message,
      details: exception.details
    }, status: exception.status
  end

  def handle_validation_error(exception)
    error_response = if exception.errors.is_a?(Hash) && exception.errors.any?
                       { errors: exception.errors }
                     else
                       { error: exception.message }
                     end
    render json: error_response, status: exception.status
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
