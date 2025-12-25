require 'rails_helper'

RSpec.describe CaseSerializer, type: :service do
  let(:cs_user) { create(:user, :cs) }
  let(:technician_user) { create(:user, :technician) }
  let(:leader_user) { create(:user, :leader) }
  let(:client) { create(:client) }
  let(:site) { create(:site, client: client) }
  let(:contact) { create(:contact, site: site) }
  let(:case_record) { create(:case, created_by: cs_user, assigned_to: technician_user, client: client, site: site, contact: contact) }
  let(:mock_request) { double('request', base_url: 'http://test.host') }

  describe '#as_json' do
    context 'without detail option (basic case info)' do
      it 'returns basic case information' do
        serializer = CaseSerializer.new(case_record)
        result = serializer.as_json

        expect(result[:id]).to eq(case_record.id)
        expect(result[:case_number]).to eq(case_record.case_number)
        expect(result[:client]).to eq(client.name)
        expect(result[:site]).to eq(site.name)
        expect(result[:current_stage]).to eq(case_record.current_stage)
        expect(result[:stage_name]).to eq(case_record.stage_name)
        expect(result[:status]).to eq(case_record.status)
        expect(result[:priority]).to eq(case_record.priority)
        expect(result[:assigned_to]).to eq(technician_user.name)
        expect(result[:created_at]).to eq(case_record.created_at)
      end

      it 'handles nil associations gracefully' do
        case_without_assigned = create(:case, created_by: cs_user, assigned_to: nil, client: client, site: site, contact: contact)
        serializer = CaseSerializer.new(case_without_assigned)
        result = serializer.as_json

        expect(result[:assigned_to]).to be_nil
      end
    end

    context 'with detail option (full case details)' do
      let(:case_with_details) do
        create(:case,
          created_by: cs_user,
          assigned_to: technician_user,
          client: client,
          site: site,
          contact: contact,
          description: 'Test description',
          case_type: 'repair',
          priority: 'high',
          investigation_report: 'Investigation report',
          root_cause: 'Root cause',
          solution_description: 'Solution',
          cost_required: true,
          estimated_cost: 1000.00,
          execution_report: 'Execution report',
          cs_notes: 'CS notes',
          final_cost: 950.00
        )
      end

      it 'returns full case details' do
        serializer = CaseSerializer.new(case_with_details, request: mock_request)
        result = serializer.as_json(detail: true)

        expect(result[:id]).to eq(case_with_details.id)
        expect(result[:case_number]).to eq(case_with_details.case_number)
        expect(result[:current_stage]).to eq(case_with_details.current_stage)
        expect(result[:status]).to eq(case_with_details.status)
        expect(result[:attempt_number]).to eq(case_with_details.attempt_number)
      end

      it 'includes relation data as objects' do
        serializer = CaseSerializer.new(case_with_details, request: mock_request)
        result = serializer.as_json(detail: true)

        expect(result[:client]).to be_a(Hash)
        expect(result[:client][:id]).to eq(client.id)
        expect(result[:client][:name]).to eq(client.name)

        expect(result[:site]).to be_a(Hash)
        expect(result[:site][:id]).to eq(site.id)
        expect(result[:site][:name]).to eq(site.name)
        expect(result[:site][:city]).to eq(site.city)

        expect(result[:contact]).to be_a(Hash)
        expect(result[:contact][:id]).to eq(contact.id)
        expect(result[:contact][:name]).to eq(contact.name)
        expect(result[:contact][:phone]).to eq(contact.phone)

        expect(result[:created_by]).to be_a(Hash)
        expect(result[:created_by][:id]).to eq(cs_user.id)
        expect(result[:created_by][:name]).to eq(cs_user.name)

        expect(result[:assigned_to]).to be_a(Hash)
        expect(result[:assigned_to][:id]).to eq(technician_user.id)
        expect(result[:assigned_to][:name]).to eq(technician_user.name)
      end

      it 'includes stage-specific fields' do
        serializer = CaseSerializer.new(case_with_details, request: mock_request)
        result = serializer.as_json(detail: true)

        # Stage 1
        expect(result[:description]).to eq('Test description')
        expect(result[:case_type]).to eq('repair')
        expect(result[:priority]).to eq('high')

        # Stage 2
        expect(result[:investigation_report]).to eq('Investigation report')

        # Stage 3
        expect(result[:root_cause]).to eq('Root cause')
        expect(result[:solution_description]).to eq('Solution')
        expect(result[:cost_required]).to be true
        expect(result[:estimated_cost]).to eq(1000.00)

        # Stage 4
        expect(result[:execution_report]).to eq('Execution report')

        # Stage 5
        expect(result[:cs_notes]).to eq('CS notes')
        expect(result[:final_cost]).to eq(950.00)
      end

      it 'handles nil assigned_to' do
        case_without_assigned = create(:case, created_by: cs_user, assigned_to: nil, client: client, site: site, contact: contact)
        serializer = CaseSerializer.new(case_without_assigned, request: mock_request)
        result = serializer.as_json(detail: true)

        expect(result[:assigned_to]).to be_nil
      end

      it 'includes timestamps' do
        serializer = CaseSerializer.new(case_with_details, request: mock_request)
        result = serializer.as_json(detail: true)

        expect(result[:created_at]).to eq(case_with_details.created_at)
        expect(result[:updated_at]).to eq(case_with_details.updated_at)
      end
    end

    context 'attachments_hash' do
      let(:attachment1) { create(:case_attachment, case: case_record, stage: 1) }
      let(:attachment2) { create(:case_attachment, case: case_record, stage: 1) }
      let(:attachment3) { create(:case_attachment, case: case_record, stage: 2) }

      before do
        # Attach files to attachments
        test_file_path = Rails.root.join('spec', 'fixtures', 'files', 'test.txt')
        FileUtils.mkdir_p(File.dirname(test_file_path))
        File.write(test_file_path, 'test content') unless File.exist?(test_file_path)
        file = Rack::Test::UploadedFile.new(test_file_path, 'text/plain')
        
        attachment1.file.attach(file)
        attachment2.file.attach(file)
        attachment3.file.attach(file)
      end

      it 'includes stage_attachments when request is provided' do
        serializer = CaseSerializer.new(case_record, request: mock_request)
        result = serializer.as_json(detail: true)

        expect(result[:stage_attachments]).to be_a(Hash)
        expect(result[:stage_attachments][1]).to be_an(Array)
        expect(result[:stage_attachments][1].length).to eq(2)
        expect(result[:stage_attachments][2]).to be_an(Array)
        expect(result[:stage_attachments][2].length).to eq(1)
      end

      it 'groups attachments by stage' do
        serializer = CaseSerializer.new(case_record, request: mock_request)
        result = serializer.as_json(detail: true)

        stage_1_attachments = result[:stage_attachments][1]
        expect(stage_1_attachments.map { |a| a[:id] }).to contain_exactly(attachment1.id, attachment2.id)

        stage_2_attachments = result[:stage_attachments][2]
        expect(stage_2_attachments.map { |a| a[:id] }).to contain_exactly(attachment3.id)
      end

      it 'includes attachment details with URLs' do
        serializer = CaseSerializer.new(case_record, request: mock_request)
        result = serializer.as_json(detail: true)

        attachment_data = result[:stage_attachments][1].first
        expect(attachment_data[:id]).to be_present
        expect(attachment_data[:filename]).to be_present
        expect(attachment_data[:url]).to be_present
        expect(attachment_data[:url]).to include('http://test.host')
        expect(attachment_data[:stage]).to eq(1)
        expect(attachment_data[:attachment_type]).to be_present
      end

      it 'returns empty hash when request is not provided' do
        serializer = CaseSerializer.new(case_record)
        result = serializer.as_json(detail: true)

        expect(result[:stage_attachments]).to eq({})
      end

      it 'returns empty hash when case has no attachments' do
        case_without_attachments = create(:case, created_by: cs_user, client: client, site: site, contact: contact)
        serializer = CaseSerializer.new(case_without_attachments, request: mock_request)
        result = serializer.as_json(detail: true)

        expect(result[:stage_attachments]).to eq({})
      end
    end
  end
end

