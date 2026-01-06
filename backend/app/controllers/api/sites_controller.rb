class Api::SitesController < ApplicationController
  def contacts
    site = Site.find(params[:id])
    contacts = site.contacts.order(:name)
    render json: ContactSerializer.collection(contacts)
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Site not found by id: #{params[:id]}" }, status: :not_found
  end
end
