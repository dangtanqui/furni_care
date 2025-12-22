class Api::SitesController < ApplicationController
  def contacts
    site = Site.find(params[:id])
    contacts = site.contacts.order(:name)
    render json: ContactSerializer.collection(contacts)
  end
end

