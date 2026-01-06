require "active_support/core_ext/integer/time"

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # Code is not reloaded between requests.
  config.enable_reloading = false

  # Eager load code on boot. This eager loads most of Rails and
  # your application in memory, allowing both threaded web servers
  # and those relying on copy on write to perform better.
  # Rake tasks automatically ignore this option for performance.
  config.eager_load = true

  # Full error reports are disabled and caching is turned on.
  config.consider_all_requests_local = false

  # Ensures that a master key has been made available in ENV["RAILS_MASTER_KEY"], config/master.key, or an environment
  # key such as config/credentials/production.key. This key is used to decrypt credentials (and other encrypted files).
  # config.require_master_key = true

  # Disable serving static files from `public/`, relying on NGINX/Apache to do so instead.
  # config.public_file_server.enabled = false

  # Enable serving of images, stylesheets, and JavaScripts from an asset server.
  # config.asset_host = "http://assets.example.com"

  # Specifies the header that your server uses for sending files.
  # config.action_dispatch.x_sendfile_header = "X-Sendfile" # for Apache
  # config.action_dispatch.x_sendfile_header = "X-Accel-Redirect" # for NGINX

  # Use AWS S3 for file storage in production
  config.active_storage.service = :amazon

  # Mount Action Cable outside main process or domain.
  # config.action_cable.mount_path = nil # Not used - ActionCable disabled
  # config.action_cable.url = "wss://example.com/cable" # Not used - ActionCable disabled
  # config.action_cable.allowed_request_origins = [ "http://example.com", /http:\/\/example.*/ ] # Not used - ActionCable disabled

  # Assume all access to the app is happening through a SSL-terminating reverse proxy.
  # Can be used together with config.force_ssl for Strict-Transport-Security and secure cookies.
  # config.assume_ssl = true

  # Force all access to the app over SSL, use Strict-Transport-Security, and use secure cookies.
  config.force_ssl = true

  # Log to STDOUT by default
  config.logger = ActiveSupport::Logger.new(STDOUT)
    .tap  { |logger| logger.formatter = ::Logger::Formatter.new }
    .then { |logger| ActiveSupport::TaggedLogging.new(logger) }

  # Prepend all log lines with the following tags.
  config.log_tags = [ :request_id ]

  # "info" includes generic and useful information about system operation, but avoids logging too much
  # information to avoid inadvertent exposure of personally identifiable information (PII). If you
  # want to log everything, set the level to "debug".
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")

  # Use Redis for caching in production
  # Note: If you encounter connection_pool compatibility issues with Rails 7.1,
  # try one of these solutions:
  # 1. Upgrade connection_pool: gem 'connection_pool', '~> 2.4'
  # 2. Use redis-store directly: gem 'redis-store', '~> 1.10'
  # 3. Use the configuration below which avoids connection_pool dependency
  # Tôi đã comment code này vì build lỗi trên production, chắc có lẻ do sài redis free nên k đủ tài nguyên
  # if ENV['REDIS_URL'].present? || ENV['REDIS_CACHE_URL'].present?
  #   redis_cache_url = ENV['REDIS_CACHE_URL'] || ENV['REDIS_URL']
  #   begin
  #     # Try using redis_cache_store with explicit pool configuration
  #     config.cache_store = :redis_cache_store, {
  #       url: redis_cache_url,
  #       namespace: 'furnicare:cache',
  #       expires_in: 90.minutes,
  #       pool_size: 5,
  #       pool_timeout: 5
  #     }
  #   rescue => e
  #     # Fallback to memory store if Redis cache store fails
  #     Rails.logger.warn "Failed to initialize Redis cache store: #{e.message}. Falling back to memory store."
  #     config.cache_store = :memory_store
  #   end
  # else
  config.cache_store = :memory_store
  # end

  # Use Sidekiq for background job processing
  config.active_job.queue_adapter = :sidekiq
  config.active_job.queue_name_prefix = "furnicare_production"

  config.action_mailer.perform_caching = false
  config.action_mailer.default_url_options = { host: ENV['MAILER_HOST'] || 'localhost' }
  
  # Ignore bad email addresses and do not raise email delivery errors.
  # Set this to true and configure the email server for immediate delivery to raise delivery errors.
  config.action_mailer.raise_delivery_errors = false
  config.action_mailer.delivery_method = :smtp
  
  # SMTP configuration for email delivery
  config.action_mailer.smtp_settings = {
    address: ENV['SMTP_ADDRESS'] || 'smtp.gmail.com',
    port: ENV['SMTP_PORT'] || 587,
    domain: ENV['SMTP_DOMAIN'] || 'gmail.com',
    user_name: ENV['SMTP_USERNAME'],
    password: ENV['SMTP_PASSWORD'],
    authentication: :plain,
    enable_starttls_auto: true
  }

  # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
  # the I18n.default_locale when a translation cannot be found).
  config.i18n.fallbacks = true

  # Don't log any deprecations.
  config.active_support.report_deprecations = false

  # Do not dump schema after migrations.
  config.active_record.dump_schema_after_migration = false

  # Enable DNS rebinding protection and other `Host` header attacks.
  # config.hosts = [
  #   "example.com",     # Allow requests from example.com
  #   /.*\.example\.com/ # Allow requests from subdomains like `www.example.com`
  # ]
  # Skip DNS rebinding protection for the default health check endpoint.
  # config.host_authorization = { exclude: ->(request) { request.path == "/up" } }
end
