require 'rails_helper'

RSpec.describe Authorizable, type: :controller do
  controller(ApplicationController) do
    include Authorizable

    def test_action
      authorize_case_action(:update)
      render json: { success: true }
    end

    def test_policy
      policy = case_policy
      render json: { policy_class: policy.class.name }
    end
  end

  let(:cs_user) { create(:user, :cs) }
  let(:client) { create(:client) }
  let(:site) { create(:site, client: client) }
  let(:contact) { create(:contact, site: site) }
  let(:case_record) { create(:case, created_by: cs_user, client: client, site: site, contact: contact) }

  before do
    routes.draw do
      get 'test_action', to: 'anonymous#test_action'
      get 'test_policy', to: 'anonymous#test_policy'
    end
    allow(controller).to receive(:current_user).and_return(cs_user)
    allow(controller).to receive(:authorize_request)
    controller.instance_variable_set(:@case, case_record)
  end

  describe '#authorize_case_action' do
    it 'allows action when policy permits' do
      allow_any_instance_of(CasePolicy).to receive(:can_update?).and_return(true)
      
      get :test_action

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      expect(json_response['success']).to be true
    end

    it 'raises error when policy denies' do
      allow_any_instance_of(CasePolicy).to receive(:can_update?).and_return(false)
      allow(Rails.env).to receive(:development?).and_return(true) # Show actual error message
      
      # The error is caught by ErrorHandler's StandardError handler, so we expect a 500 response
      get :test_action
      
      expect(response).to have_http_status(:internal_server_error)
      json_response = JSON.parse(response.body)
      # The error message should contain "Not authorized" or "authorized"
      expect(json_response['error']).to match(/[Nn]ot [Aa]uthorized|authorized/)
    end

    it 'uses provided case_record parameter' do
      other_case = create(:case, created_by: cs_user, client: client, site: site, contact: contact)
      allow_any_instance_of(CasePolicy).to receive(:can_update?).and_return(true)
      
      # Test the method directly
      controller.instance_variable_set(:@case, other_case)
      expect {
        controller.authorize_case_action(:update, other_case)
      }.not_to raise_error
    end
  end

  describe '#case_policy' do
    it 'uses @case by default' do
      policy = controller.case_policy
      expect(policy).to be_a(CasePolicy)
      expect(policy.case_record).to eq(case_record)
    end
  end
end

