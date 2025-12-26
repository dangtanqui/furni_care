# Rate limiting configuration using Rack::Attack
# Protects against brute force attacks and API abuse

require 'rack/attack'

class Rack::Attack
  # Use Redis for cache store in production, MemoryStore for development/test
  # Initialize after Rails is fully loaded to ensure cache store is available
  Rails.application.config.after_initialize do
    if Rails.env.production? && ENV['REDIS_URL'].present?
      # In production, use Redis
      begin
        redis_url = ENV['REDIS_URL']
        self.cache.store = ActiveSupport::Cache::RedisCacheStore.new({
          url: redis_url,
          namespace: 'furnicare:rack_attack'
        })
      rescue => e
        Rails.logger.error "Failed to initialize Redis for Rack::Attack: #{e.message}"
        Rails.logger.error "Falling back to MemoryStore (not recommended for production)"
        self.cache.store = ActiveSupport::Cache::MemoryStore.new
      end
    else
      # Use MemoryStore for development/test (or if Redis is not configured)
      self.cache.store = ActiveSupport::Cache::MemoryStore.new
    end
  end

  # Enable logging
  ActiveSupport::Notifications.subscribe('rack.attack') do |name, start, finish, request_id, payload|
    request = payload.is_a?(Hash) ? payload[:request] || payload['request'] : payload
    if request
      match_type = request.env['rack.attack.match_type']
      path = request.path rescue request.env['REQUEST_PATH'] || 'unknown'
      Rails.logger.warn "[Rack::Attack] #{match_type} - #{path}"
    end
  end

  # Throttle all requests by IP (100 requests per minute)
  throttle('req/ip', limit: 100, period: 1.minute) do |req|
    req.ip unless req.path.start_with?('/api/health')
  end

  # Throttle login attempts by IP
  # Higher limits in development for testing
  if Rails.env.development?
    throttle('logins/ip', limit: 50, period: 1.minute) do |req|
      if req.path == '/api/auth/login' && req.post?
        req.ip
      end
    end
    
    throttle('logins/email', limit: 50, period: 1.minute) do |req|
      if req.path == '/api/auth/login' && req.post?
        # Normalize email to prevent case-based bypass
        req.params['email'].to_s.downcase.gsub(/\s+/, '') if req.params['email']
      end
    end
  else
    # Production limits: 5 attempts per 20 minutes
    throttle('logins/ip', limit: 5, period: 20.minutes) do |req|
      if req.path == '/api/auth/login' && req.post?
        req.ip
      end
    end
    
    throttle('logins/email', limit: 5, period: 20.minutes) do |req|
      if req.path == '/api/auth/login' && req.post?
        # Normalize email to prevent case-based bypass
        req.params['email'].to_s.downcase.gsub(/\s+/, '') if req.params['email']
      end
    end
  end

  # Throttle registration attempts by IP (3 registrations per hour)
  throttle('registrations/ip', limit: 3, period: 1.hour) do |req|
    if req.path == '/api/auth/register' && req.post?
      req.ip
    end
  end

  # Custom response for throttled requests
  self.throttled_responder = lambda do |request|
    match_data = request.env['rack.attack.match_data']
    now = match_data[:epoch_time]
    period_seconds = match_data[:period]
    reset_time = now + (period_seconds - now % period_seconds)
    retry_after = reset_time - now
    retry_after_minutes = (retry_after / 60.0).ceil
    
    headers = {
      'Content-Type' => 'application/json',
      'X-RateLimit-Limit' => match_data[:limit].to_s,
      'X-RateLimit-Remaining' => '0',
      'X-RateLimit-Reset' => reset_time.to_s,
      'Retry-After' => retry_after.to_s
    }
    
    body = {
      error: 'Too many requests. Please try again later.',
      message: "Rate limit exceeded. Please try again in #{retry_after_minutes} minute#{retry_after_minutes != 1 ? 's' : ''}.",
      retry_after: retry_after,
      retry_after_minutes: retry_after_minutes
    }.to_json
    
    [429, headers, [body]]
  end
end

