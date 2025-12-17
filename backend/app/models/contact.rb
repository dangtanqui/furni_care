class Contact < ApplicationRecord
  belongs_to :site
  has_many :cases, dependent: :nullify
  
  validates :name, presence: true
end

