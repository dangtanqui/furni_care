class Case < ApplicationRecord
  belongs_to :client, optional: true
  belongs_to :site, optional: true
  belongs_to :contact, optional: true
  belongs_to :created_by, class_name: 'User'
  belongs_to :assigned_to, class_name: 'User', optional: true
  belongs_to :cost_approved_by, class_name: 'User', optional: true
  belongs_to :final_cost_approved_by, class_name: 'User', optional: true
  
  has_many :case_attachments, dependent: :destroy
  has_many_attached :attachments
  
  # Constants
  STAGES = {
    1 => 'Input & Categorization',
    2 => 'Site Investigation',
    3 => 'Solution & Plan',
    4 => 'Execution',
    5 => 'Closing'
  }.freeze

  STATUSES = %w[open pending in_progress completed closed rejected cancelled].freeze
  COST_STATUSES = %w[pending approved rejected].freeze
  FINAL_COST_STATUSES = %w[pending approved rejected].freeze
  CASE_TYPES = %w[repair maintenance installation other].freeze
  PRIORITIES = %w[low medium high urgent].freeze

  # Validations
  validates :case_number, presence: true, uniqueness: true
  validates :current_stage, inclusion: { in: 1..5 }
  validates :status, inclusion: { in: STATUSES }
  validates :final_cost_status, inclusion: { in: FINAL_COST_STATUSES }, allow_nil: true
  validates :client_id, presence: { message: "is required" }
  validates :site_id, presence: { message: "is required" }
  validates :contact_id, presence: { message: "is required" }
  
  validate :final_cost_required_if_cost_approved
  validate :estimated_cost_required_if_cost_required
  
  before_validation :generate_case_number, on: :create
  
  def stage_name
    STAGES[current_stage]
  end
  
  def final_cost_required_if_cost_approved
    # If cost was approved in Stage 3, final_cost is required in Stage 5
    # But only check if case is already in Stage 5 (not when advancing into Stage 5)
    # Skip validation if we're advancing into Stage 5 (current_stage was just changed from 4 to 5)
    if current_stage == 5 && cost_required && cost_status == COST_STATUSES[1] # 'approved'
      # Only validate if case was already in Stage 5 before this update
      # If current_stage_changed? and it was 4, we're advancing into Stage 5, so skip validation
      was_in_stage_5 = !current_stage_changed? || (current_stage_changed? && current_stage_was == 5)
      
      # Final cost is required (must be entered, but 0 is allowed as a valid value)
      if was_in_stage_5 && final_cost.nil?
        errors.add(:final_cost, "is required when cost was approved in Stage 3")
      end
    end
  end

  def estimated_cost_required_if_cost_required
    # If cost_required is true, estimated_cost must be present (but 0 is allowed as a valid value)
    # Only validate when in Stage 3 or later (when cost can be entered)
    if cost_required && current_stage >= 3
      if estimated_cost.nil?
        errors.add(:estimated_cost, "is required when cost is required")
      end
    end
  end
  
  private
  
  def generate_case_number
    return if case_number.present?
    
    # Use database-level locking to prevent race conditions
    ActiveRecord::Base.transaction do
      # Lock the last case record to prevent concurrent access
      last_case = Case.order(id: :desc).lock.first
      next_number = last_case ? last_case.id + 1 : 1
      self.case_number = "C-#{next_number.to_s.rjust(4, '0')}"
      
      # Retry if case_number already exists (handles edge case)
      retries = 0
      while Case.exists?(case_number: self.case_number) && retries < 5
        next_number += 1
        self.case_number = "C-#{next_number.to_s.rjust(4, '0')}"
        retries += 1
      end
    end
  end
end

