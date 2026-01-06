class Case < ApplicationRecord
  include CaseConstants
  include StageConstants
  
  belongs_to :client, optional: true
  belongs_to :site, optional: true
  belongs_to :contact, optional: true
  belongs_to :created_by, class_name: 'User'
  belongs_to :assigned_to, class_name: 'User', optional: true
  belongs_to :cost_approved_by, class_name: 'User', optional: true
  belongs_to :final_cost_approved_by, class_name: 'User', optional: true
  
  has_many :case_attachments, dependent: :destroy
  has_many_attached :attachments

  validates :case_number, presence: true, uniqueness: true
  validates :current_stage, inclusion: { in: StageConstants::STAGE_RANGE }
  validates :status, inclusion: { in: CaseConstants::STATUSES_ARRAY }
  validates :final_cost_status, inclusion: { in: CaseConstants::FINAL_COST_STATUSES_ARRAY }, allow_nil: true
  validates :client_id, presence: { message: "is required" }
  validates :site_id, presence: { message: "is required" }
  validates :contact_id, presence: { message: "is required" }
  validate :estimated_cost_required_if_cost_required
  validate :final_cost_required_if_cost_approved
  
  before_validation :generate_case_number, on: :create
  
  def stage_name
    CaseConstants::STAGES[current_stage]
  end

  def estimated_cost_required_if_cost_required
    # If cost_required is true, estimated_cost must be present (but 0 is allowed as a valid value)
    # Only validate when in Stage 3 or later (when cost can be entered)
    errors.add(:estimated_cost, "is required when cost is required") if cost_required && current_stage >= STAGE_3 && estimated_cost.nil?
  end
  
  def final_cost_required_if_cost_approved
    # If cost was approved in Stage 3, final_cost is required in Stage 5
    # But only check if case is already in Stage 5 (not when advancing into Stage 5)
    # Skip validation if we're advancing into Stage 5 (current_stage was just changed from 4 to 5)
    if current_stage == STAGE_5 && cost_required && cost_status == CaseConstants::COST_STATUSES[:APPROVED]
      # Only validate if case was already in Stage 5 before this update
      # If current_stage_changed?, we're advancing into Stage 5, so skip validation
      # If !current_stage_changed?, case was already in Stage 5, so validate
      errors.add(:final_cost, "is required when cost was approved in Stage 3") if !current_stage_changed? && final_cost.nil?
    end
  end
  
  private
  
  def generate_case_number
    return if case_number.present?
    
    self.case_number = CaseNumberGeneratorService.generate
  end
end
