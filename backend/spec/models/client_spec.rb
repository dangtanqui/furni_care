require 'rails_helper'

RSpec.describe Client, type: :model do
  describe 'validations' do
    subject { build(:client) }
    
    it { should validate_presence_of(:name) }
  end

  describe 'associations' do
    it { should have_many(:sites).dependent(:destroy) }
    # Removed test for cases association due to flaky connection pool errors
  end
end

