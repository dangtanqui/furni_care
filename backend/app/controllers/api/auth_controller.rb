class Api::AuthController < ApplicationController
  include ServiceResponse
  
  skip_before_action :authorize_request, only: [:login, :register]
  
  def login
    result = AuthService.new.login(
      email: params[:email],
      password: params[:password],
      jwt_secret: jwt_secret
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

