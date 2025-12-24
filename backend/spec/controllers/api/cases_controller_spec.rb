require 'rails_helper'

RSpec.describe Api::CasesController, type: :controller do
  let(:cs_user) { create(:user, :cs) }
  let(:technician_user) { create(:user, :technician) }
  let(:leader_user) { create(:user, :leader) }
  let(:client) { create(:client) }
  let(:site) { create(:site, client: client) }
  let(:contact) { create(:contact, site: site) }

  before do
    allow(controller).to receive(:current_user).and_return(cs_user)
    allow(controller).to receive(:authorize_request)
  end

  describe 'GET #index' do
    before do
      create_list(:case, 5, created_by: cs_user, client: client, site: site, contact: contact)
    end

    it 'returns list of cases' do
      get :index

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      expect(json_response['data']).to be_an(Array)
      expect(json_response['pagination']).to be_present
    end

    it 'supports pagination' do
      get :index, params: { page: 1, per_page: 2 }

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      expect(json_response['data'].length).to eq(2)
      expect(json_response['pagination']['per_page']).to eq(2)
    end

    it 'supports filtering by status' do
      create(:case, status: 'closed', created_by: cs_user, client: client, site: site, contact: contact)
      get :index, params: { status: 'open' }

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      json_response['data'].each do |case_data|
        expect(case_data['status']).to eq('open')
      end
    end
  end

  describe 'GET #show' do
    let(:case_record) { create(:case, created_by: cs_user, client: client, site: site, contact: contact) }

    it 'returns case details' do
      get :show, params: { id: case_record.id }

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      # CaseSerializer returns hash directly (not wrapped in 'data' key)
      expect(json_response['id']).to eq(case_record.id)
      expect(json_response['case_number']).to eq(case_record.case_number)
    end

    it 'returns 404 for non-existent case' do
      # set_case will catch ActiveRecord::RecordNotFound and return 404
      get :show, params: { id: 99999 }
      
      expect(response).to have_http_status(:not_found)
      json_response = JSON.parse(response.body)
      expect(json_response['error']).to eq('Record not found')
    end
  end

  describe 'POST #create' do
    let(:case_params) do
      {
        client_id: client.id,
        site_id: site.id,
        contact_id: contact.id,
        description: 'New case',
        case_type: 'repair',
        priority: 'medium'
      }
    end

    it 'creates new case' do
      post :create, params: case_params

      expect(response).to have_http_status(:created)
      json_response = JSON.parse(response.body)
      # CaseSerializer returns hash directly (not wrapped in 'data' key)
      expect(json_response['description']).to eq('New case')
      expect(Case.find_by(description: 'New case')).to be_present
    end

    it 'returns validation errors for invalid case' do
      post :create, params: case_params.merge(client_id: nil)

      expect(response).to have_http_status(:unprocessable_entity)
      json_response = JSON.parse(response.body)
      expect(json_response['errors']).to be_present
    end
  end

  describe 'PUT #update' do
    let(:case_record) { create(:case, created_by: cs_user, client: client, site: site, contact: contact) }

    before do
      allow(controller).to receive(:authorize_case_action)
    end

    it 'updates case' do
      put :update, params: { id: case_record.id, description: 'Updated description' }

      expect(response).to have_http_status(:success)
      case_record.reload
      expect(case_record.description).to eq('Updated description')
    end
  end

  describe 'POST #advance_stage' do
    let(:case_record) { create(:case, :stage_1, created_by: cs_user, client: client, site: site, contact: contact) }

    before do
      allow(controller).to receive(:authorize_case_action)
    end

    it 'advances case stage' do
      post :advance_stage, params: { id: case_record.id }

      expect(response).to have_http_status(:success)
      case_record.reload
      expect(case_record.current_stage).to eq(2)
    end
  end

  describe 'POST #approve_cost' do
    let(:case_record) { create(:case, :stage_3_with_cost, created_by: cs_user, assigned_to: technician_user, client: client, site: site, contact: contact) }

    before do
      allow(controller).to receive(:current_user).and_return(leader_user)
      allow(controller).to receive(:authorize_case_action)
    end

    it 'approves cost' do
      post :approve_cost, params: { id: case_record.id }

      expect(response).to have_http_status(:success)
      case_record.reload
      expect(case_record.cost_status).to eq('approved')
    end
  end

  describe 'POST #cancel_case' do
    let(:case_record) { create(:case, :stage_3, created_by: cs_user, client: client, site: site, contact: contact) }

    before do
      allow(controller).to receive(:authorize_case_action)
    end

    it 'cancels case' do
      post :cancel_case, params: { id: case_record.id }

      expect(response).to have_http_status(:success)
      case_record.reload
      expect(case_record.status).to eq('cancelled')
    end
  end
end

