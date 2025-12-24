require 'rails_helper'

RSpec.describe CaseAttachment, type: :model do
  describe 'validations' do
    subject { build(:case_attachment) }
    
    it { should validate_presence_of(:stage) }
    it { should validate_inclusion_of(:stage).in_array([1, 2, 3, 4, 5]) }
  end

  describe 'associations' do
    it { should belong_to(:case) }
  end
end

