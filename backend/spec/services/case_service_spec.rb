require 'rails_helper'

RSpec.describe CaseService, type: :service do
  let(:cs_user) { create(:user, :cs) }
  let(:technician_user) { create(:user, :technician) }
  let(:leader_user) { create(:user, :leader) }
  let(:client) { create(:client) }
  let(:site) { create(:site, client: client) }
  let(:contact) { create(:contact, site: site) }

  describe '#create' do
    let(:case_params) do
      {
        client_id: client.id,
        site_id: site.id,
        contact_id: contact.id,
        description: 'Test case',
        case_type: 'repair',
        priority: 'medium'
      }
    end
    let(:case_record) { Case.new(case_params) }
    let(:service) { CaseService.new(case_record: case_record, current_user: cs_user) }

    it 'creates case with correct attributes' do
      result = service.create

      expect(result).to be_success
      expect(result.data.created_by).to eq(cs_user)
      expect(result.data.current_stage).to eq(1)
      expect(result.data.status).to eq('open')
      expect(result.data.case_number).to be_present
    end

    it 'returns failure for invalid case' do
      invalid_case = Case.new
      service = CaseService.new(case_record: invalid_case, current_user: cs_user)
      result = service.create

      expect(result).to be_failure
      expect(result.errors).to be_present
    end
  end

  describe '#advance_stage' do
    let(:case_record) { create(:case, :stage_1, created_by: cs_user, assigned_to: technician_user) }
    let(:service) { CaseService.new(case_record: case_record, current_user: cs_user) }

    it 'advances from stage 1 to stage 2' do
      result = service.advance_stage

      expect(result).to be_success
      expect(result.data.current_stage).to eq(2)
      expect(result.data.status).to eq('in_progress')
    end

    it 'requires cost approval before advancing from stage 3' do
      case_record = create(:case, :stage_3_with_cost, created_by: cs_user, assigned_to: technician_user)
      service = CaseService.new(case_record: case_record, current_user: technician_user)
      
      result = service.advance_stage

      expect(result).to be_failure
      expect(result.errors).to include('Cost approval required before advancing')
    end

    it 'cannot advance beyond stage 5' do
      case_record = create(:case, :stage_5, created_by: cs_user, assigned_to: technician_user)
      service = CaseService.new(case_record: case_record, current_user: cs_user)
      
      result = service.advance_stage

      expect(result).to be_failure
      expect(result.errors).to include('Already at final stage')
    end
  end

  describe '#approve_cost' do
    let(:case_record) { create(:case, :stage_3_with_cost, created_by: cs_user, assigned_to: technician_user) }
    let(:service) { CaseService.new(case_record: case_record, current_user: leader_user) }

    it 'approves cost and sets approved_by' do
      result = service.approve_cost

      expect(result).to be_success
      expect(result.data.cost_status).to eq('approved')
      expect(result.data.cost_approved_by).to eq(leader_user)
    end

    it 'can approve cost even if not in stage 3 (no stage check in service)' do
      # Note: approve_cost service doesn't check stage, only checks cost_required and estimated_cost
      # Stage checking is done by authorization policy
      case_record = create(:case, :stage_2, created_by: cs_user, assigned_to: technician_user, cost_required: true, estimated_cost: 1000.00)
      service = CaseService.new(case_record: case_record, current_user: leader_user)
      
      result = service.approve_cost

      # Service allows approval, but policy should prevent it
      expect(result).to be_success
    end
  end

  describe '#reject_cost' do
    let(:case_record) { create(:case, :stage_3_with_cost, created_by: cs_user, assigned_to: technician_user) }
    let(:service) { CaseService.new(case_record: case_record, current_user: leader_user) }

    it 'rejects cost and sets status to rejected' do
      result = service.reject_cost

      expect(result).to be_success
      expect(result.data.cost_status).to eq('rejected')
      expect(result.data.status).to eq('rejected')
    end
  end

  describe '#cancel_case' do
    let(:case_record) { create(:case, :stage_3, created_by: cs_user, assigned_to: technician_user) }
    let(:service) { CaseService.new(case_record: case_record, current_user: cs_user) }

    it 'cancels case and sets status to cancelled' do
      result = service.cancel_case

      expect(result).to be_success
      expect(result.data.status).to eq('cancelled')
    end
  end
end

