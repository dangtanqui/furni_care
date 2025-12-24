# Rate limiting configuration using Rack::Attack
# Protects against brute force attacks and API abuse

require 'rack/attack'

class Rack::Attack
  # Configure cache store (use same as Rails cache)
  self.cache.store = ActiveSupport::Cache::MemoryStore.new

  # Enable logging
  ActiveSupport::Notifications.subscribe('rack.attack') do |name, start, finish, request_id, req|
    Rails.logger.warn "[Rack::Attack] #{req.env['rack.attack.match_type']} - #{req.path}"
  end

  # Throttle all requests by IP (100 requests per minute)
  throttle('req/ip', limit: 100, period: 1.minute) do |req|
    req.ip unless req.path.start_with?('/api/health')
  end

  # Throttle login attempts by IP (5 attempts per 20 minutes)
  throttle('logins/ip', limit: 5, period: 20.minutes) do |req|
    if req.path == '/api/auth/login' && req.post?
      req.ip
    end
  end

  # Throttle login attempts by email (5 attempts per 20 minutes)
  # This prevents brute force attacks on specific accounts
  throttle('logins/email', limit: 5, period: 20.minutes) do |req|
    if req.path == '/api/auth/login' && req.post?
      # Normalize email to prevent case-based bypass
      req.params['email'].to_s.downcase.gsub(/\s+/, '') if req.params['email']
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
    
    headers = {
      'Content-Type' => 'application/json',
      'X-RateLimit-Limit' => match_data[:limit].to_s,
      'X-RateLimit-Remaining' => '0',
      'X-RateLimit-Reset' => (now + (match_data[:period] - now % match_data[:period])).to_s
    }
    
    body = {
      error: 'Too many requests. Please try again later.',
      retry_after: match_data[:period]
    }.to_json
    
    [429, headers, [body]]
  end
end

