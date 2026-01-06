class CaseAttachment < ApplicationRecord
  belongs_to :case
  has_one_attached :file
  
  validates :stage, presence: true, inclusion: { in: 1..5 }
end
