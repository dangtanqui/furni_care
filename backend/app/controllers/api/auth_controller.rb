class Api::AuthController < ApplicationController
  include ServiceResponse
  include AuthConstants
  
  skip_before_action :authorize_request, only: [:login, :register]
  
  def login
    # Normalize remember_me to boolean: accept boolean true or string "true", everything else is false
    remember_me = params[:remember_me] == true || params[:remember_me].to_s.downcase == "true"
    expires_in = remember_me ? REMEMBER_ME_EXPIRATION_DAYS.days : DEFAULT_EXPIRATION_DAYS.day
    
    result = AuthService.new.login(
      email: params[:email],
      password: params[:password],
      jwt_secret: jwt_secret,
      expires_in: expires_in
    )
    render_service_result(result)
  end
  
  def register
    result = AuthService.new.register(
      user_params: user_params,
      jwt_secret: jwt_secret
    )
    render_service_result(result, status: :created)
  end
  
  def me
    result = AuthService.new(current_user: current_user).current_user_data
    render_service_result(result)
  end
  
  private
  
  def user_params
    params.permit(:email, :password, :name, :role, :phone)
  end
end
