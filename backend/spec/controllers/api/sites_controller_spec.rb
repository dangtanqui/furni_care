require 'rails_helper'

RSpec.describe Api::SitesController, type: :controller do
  let(:user) { create(:user) }
  let(:client) { create(:client) }
  let(:site) { create(:site, client: client) }
  let(:contact1) { create(:contact, site: site, name: 'Contact B') }
  let(:contact2) { create(:contact, site: site, name: 'Contact A') }
  let(:other_contact) { create(:contact) } # Different site

  before do
    allow(controller).to receive(:current_user).and_return(user)
    allow(controller).to receive(:authorize_request)
    contact1
    contact2
    other_contact
  end

  describe 'GET #contacts' do
    it 'returns contacts for the specified site sorted by name' do
      get :contacts, params: { id: site.id }

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      expect(json_response).to be_an(Array)
      expect(json_response.length).to eq(2)
      
      # Verify sorted by name
      names = json_response.map { |c| c['name'] }
      expect(names).to eq(['Contact A', 'Contact B'])
      
      # Verify all contacts belong to the site
      contact_ids = json_response.map { |c| c['id'] }
      expect(contact_ids).to contain_exactly(contact1.id, contact2.id)
      expect(contact_ids).not_to include(other_contact.id)
    end

    it 'returns empty array when site has no contacts' do
      site_without_contacts = create(:site, client: client)
      get :contacts, params: { id: site_without_contacts.id }

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      expect(json_response).to eq([])
    end

    it 'returns 404 when site does not exist' do
      get :contacts, params: { id: 99999 }

      expect(response).to have_http_status(:not_found)
      json_response = JSON.parse(response.body)
      expect(json_response['error']).to eq('Record not found')
    end

    it 'returns contacts with correct structure' do
      contact = create(:contact, site: site, name: 'Test Contact', phone: '1234567890')
      get :contacts, params: { id: site.id }

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      contact_data = json_response.find { |c| c['id'] == contact.id }
      expect(contact_data).to be_present
      expect(contact_data['id']).to eq(contact.id)
      expect(contact_data['name']).to eq('Test Contact')
      expect(contact_data['phone']).to eq('1234567890')
    end
  end
end

