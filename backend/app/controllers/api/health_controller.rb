class Api::HealthController < ApplicationController
  skip_before_action :authorize_request
  
  def index
    render json: { status: 'ok', timestamp: Time.current.iso8601 }
  end
end

