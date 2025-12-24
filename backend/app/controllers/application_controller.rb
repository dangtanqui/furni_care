class ApplicationController < ActionController::API
  include ErrorHandler
  
  before_action :authorize_request
  
  private
  
  def authorize_request
    header = request.headers['Authorization']
    header = header.split(' ').last if header
    
    begin
      # Decode with expiration validation
      decoded = JWT.decode(header, jwt_secret, true, { 
        algorithm: 'HS256',
        verify_expiration: true 
      })
      @current_user = User.find(decoded[0]['user_id'])
    rescue ActiveRecord::RecordNotFound, JWT::DecodeError, JWT::ExpiredSignature
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end
  
  def current_user
    @current_user
  end
  
  def jwt_secret
    secret = ENV['JWT_SECRET']
    
    if secret.blank?
      if Rails.env.production?
        raise 'JWT_SECRET environment variable must be set in production'
      else
        Rails.logger.warn 'JWT_SECRET not set, using default secret (NOT SECURE FOR PRODUCTION)'
        'default_secret'
      end
    elsif Rails.env.production? && secret == 'default_secret'
      raise 'JWT_SECRET cannot be "default_secret" in production'
    else
      secret
    end
  end
  
  def encode_token(payload)
    JWT.encode(payload, jwt_secret, 'HS256')
  end
end
