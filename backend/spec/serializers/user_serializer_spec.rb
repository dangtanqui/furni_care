require 'rails_helper'

RSpec.describe UserSerializer, type: :serializer do
  let(:user) { create(:user, name: 'Test User', email: 'test@example.com', role: 'cs', phone: '1234567890') }

  describe '#as_json' do
    it 'returns user data with correct structure' do
      serializer = UserSerializer.new(user)
      result = serializer.as_json

      expect(result[:id]).to eq(user.id)
      expect(result[:name]).to eq('Test User')
      expect(result[:email]).to be_nil # Not included by default
      expect(result[:role]).to eq('cs')
      expect(result[:phone]).to be_nil # Not included by default
    end

    it 'includes email when include_email option is true' do
      serializer = UserSerializer.new(user, include_email: true)
      result = serializer.as_json

      expect(result[:email]).to eq('test@example.com')
    end

    it 'includes phone when include_phone option is true' do
      serializer = UserSerializer.new(user, include_phone: true)
      result = serializer.as_json

      expect(result[:phone]).to eq('1234567890')
    end

    it 'includes both email and phone when both options are true' do
      serializer = UserSerializer.new(user, include_email: true, include_phone: true)
      result = serializer.as_json

      expect(result[:email]).to eq('test@example.com')
      expect(result[:phone]).to eq('1234567890')
    end

    it 'removes nil values with compact' do
      serializer = UserSerializer.new(user)
      result = serializer.as_json

      expect(result.keys).not_to include(:email, :phone)
      expect(result).not_to have_key(:email)
      expect(result).not_to have_key(:phone)
    end
  end

  describe '.collection' do
    it 'serializes collection of users' do
      users = create_list(:user, 3)
      result = UserSerializer.collection(users)

      expect(result).to be_an(Array)
      expect(result.length).to eq(3)
      expect(result.first[:id]).to eq(users.first.id)
      expect(result.first[:name]).to eq(users.first.name)
    end

    it 'passes options to collection serialization' do
      users = create_list(:user, 2)
      result = UserSerializer.collection(users, include_email: true)

      expect(result.first[:email]).to eq(users.first.email)
      expect(result.last[:email]).to eq(users.last.email)
    end

    it 'returns empty array for empty collection' do
      result = UserSerializer.collection([])

      expect(result).to eq([])
    end
  end
end

