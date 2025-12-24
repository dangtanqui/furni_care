require 'rails_helper'

RSpec.describe Site, type: :model do
  describe 'validations' do
    subject { build(:site) }
    
    it { should validate_presence_of(:name) }
  end

  describe 'associations' do
    it { should belong_to(:client) }
    it { should have_many(:contacts).dependent(:destroy) }
    it { should have_many(:cases).dependent(:destroy) }
  end
end

