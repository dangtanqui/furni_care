require 'rails_helper'

RSpec.describe ClientSerializer, type: :serializer do
  let(:client) { create(:client, name: 'Test Client', code: 'TC001') }

  describe '#as_json' do
    it 'returns client data with correct structure' do
      serializer = ClientSerializer.new(client)
      result = serializer.as_json

      expect(result[:id]).to eq(client.id)
      expect(result[:name]).to eq('Test Client')
      expect(result[:code]).to eq('TC001')
    end
  end

  describe '.collection' do
    it 'serializes collection of clients' do
      clients = create_list(:client, 3)
      result = ClientSerializer.collection(clients)

      expect(result).to be_an(Array)
      expect(result.length).to eq(3)
      expect(result.first[:id]).to eq(clients.first.id)
      expect(result.first[:name]).to eq(clients.first.name)
      expect(result.first[:code]).to eq(clients.first.code)
    end

    it 'returns empty array for empty collection' do
      result = ClientSerializer.collection([])

      expect(result).to eq([])
    end
  end
end

