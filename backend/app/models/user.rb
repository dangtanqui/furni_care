class User < ApplicationRecord
  has_secure_password
  
  has_many :created_cases, class_name: 'Case', foreign_key: 'created_by_id'
  has_many :assigned_cases, class_name: 'Case', foreign_key: 'assigned_to_id'
  
  validates :email, presence: true, uniqueness: true
  validates :name, presence: true
  validates :role, inclusion: { in: %w[cs technician leader] }
  
  def cs?
    role == 'cs'
  end
  
  def technician?
    role == 'technician'
  end
  
  def leader?
    role == 'leader'
  end
end

