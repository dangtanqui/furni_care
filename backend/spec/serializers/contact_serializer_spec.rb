require 'rails_helper'

RSpec.describe ContactSerializer, type: :serializer do
  let(:client) { create(:client) }
  let(:site) { create(:site, client: client) }
  let(:contact) { create(:contact, site: site, name: 'Test Contact', phone: '1234567890') }

  describe '#as_json' do
    it 'returns contact data with correct structure' do
      serializer = ContactSerializer.new(contact)
      result = serializer.as_json

      expect(result[:id]).to eq(contact.id)
      expect(result[:name]).to eq('Test Contact')
      expect(result[:phone]).to eq('1234567890')
    end
  end

  describe '.collection' do
    it 'serializes collection of contacts' do
      contacts = create_list(:contact, 3, site: site)
      result = ContactSerializer.collection(contacts)

      expect(result).to be_an(Array)
      expect(result.length).to eq(3)
      expect(result.first[:id]).to eq(contacts.first.id)
      expect(result.first[:name]).to eq(contacts.first.name)
      expect(result.first[:phone]).to eq(contacts.first.phone)
    end

    it 'returns empty array for empty collection' do
      result = ContactSerializer.collection([])

      expect(result).to eq([])
    end
  end
end

