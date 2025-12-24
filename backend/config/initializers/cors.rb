Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # In production, restrict to specific origins
    # In development/test, allow all for easier development
    origins Rails.env.production? ? ENV.fetch('CORS_ALLOWED_ORIGINS', '').split(',').map(&:strip) : '*'
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ['Authorization'],
      credentials: Rails.env.production? # Allow credentials in production if needed
  end
end
