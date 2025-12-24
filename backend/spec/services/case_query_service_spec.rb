require 'rails_helper'

RSpec.describe CaseQueryService, type: :service do
  let(:cs_user) { create(:user, :cs) }
  let(:technician_user) { create(:user, :technician) }
  let(:client) { create(:client) }
  let(:site) { create(:site, client: client) }
  let(:contact) { create(:contact, site: site) }

  before do
    # Create test cases
    create_list(:case, 5, :stage_1, created_by: cs_user, client: client, site: site, contact: contact)
    create_list(:case, 3, :stage_2, created_by: cs_user, assigned_to: technician_user, client: client, site: site, contact: contact)
    create_list(:case, 2, :stage_3, created_by: cs_user, assigned_to: technician_user, client: client, site: site, contact: contact)
  end

  describe '#call' do
    context 'without filters' do
      it 'returns all cases with pagination' do
        params = { page: 1, per_page: 10 }
        service = CaseQueryService.new(params: params, current_user: cs_user)
        result = service.call

        expect(result).to be_success
        expect(result.data[:data].count).to eq(10)
        expect(result.data[:pagination][:total]).to eq(10)
        expect(result.data[:pagination][:page]).to eq(1)
      end
    end

    context 'with status filter' do
      it 'filters cases by status' do
        params = { status: 'open', page: 1, per_page: 20 }
        service = CaseQueryService.new(params: params, current_user: cs_user)
        result = service.call

        expect(result).to be_success
        result.data[:data].each do |case_record|
          expect(case_record.status).to eq('open')
        end
      end
    end

    context 'with stage filter' do
      it 'filters cases by stage' do
        params = { stage: 1, page: 1, per_page: 20 }
        service = CaseQueryService.new(params: params, current_user: cs_user)
        result = service.call

        expect(result).to be_success
        result.data[:data].each do |case_record|
          expect(case_record.current_stage).to eq(1)
        end
      end
    end

    context 'with assigned_to filter' do
      it 'filters cases by assigned technician' do
        params = { assigned_to: technician_user.id, page: 1, per_page: 20 }
        service = CaseQueryService.new(params: params, current_user: cs_user)
        result = service.call

        expect(result).to be_success
        result.data[:data].each do |case_record|
          expect(case_record.assigned_to_id).to eq(technician_user.id)
        end
      end

      it 'filters unassigned cases' do
        params = { assigned_to: 'unassigned', page: 1, per_page: 20 }
        service = CaseQueryService.new(params: params, current_user: cs_user)
        result = service.call

        expect(result).to be_success
        result.data[:data].each do |case_record|
          expect(case_record.assigned_to_id).to be_nil
        end
      end
    end

    context 'with sorting' do
      it 'sorts by created_at desc by default' do
        params = { page: 1, per_page: 20 }
        service = CaseQueryService.new(params: params, current_user: cs_user)
        result = service.call

        expect(result).to be_success
        dates = result.data[:data].map(&:created_at)
        expect(dates).to eq(dates.sort.reverse)
      end

      it 'sorts by case_number' do
        params = { sort_by: 'case_number', sort_direction: 'asc', page: 1, per_page: 20 }
        service = CaseQueryService.new(params: params, current_user: cs_user)
        result = service.call

        expect(result).to be_success
        case_numbers = result.data[:data].map(&:case_number)
        expect(case_numbers).to eq(case_numbers.sort)
      end

      it 'sorts by status' do
        params = { sort_by: 'status', sort_direction: 'asc', page: 1, per_page: 20 }
        service = CaseQueryService.new(params: params, current_user: cs_user)
        result = service.call

        expect(result).to be_success
        statuses = result.data[:data].map(&:status)
        expect(statuses).to eq(statuses.sort)
      end
    end

    context 'with pagination' do
      it 'respects per_page limit' do
        params = { page: 1, per_page: 5 }
        service = CaseQueryService.new(params: params, current_user: cs_user)
        result = service.call

        expect(result).to be_success
        expect(result.data[:data].count).to eq(5)
        expect(result.data[:pagination][:per_page]).to eq(5)
      end

      it 'calculates total_pages correctly' do
        params = { page: 1, per_page: 3 }
        service = CaseQueryService.new(params: params, current_user: cs_user)
        result = service.call

        expect(result).to be_success
        expect(result.data[:pagination][:total_pages]).to eq(4) # 10 cases / 3 per page = 4 pages
      end

      it 'enforces max per_page of 100' do
        params = { page: 1, per_page: 200 }
        service = CaseQueryService.new(params: params, current_user: cs_user)
        result = service.call

        expect(result).to be_success
        expect(result.data[:pagination][:per_page]).to eq(100)
      end
    end
  end
end

