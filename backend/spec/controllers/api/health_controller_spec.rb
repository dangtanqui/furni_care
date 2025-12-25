require 'rails_helper'

RSpec.describe Api::HealthController, type: :controller do
  describe 'GET #index' do
    it 'returns health status without authorization' do
      # Health controller skips authorization
      get :index

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      expect(json_response['status']).to eq('ok')
      expect(json_response['timestamp']).to be_present
    end

    it 'returns timestamp in ISO8601 format' do
      get :index

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      timestamp = json_response['timestamp']
      expect { Time.iso8601(timestamp) }.not_to raise_error
    end

    it 'does not require authentication' do
      # Should work even without current_user
      allow(controller).to receive(:current_user).and_return(nil)
      get :index

      expect(response).to have_http_status(:success)
    end
  end
end

