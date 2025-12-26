# Error tracking service wrapper using Sentry
module ErrorTracker
  class << self
    # Track exception
    # @param exception [Exception] The exception to track
    # @param context [Hash] Additional context (user, request, etc.)
    def capture_exception(exception, context = {})
      if defined?(Sentry) && Sentry.configuration.dsn.present?
        Sentry.capture_exception(exception, contexts: { custom: context })
      else
        # Fallback to Rails logger if Sentry is not configured
        Rails.logger.error "ErrorTracker: #{exception.class} - #{exception.message}"
        Rails.logger.error "Context: #{context.inspect}" if context.present?
        Rails.logger.error exception.backtrace.join("\n") if exception.respond_to?(:backtrace)
      end
    rescue => e
      # Ensure we always log even if Sentry fails
      Rails.logger.error "Sentry error: #{e.message}"
      Rails.logger.error "Original error: #{exception.class} - #{exception.message}"
    end

    # Track message
    # @param message [String] Error message
    # @param level [Symbol] Severity level (:error, :warning, :info)
    # @param context [Hash] Additional context
    def capture_message(message, level = :error, context = {})
      if defined?(Sentry) && Sentry.configuration.dsn.present?
        Sentry.capture_message(message, level: level, contexts: { custom: context })
      else
        # Fallback to Rails logger if Sentry is not configured
        Rails.logger.public_send(level, "ErrorTracker: #{message}")
        Rails.logger.public_send(level, "Context: #{context.inspect}") if context.present?
      end
    rescue => e
      # Ensure we always log even if Sentry fails
      Rails.logger.public_send(level, "Sentry error: #{e.message}")
      Rails.logger.public_send(level, "ErrorTracker: #{message}")
    end

    # Set user context for error tracking
    # @param user [User] Current user
    def set_user(user)
      return unless defined?(Sentry) && Sentry.configuration.dsn.present?
      
      Sentry.set_user(
        id: user.id,
        email: user.email,
        username: user.name
      )
    rescue => e
      Rails.logger.error "Sentry set_user error: #{e.message}"
    end

    # Clear user context
    def clear_user
      return unless defined?(Sentry) && Sentry.configuration.dsn.present?
      
      Sentry.set_user(nil)
    rescue => e
      Rails.logger.error "Sentry clear_user error: #{e.message}"
    end
  end
end
