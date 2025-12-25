class User < ApplicationRecord
  include UserConstants
  
  has_secure_password
  
  # Associations
  has_many :created_cases, class_name: 'Case', foreign_key: 'created_by_id'
  has_many :assigned_cases, class_name: 'Case', foreign_key: 'assigned_to_id'
  
  # Validations
  validates :email, presence: true, uniqueness: true
  validates :name, presence: true
  validates :role, inclusion: { in: UserConstants::ROLES_ARRAY }
  
  def cs?
    role == UserConstants::ROLES[:CS]
  end
  
  def technician?
    role == UserConstants::ROLES[:TECHNICIAN]
  end
  
  def leader?
    role == UserConstants::ROLES[:LEADER]
  end
end

