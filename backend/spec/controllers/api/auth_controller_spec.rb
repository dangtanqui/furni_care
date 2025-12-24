require 'rails_helper'

RSpec.describe Api::AuthController, type: :controller do
  # Mock jwt_secret for all tests
  before do
    allow(controller).to receive(:jwt_secret).and_return('test_secret')
  end

  describe 'POST #login' do
    let!(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    
    # Stub authorize_request to skip it for login action
    # The controller has skip_before_action, but RSpec controller tests need explicit stubbing
    before do
      allow(controller).to receive(:authorize_request)
    end

    context 'with valid credentials' do
      it 'returns token and user data' do
        post :login, params: { email: 'test@example.com', password: 'password123' }

        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        # ServiceResponse returns data directly, not wrapped in 'data' key
        expect(json_response['token']).to be_present
        expect(json_response['user']['email']).to eq('test@example.com')
      end

      it 'supports remember_me parameter' do
        post :login, params: { 
          email: 'test@example.com', 
          password: 'password123',
          remember_me: true
        }

        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response['token']).to be_present
      end
    end

    context 'with invalid credentials' do
      it 'returns unauthorized status' do
        post :login, params: { email: 'test@example.com', password: 'wrong_password' }

        expect(response).to have_http_status(:unauthorized)
        json_response = JSON.parse(response.body)
        # ServiceResponse returns 'error' for single error, 'errors' for multiple
        expect(json_response['error'] || json_response['errors']).to be_present
      end
    end
  end

  describe 'POST #register' do
    let(:user_params) do
      {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        role: 'cs'
      }
    end

    # Stub authorize_request to skip it for register action
    before do
      allow(controller).to receive(:authorize_request)
    end

    context 'with valid params' do
      it 'creates user and returns token' do
        post :register, params: user_params

        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)
        # ServiceResponse returns data directly
        expect(json_response['token']).to be_present
        expect(json_response['user']['email']).to eq('newuser@example.com')
        expect(User.find_by(email: 'newuser@example.com')).to be_present
      end
    end

    context 'with invalid params' do
      it 'returns validation errors' do
        post :register, params: user_params.merge(email: '')

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        # ServiceResponse returns 'error' for single error, 'errors' for multiple
        expect(json_response['error'] || json_response['errors']).to be_present
      end
    end
  end

  describe 'GET #me' do
    let(:user) { create(:user) }

    before do
      allow(controller).to receive(:current_user).and_return(user)
      allow(controller).to receive(:authorize_request)
    end

    it 'returns current user data' do
      get :me

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      # ServiceResponse returns data directly
      expect(json_response['user']['id']).to eq(user.id)
      expect(json_response['user']['email']).to eq(user.email)
    end
  end
end

