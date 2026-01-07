class CaseAttachment < ApplicationRecord
  include StageConstants
  
  belongs_to :case
  has_one_attached :file
  
  validates :stage, presence: true, inclusion: { in: STAGE_RANGE }
end
