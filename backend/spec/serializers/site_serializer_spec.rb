require 'rails_helper'

RSpec.describe SiteSerializer, type: :serializer do
  let(:client) { create(:client) }
  let(:site) { create(:site, client: client, name: 'Test Site', city: 'Test City') }

  describe '#as_json' do
    it 'returns site data with correct structure' do
      serializer = SiteSerializer.new(site)
      result = serializer.as_json

      expect(result[:id]).to eq(site.id)
      expect(result[:name]).to eq('Test Site')
      expect(result[:city]).to eq('Test City')
    end
  end

  describe '.collection' do
    it 'serializes collection of sites' do
      sites = create_list(:site, 3, client: client)
      result = SiteSerializer.collection(sites)

      expect(result).to be_an(Array)
      expect(result.length).to eq(3)
      expect(result.first[:id]).to eq(sites.first.id)
      expect(result.first[:name]).to eq(sites.first.name)
      expect(result.first[:city]).to eq(sites.first.city)
    end

    it 'returns empty array for empty collection' do
      result = SiteSerializer.collection([])

      expect(result).to eq([])
    end
  end
end

