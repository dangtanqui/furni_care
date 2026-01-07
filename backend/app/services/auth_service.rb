class AuthService < BaseService
  def initialize(current_user: nil)
    @current_user = current_user
  end

  def login(email:, password:, jwt_secret:, expires_in: 30.days)
    user = User.find_by(email: email)
    
    if user&.authenticate(password)
      expires_at = expires_in.from_now.to_i
      token = encode_token({ 
        user_id: user.id,
        exp: expires_at,
        iat: Time.now.to_i
      }, jwt_secret)
      success({ token: token, user: serialize_user(user) })
    else
      failure(['Invalid email or password'], status: :unauthorized)
    end
  end

  def register(user_params:, jwt_secret:)
    user = User.new(user_params)
    
    if user.save
      token = encode_token({ user_id: user.id }, jwt_secret)
      success({ token: token, user: serialize_user(user) })
    else
      failure(user.errors.full_messages)
    end
  end

  def current_user_data(current_user)
    success({ user: serialize_user(current_user) })
  end

  private

  def serialize_user(user)
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone
    }
  end

  def encode_token(payload, jwt_secret)
    JWT.encode(payload, jwt_secret, 'HS256')
  end
end
