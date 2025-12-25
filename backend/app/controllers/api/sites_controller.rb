class Api::SitesController < ApplicationController
  def contacts
    site = Site.find(params[:id])
    contacts = site.contacts.order(:name)
    render json: ContactSerializer.collection(contacts)
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Record not found' }, status: :not_found
  end
end

