require 'rails_helper'

RSpec.describe Api::CaseAttachmentsController, type: :controller do
  let(:cs_user) { create(:user, :cs) }
  let(:client) { create(:client) }
  let(:site) { create(:site, client: client) }
  let(:contact) { create(:contact, site: site) }
  let(:case_record) { create(:case, created_by: cs_user, client: client, site: site, contact: contact) }

  before do
    allow(controller).to receive(:current_user).and_return(cs_user)
    allow(controller).to receive(:authorize_request)
  end

  describe 'POST #create' do
    let(:file1) { Rack::Test::UploadedFile.new(Rails.root.join('spec', 'fixtures', 'files', 'test.txt'), 'text/plain') }
    let(:file2) { Rack::Test::UploadedFile.new(Rails.root.join('spec', 'fixtures', 'files', 'test.txt'), 'text/plain') }

    before do
      # Create test file if it doesn't exist
      test_file_path = Rails.root.join('spec', 'fixtures', 'files', 'test.txt')
      FileUtils.mkdir_p(File.dirname(test_file_path))
      File.write(test_file_path, 'test content') unless File.exist?(test_file_path)
    end

    context 'with valid files' do
      it 'creates attachments successfully' do
        post :create, params: {
          id: case_record.id,
          files: [file1, file2],
          stage: 1,
          attachment_type: 'document'
        }

        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)
        expect(json_response['stage']).to eq(1)
        expect(json_response['attachments']).to be_an(Array)
        expect(json_response['attachments'].length).to eq(2)
        expect(json_response['attachments'].first['filename']).to be_present
        expect(json_response['attachments'].first['url']).to be_present
        expect(json_response['attachments'].first['stage']).to eq(1)
        expect(json_response['attachments'].first['attachment_type']).to eq('document')
      end

      it 'uses default attachment_type when not provided' do
        post :create, params: {
          id: case_record.id,
          files: [file1],
          stage: 2
        }

        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)
        expect(json_response['attachments'].first['attachment_type']).to eq('stage_2')
      end

      it 'creates attachments with correct stage' do
        post :create, params: {
          id: case_record.id,
          files: [file1],
          stage: 3
        }

        expect(response).to have_http_status(:created)
        json_response = JSON.parse(response.body)
        expect(json_response['stage']).to eq(3)
        expect(case_record.case_attachments.count).to eq(1)
        expect(case_record.case_attachments.first.stage).to eq(3)
      end
    end

    context 'with invalid params' do
      it 'returns error when no files provided' do
        post :create, params: {
          id: case_record.id,
          stage: 1
        }

        expect(response).to have_http_status(:bad_request)
        json_response = JSON.parse(response.body)
        expect(json_response['error'] || json_response['errors']).to be_present
      end

      it 'returns 404 when case does not exist' do
        post :create, params: {
          id: 99999,
          files: [file1],
          stage: 1
        }

        expect(response).to have_http_status(:not_found)
        json_response = JSON.parse(response.body)
        expect(json_response['error']).to eq('Record not found')
      end
    end
  end

  describe 'DELETE #destroy' do
    let(:attachment) { create(:case_attachment, case: case_record) }

    before do
      # Attach a file to the attachment
      test_file_path = Rails.root.join('spec', 'fixtures', 'files', 'test.txt')
      FileUtils.mkdir_p(File.dirname(test_file_path))
      File.write(test_file_path, 'test content') unless File.exist?(test_file_path)
      file = Rack::Test::UploadedFile.new(test_file_path, 'text/plain')
      attachment.file.attach(file)
    end

    it 'deletes attachment successfully' do
      attachment_id = attachment.id
      delete :destroy, params: { case_id: case_record.id, id: attachment_id }

      expect(response).to have_http_status(:no_content)
      expect(CaseAttachment.find_by(id: attachment_id)).to be_nil
    end

    it 'returns error when attachment does not exist', :skip_transactional_fixtures do
      delete :destroy, params: { case_id: case_record.id, id: 99999 }

      expect(response).to have_http_status(:not_found)
      json_response = JSON.parse(response.body)
      expect(json_response['error']).to be_present
    end
  end
end

