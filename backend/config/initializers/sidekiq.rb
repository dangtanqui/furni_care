# Sidekiq configuration for background job processing
redis_url = ENV['REDIS_URL'] || 'redis://localhost:6379/0'

# Get queue prefix from Rails config or environment variable
queue_prefix = if defined?(Rails) && Rails.application.config.active_job.queue_name_prefix.present?
  Rails.application.config.active_job.queue_name_prefix
elsif ENV['SIDEKIQ_QUEUE_PREFIX'].present?
  ENV['SIDEKIQ_QUEUE_PREFIX']
else
  # Fallback: derive from RAILS_ENV
  env = ENV.fetch("RAILS_ENV", "development")
  case env
  when "production"
    "furnicare_production"
  when "development"
    "furnicare_development"
  when "test"
    "furnicare_test"
  else
    "furnicare_#{env}"
  end
end

Sidekiq.configure_server do |config|
  config.redis = { url: redis_url, size: ENV.fetch("SIDEKIQ_REDIS_POOL_SIZE", 10).to_i }
  
  # Configure queues with prefix to match ActiveJob queue_name_prefix
  # This ensures queues match the prefix set in config/environments/*.rb
  config.queues = ["#{queue_prefix}_critical", "#{queue_prefix}_default", "#{queue_prefix}_low"]
end

Sidekiq.configure_client do |config|
  config.redis = { url: redis_url, size: ENV.fetch("SIDEKIQ_REDIS_POOL_SIZE", 5).to_i }
end

