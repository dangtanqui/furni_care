require 'rails_helper'

# Test controller to test ServiceResponse concern
RSpec.describe ServiceResponse, type: :controller do
  controller(ApplicationController) do
    include ServiceResponse
    skip_before_action :authorize_request

    def test_success_with_data
      result = BaseService::ServiceResult.new(success: true, data: { id: 1, name: 'Test' })
      render_service_result(result)
    end

    def test_success_with_serializer
      # Create a valid case with all required associations
      # Note: We can't use FactoryBot.create in controller methods, so we use direct creation
      cs_user = User.create!(email: "test#{SecureRandom.hex(4)}@example.com", password: 'password123', name: 'Test User', role: 'cs')
      client = Client.create!(name: 'Test Client')
      site = Site.create!(client: client, name: 'Test Site')
      contact = Contact.create!(site: site, name: 'Test Contact')
      case_record = Case.create!(
        created_by: cs_user,
        client: client,
        site: site,
        contact: contact,
        current_stage: 1,
        status: 'open'
      )
      result = BaseService::ServiceResult.new(success: true, data: case_record, status: :created)
      render_service_result(result, serializer: CaseSerializer, detail: true, status: :created)
    end

    def test_failure_single_error
      result = BaseService::ServiceResult.new(
        success: false, 
        errors: ['Single error'],
        status: :unprocessable_entity
      )
      render_service_result(result)
    end

    def test_failure_multiple_errors
      result = BaseService::ServiceResult.new(
        success: false,
        errors: ['Error 1', 'Error 2'],
        status: :unprocessable_entity
      )
      render_service_result(result)
    end

    def test_failure_with_custom_status
      result = BaseService::ServiceResult.new(
        success: false,
        errors: ['Not found'],
        status: :not_found
      )
      render_service_result(result)
    end

    def test_with_serializer
      # Use factory to create a valid case with all required associations
      cs_user = User.create!(email: "test2#{SecureRandom.hex(4)}@example.com", password: 'password123', name: 'Test User', role: 'cs')
      client = Client.create!(name: 'Test Client')
      site = Site.create!(client: client, name: 'Test Site')
      contact = Contact.create!(site: site, name: 'Test Contact')
      case_record = Case.create!(
        created_by: cs_user,
        client: client,
        site: site,
        contact: contact,
        current_stage: 1,
        status: 'open'
      )
      result = BaseService::ServiceResult.new(success: true, data: case_record)
      render_service_result(result, serializer: CaseSerializer, detail: true)
    end

    def test_result_status
      result = BaseService::ServiceResult.new(success: true, data: { test: 'data' }, status: :created)
      render_service_result(result)
    end
  end


  let(:user) { create(:user) }
  let(:client) { create(:client) }
  let(:site) { create(:site, client: client) }
  let(:contact) { create(:contact, site: site) }

  before do
    routes.draw do
      get 'test_success_with_data', to: 'anonymous#test_success_with_data'
      get 'test_success_with_serializer', to: 'anonymous#test_success_with_serializer'
      get 'test_failure_single_error', to: 'anonymous#test_failure_single_error'
      get 'test_failure_multiple_errors', to: 'anonymous#test_failure_multiple_errors'
      get 'test_failure_with_custom_status', to: 'anonymous#test_failure_with_custom_status'
      get 'test_with_serializer', to: 'anonymous#test_with_serializer'
      get 'test_result_status', to: 'anonymous#test_result_status'
    end
    allow(controller).to receive(:current_user).and_return(user)
    allow(controller).to receive(:authorize_request)
  end

  describe '#render_service_result' do
    context 'with success result' do
      it 'renders data directly when no serializer' do
        get :test_success_with_data

        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response['id']).to eq(1)
        expect(json_response['name']).to eq('Test')
      end

      it 'uses serializer when provided' do
        get :test_with_serializer

        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response['id']).to be_present
        expect(json_response['case_number']).to be_present
      end

      it 'uses custom status when provided' do
        get :test_success_with_serializer

        expect(response).to have_http_status(:created)
      end

      it 'uses result status when no custom status provided' do
        get :test_result_status

        expect(response).to have_http_status(:created)
      end
    end

    context 'with failure result' do
      it 'renders single error as error key' do
        get :test_failure_single_error

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response['error']).to eq('Single error')
        expect(json_response['errors']).to be_nil
      end

      it 'renders multiple errors as errors key' do
        get :test_failure_multiple_errors

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response['errors']).to be_an(Array)
        expect(json_response['errors']).to eq(['Error 1', 'Error 2'])
        expect(json_response['error']).to be_nil
      end

      it 'uses result status for error response' do
        get :test_failure_with_custom_status

        expect(response).to have_http_status(:not_found)
        json_response = JSON.parse(response.body)
        expect(json_response['error']).to eq('Not found')
      end
    end
  end
end

