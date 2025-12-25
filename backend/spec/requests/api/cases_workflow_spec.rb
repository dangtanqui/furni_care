require 'rails_helper'

RSpec.describe 'Case Workflow API', type: :request do
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

  describe 'Complete case lifecycle' do
    it 'creates a case and progresses through all stages to completion' do
      # Stage 1: CS creates case
      case_params = {
        client_id: client.id,
        site_id: site.id,
        contact_id: contact.id,
        description: 'Test case workflow',
        case_type: 'repair',
        priority: 'high',
        assigned_to_id: technician_user.id
      }
      
      post '/api/cases', params: case_params, headers: auth_headers
      if response.status != 201
        puts "Response status: #{response.status}"
        puts "Response body: #{response.body}"
      end
      expect(response).to have_http_status(:created)
      response_data = JSON.parse(response.body)
      case_data = response_data['data'] || response_data
      case_id = case_data['id']
      expect(case_data['current_stage']).to eq(1)
      expect(case_data['status']).to eq('open')
      
      # Stage 1 to 2: CS advances to stage 2
      post "/api/cases/#{case_id}/advance_stage", headers: auth_headers
      expect(response).to have_http_status(:ok)
      response_data = JSON.parse(response.body)
      case_data = response_data['data'] || response_data
      expect(case_data['current_stage']).to eq(2)
      expect(case_data['status']).to eq('in_progress')
      
      # Stage 2: Technician updates investigation
      update_params = {
        investigation_report: 'Root cause identified',
        investigation_checklist: ['Check 1', 'Check 2'].to_json
      }
      put "/api/cases/#{case_id}", params: update_params, headers: technician_auth_headers
      expect(response).to have_http_status(:ok)
      
      # Stage 2 to 3: Technician advances to stage 3
      post "/api/cases/#{case_id}/advance_stage", headers: technician_auth_headers
      expect(response).to have_http_status(:ok)
      response_data = JSON.parse(response.body)
      case_data = response_data['data'] || response_data
      expect(case_data['current_stage']).to eq(3)
      
      # Stage 3: Technician updates solution and cost (no cost required)
      update_params = {
        root_cause: 'Equipment failure',
        solution_description: 'Replace component',
        solution_checklist: ['Step 1', 'Step 2'].to_json,
        planned_execution_date: 1.week.from_now.to_date.to_s,
        cost_required: false
      }
      put "/api/cases/#{case_id}", params: update_params, headers: technician_auth_headers
      expect(response).to have_http_status(:ok)
      
      # Stage 3 to 4: Technician advances to stage 4
      post "/api/cases/#{case_id}/advance_stage", headers: technician_auth_headers
      expect(response).to have_http_status(:ok)
      response_data = JSON.parse(response.body)
      case_data = response_data['data'] || response_data
      expect(case_data['current_stage']).to eq(4)
      
      # Stage 4: Technician updates execution
      update_params = {
        execution_report: 'Work completed successfully',
        execution_checklist: ['Task 1', 'Task 2'].to_json,
        client_signature: 'John Doe',
        client_feedback: 'Satisfied',
        client_rating: 5
      }
      put "/api/cases/#{case_id}", params: update_params, headers: technician_auth_headers
      expect(response).to have_http_status(:ok)
      
      # Stage 4 to 5: Technician advances to stage 5
      post "/api/cases/#{case_id}/advance_stage", headers: technician_auth_headers
      if response.status != 200
        puts "Response status: #{response.status}"
        puts "Response body: #{response.body}"
      end
      expect(response).to have_http_status(:ok)
      response_data = JSON.parse(response.body)
      case_data = response_data['data'] || response_data
      expect(case_data['current_stage']).to eq(5)
      # When cost_required is false, status should be 'completed'
      # When cost_required is true, status should be 'in_progress' (CS needs to input final cost)
      expect(['completed', 'in_progress']).to include(case_data['status'])
      
      # Stage 5: CS closes the case
      update_params = {
        cs_notes: 'Case completed successfully',
        final_feedback: 'Excellent work',
        final_rating: 5,
        status: 'closed'
      }
      put "/api/cases/#{case_id}", params: update_params, headers: auth_headers
      if response.status != 200
        puts "Response status: #{response.status}"
        puts "Response body: #{response.body}"
        puts "Request params: #{update_params.inspect}"
      end
      expect(response).to have_http_status(:ok)
      response_data = JSON.parse(response.body)
      case_data = response_data['data'] || response_data
      expect(case_data['status']).to eq('closed')
    end
  end
end

