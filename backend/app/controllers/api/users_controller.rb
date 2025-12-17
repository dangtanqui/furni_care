class Api::UsersController < ApplicationController
  def technicians
    users = User.where(role: 'technician').order(:name)
    render json: users.map { |u| { id: u.id, name: u.name } }
  end
end

