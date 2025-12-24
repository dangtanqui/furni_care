require 'rails_helper'

RSpec.describe Contact, type: :model do
  describe 'validations' do
    subject { build(:contact) }
    
    it { should validate_presence_of(:name) }
  end

  describe 'associations' do
    it { should belong_to(:site) }
    it { should have_many(:cases).dependent(:nullify) }
  end
end

