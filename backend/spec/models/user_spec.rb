require 'rails_helper'

RSpec.describe User, type: :model do
  # Provide subject with valid attributes for all validation tests
  subject(:user) { build(:user) }

  describe 'validations' do
    it { should validate_presence_of(:email) }
    # Email uniqueness is case-insensitive (MySQL default behavior)
    it { should validate_uniqueness_of(:email).case_insensitive }
    it { should validate_presence_of(:name) }
    it { should validate_inclusion_of(:role).in_array(User::ROLES) }
  end

  describe 'associations' do
    it { should have_many(:created_cases).class_name('Case').with_foreign_key('created_by_id') }
    it { should have_many(:assigned_cases).class_name('Case').with_foreign_key('assigned_to_id') }
  end

  describe 'role methods' do
    let(:cs_user) { create(:user, role: 'cs') }
    let(:technician_user) { create(:user, role: 'technician') }
    let(:leader_user) { create(:user, role: 'leader') }

    it 'returns true for cs? when role is cs' do
      expect(cs_user.cs?).to be true
      expect(technician_user.cs?).to be false
    end

    it 'returns true for technician? when role is technician' do
      expect(technician_user.technician?).to be true
      expect(cs_user.technician?).to be false
    end

    it 'returns true for leader? when role is leader' do
      expect(leader_user.leader?).to be true
      expect(cs_user.leader?).to be false
    end
  end
end

