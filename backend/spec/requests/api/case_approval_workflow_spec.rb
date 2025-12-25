require 'rails_helper'

RSpec.describe 'Case Approval Workflow API', type: :request do
  let(:cs_user) { create(:user, :cs) }
  let(:technician_user) { create(:user, :technician) }
  let(:leader_user) { create(:user, :leader) }
  let(:client) { create(:client) }
  let(:site) { create(:site, client: client) }
  let(:contact) { create(:contact, site: site) }
  
  # Helper method to get JWT secret (same logic as ApplicationController#jwt_secret)
  def jwt_secret
    secret = ENV['JWT_SECRET']
    if secret.blank?
      AuthConstants::DEFAULT_JWT_SECRET
    else
      secret
    end
  end

  let(:auth_headers) do
    payload = { 
      user_id: cs_user.id,
      exp: 1.day.from_now.to_i
    }
    token = JWT.encode(payload, jwt_secret, AuthConstants::JWT_ALGORITHM)
    { 'Authorization' => "Bearer #{token}" }
  end
  
  let(:technician_auth_headers) do
    payload = { 
      user_id: technician_user.id,
      exp: 1.day.from_now.to_i
    }
    token = JWT.encode(payload, jwt_secret, AuthConstants::JWT_ALGORITHM)
    { 'Authorization' => "Bearer #{token}" }
  end
  
  let(:leader_auth_headers) do
    payload = { 
      user_id: leader_user.id,
      exp: 1.day.from_now.to_i
    }
    token = JWT.encode(payload, jwt_secret, AuthConstants::JWT_ALGORITHM)
    { 'Authorization' => "Bearer #{token}" }
  end

  describe 'Cost approval workflow' do
    let(:case_record) do
      create(:case, 
        :stage_3_with_cost,
        created_by: cs_user,
        assigned_to: technician_user,
        client: client,
        site: site,
        contact: contact
      )
    end

    it 'allows leader to approve cost and advance to stage 4' do
      case_id = case_record.id
      
      # Leader approves cost
      post "/api/cases/#{case_id}/approve_cost", headers: leader_auth_headers
      expect(response).to have_http_status(:ok)
      response_data = JSON.parse(response.body)
      case_data = response_data['data'] || response_data
      expect(case_data['cost_status']).to eq('approved')
      expect(case_data['current_stage']).to eq(4)
      expect(case_data['cost_approved_by']['id']).to eq(leader_user.id)
    end

    it 'allows leader to reject cost and keeps case at stage 3' do
      case_id = case_record.id
      
      # Leader rejects cost
      post "/api/cases/#{case_id}/reject_cost", headers: leader_auth_headers
      expect(response).to have_http_status(:ok)
      response_data = JSON.parse(response.body)
      case_data = response_data['data'] || response_data
      expect(case_data['cost_status']).to eq('rejected')
      expect(case_data['status']).to eq('rejected')
      expect(case_data['current_stage']).to eq(3) # Still at stage 3
    end

    it 'allows technician to update cost after rejection' do
      case_id = case_record.id
      
      # Leader rejects cost
      post "/api/cases/#{case_id}/reject_cost", headers: leader_auth_headers
      expect(response).to have_http_status(:ok)
      
      # Technician updates cost
      update_params = {
        estimated_cost: 1500.00,
        cost_description: 'Updated cost estimate'
      }
      put "/api/cases/#{case_id}", params: update_params, headers: technician_auth_headers
      expect(response).to have_http_status(:ok)
      response_data = JSON.parse(response.body)
      case_data = response_data['data'] || response_data
      expect(case_data['cost_status']).to be_nil # Reset after update
      expect(case_data['status']).to eq('pending')
    end
  end

  describe 'Final cost approval workflow' do
    let(:case_record) do
      create(:case,
        :stage_5,
        created_by: cs_user,
        assigned_to: technician_user,
        client: client,
        site: site,
        contact: contact,
        cost_required: true,
        cost_status: 'approved',
        estimated_cost: 1000.00,
        final_cost: 1200.00,
        final_cost_status: 'pending'
      )
    end

    it 'allows leader to approve final cost' do
      case_id = case_record.id
      
      # Leader approves final cost
      post "/api/cases/#{case_id}/approve_final_cost", headers: leader_auth_headers
      expect(response).to have_http_status(:ok)
      response_data = JSON.parse(response.body)
      case_data = response_data['data'] || response_data
      expect(case_data['final_cost_status']).to eq('approved')
      expect(case_data['status']).to eq('completed')
      expect(case_data['final_cost_approved_by']['id']).to eq(leader_user.id)
    end

    it 'allows leader to reject final cost' do
      case_id = case_record.id
      
      # Leader rejects final cost
      post "/api/cases/#{case_id}/reject_final_cost", headers: leader_auth_headers
      expect(response).to have_http_status(:ok)
      response_data = JSON.parse(response.body)
      case_data = response_data['data'] || response_data
      expect(case_data['final_cost_status']).to eq('rejected')
      expect(case_data['status']).to eq('rejected')
    end

    it 'allows CS to update final cost after rejection' do
      case_id = case_record.id
      
      # Leader rejects final cost
      post "/api/cases/#{case_id}/reject_final_cost", headers: leader_auth_headers
      expect(response).to have_http_status(:ok)
      
      # CS updates final cost
      update_params = {
        final_cost: 1100.00
      }
      put "/api/cases/#{case_id}", params: update_params, headers: auth_headers
      expect(response).to have_http_status(:ok)
      response_data = JSON.parse(response.body)
      case_data = response_data['data'] || response_data
      expect(case_data['final_cost_status']).to eq('pending') # Reset to pending
      expect(case_data['status']).to eq('pending')
    end
  end
end

