# API Controller for authentication endpoints
# 
# Endpoints:
#   POST /api/auth/login - Authenticate user and return JWT token
#     Params: email (string), password (string), remember_me (boolean, optional)
#     Returns: { token: string, user: { id, email, name, role, phone } }
#   
#   POST /api/auth/register - Register new user
#     Params: email, password, name, role, phone (optional)
#     Returns: { token: string, user: { id, email, name, role, phone } }
#   
#   GET /api/auth/me - Get current authenticated user
#     Requires: Authorization header with Bearer token
#     Returns: { user: { id, email, name, role, phone } }
class Api::AuthController < ApplicationController
  include ServiceResponse
  
  skip_before_action :authorize_request, only: [:login, :register]
  
  # POST /api/auth/login
  # Authenticate user with email and password
  # @param email [String] User email
  # @param password [String] User password
  # @param remember_me [Boolean] Optional - if true, token expires in 30 days, else 1 day
  # @return [JSON] { token: string, user: object }
  def login
    remember_me = params[:remember_me] == true || params[:remember_me] == 'true'
    expires_in = remember_me ? 30.days : 1.day
    
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

