class Client < ApplicationRecord
  has_many :sites, dependent: :destroy
  has_many :cases, dependent: :destroy
  
  validates :name, presence: true
end
