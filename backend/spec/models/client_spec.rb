require 'rails_helper'

RSpec.describe Client, type: :model do
  describe 'validations' do
    subject { build(:client) }
    
    it { should validate_presence_of(:name) }
  end

  describe 'associations' do
    it { should have_many(:sites).dependent(:destroy) }
    it { should have_many(:cases).dependent(:destroy) }
  end
end

