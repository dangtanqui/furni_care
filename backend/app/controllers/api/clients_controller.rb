class Api::ClientsController < ApplicationController
  def index
    clients = Client.all.order(:name)
    render json: ClientSerializer.collection(clients)
  end
  
  def sites
    client = Client.find(params[:id])
    sites = client.sites.order(:name)
    render json: SiteSerializer.collection(sites)
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Record not found' }, status: :not_found
  end
end

