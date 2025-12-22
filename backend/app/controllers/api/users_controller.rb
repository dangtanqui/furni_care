class Api::UsersController < ApplicationController
  def technicians
    users = User.where(role: 'technician').order(:name)
    render json: UserSerializer.collection(users)
  end
end

