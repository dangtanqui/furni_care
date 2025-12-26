# Sentry configuration for error tracking
if ENV['SENTRY_DSN'].present?
  Sentry.init do |config|
    config.dsn = ENV['SENTRY_DSN']
    config.breadcrumbs_logger = [:active_support_logger, :http_logger]
    
    # Performance monitoring - sample 50% of transactions
    config.traces_sample_rate = ENV.fetch('SENTRY_TRACES_SAMPLE_RATE', '0.5').to_f
    
    # Environment
    config.environment = Rails.env
    
    # Release version
    config.release = ENV['APP_VERSION'] || 'unknown'
    
    # Filter sensitive data
    config.before_send = lambda do |event, hint|
      # Filter out sensitive parameters
      if event.request && event.request.data.is_a?(Hash)
        sensitive_keys = %w[password password_confirmation token secret api_key]
        event.request.data = event.request.data.transform_values do |value|
          if value.is_a?(Hash)
            value.transform_values { |v| sensitive_keys.include?(v.to_s) ? '[FILTERED]' : v }
          elsif sensitive_keys.any? { |key| event.request.data.key?(key) }
            '[FILTERED]'
          else
            value
          end
        end
      end
      event
    end
  end
end

