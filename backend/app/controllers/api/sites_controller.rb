class Api::SitesController < ApplicationController
  def contacts
    site = Site.find(params[:id])
    contacts = site.contacts.order(:name)
    render json: contacts.map { |c| { id: c.id, name: c.name, phone: c.phone, email: c.email } }
  end
end

