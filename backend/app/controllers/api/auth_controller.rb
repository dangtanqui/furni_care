class Api::AuthController < ApplicationController
  skip_before_action :authorize_request, only: [:login, :register]
  
  def login
    user = User.find_by(email: params[:email])
    
    if user&.authenticate(params[:password])
      token = encode_token({ user_id: user.id })
      render json: { token: token, user: user_json(user) }
    else
      render json: { error: 'Invalid email or password' }, status: :unauthorized
    end
  end
  
  def register
    user = User.new(user_params)
    
    if user.save
      token = encode_token({ user_id: user.id })
      render json: { token: token, user: user_json(user) }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end
  
  def me
    render json: { user: user_json(current_user) }
  end
  
  private
  
  def user_params
    params.permit(:email, :password, :name, :role, :phone)
  end
  
  def user_json(user)
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone
    }
  end
end

