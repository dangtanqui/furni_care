class Api::ClientsController < ApplicationController
  def index
    clients = Client.all.order(:name)
    render json: clients.map { |c| { id: c.id, name: c.name, code: c.code } }
  end
  
  def sites
    client = Client.find(params[:id])
    sites = client.sites.order(:name)
    render json: sites.map { |s| { id: s.id, name: s.name, city: s.city } }
  end
end

