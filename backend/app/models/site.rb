class Site < ApplicationRecord
  belongs_to :client
  has_many :contacts, dependent: :destroy
  has_many :cases, dependent: :destroy
  
  validates :name, presence: true
end

