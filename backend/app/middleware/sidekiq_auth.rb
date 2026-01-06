module SidekiqAuth
  class Middleware
    def initialize(app)
      @app = app
    end

    def call(env)
      request = Rack::Request.new(env)
      
      # Allow access if user is authenticated via JWT token
      if authenticated?(request)
        @app.call(env)
      else
        [401, { 'Content-Type' => 'text/plain' }, ['Unauthorized']]
      end
    end

    private

    def authenticated?(request)
      # Check for JWT token in Authorization header
      auth_header = request.env['HTTP_AUTHORIZATION']
      return false unless auth_header
      
      token = auth_header.split(' ').last
      return false unless token
      
      begin
        jwt_secret = ENV['JWT_SECRET'] || 'default_secret'
        decoded = JWT.decode(token, jwt_secret, true, { 
          algorithm: 'HS256',
          verify_expiration: true 
        })
        user_id = decoded[0]['user_id']
        # Verify user exists and is admin/leader (optional - adjust based on your requirements)
        user = User.find_by(id: user_id)
        return false unless user
        # Only allow CS or Leader roles to access Sidekiq (adjust as needed)
        ['cs', 'leader'].include?(user.role.downcase)
      rescue JWT::DecodeError, JWT::ExpiredSignature, ActiveRecord::RecordNotFound
        false
      end
    end
  end
end

