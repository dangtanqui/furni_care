class ApplicationController < ActionController::API
  before_action :authorize_request
  
  private
  
  def authorize_request
    header = request.headers['Authorization']
    header = header.split(' ').last if header
    
    begin
      decoded = JWT.decode(header, jwt_secret, true, algorithm: 'HS256')
      @current_user = User.find(decoded[0]['user_id'])
    rescue ActiveRecord::RecordNotFound, JWT::DecodeError
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end
  
  def current_user
    @current_user
  end
  
  def jwt_secret
    ENV['JWT_SECRET'] || 'default_secret'
  end
  
  def encode_token(payload)
    JWT.encode(payload, jwt_secret, 'HS256')
  end
end
