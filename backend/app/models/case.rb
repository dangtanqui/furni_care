class Case < ApplicationRecord
  belongs_to :client
  belongs_to :site
  belongs_to :contact
  belongs_to :created_by, class_name: 'User'
  belongs_to :assigned_to, class_name: 'User', optional: true
  belongs_to :cost_approved_by, class_name: 'User', optional: true
  
  has_many :case_attachments, dependent: :destroy
  has_many_attached :attachments
  
  validates :case_number, presence: true, uniqueness: true
  validates :current_stage, inclusion: { in: 1..5 }
  validates :status, inclusion: { in: %w[open pending in_progress completed closed rejected cancelled] }
  
  before_validation :generate_case_number, on: :create
  
  STAGES = {
    1 => 'Input & Categorization',
    2 => 'Site Investigation',
    3 => 'Solution & Plan',
    4 => 'Execution',
    5 => 'Closing'
  }.freeze
  
  def stage_name
    STAGES[current_stage]
  end
  
  private
  
  def generate_case_number
    return if case_number.present?
    last_case = Case.order(created_at: :desc).first
    next_number = last_case ? last_case.id + 1 : 1
    self.case_number = "C-#{next_number.to_s.rjust(4, '0')}"
  end
end

