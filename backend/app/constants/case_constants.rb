module CaseConstants
  STAGES = {
    1 => 'Input & Categorization',
    2 => 'Site Investigation',
    3 => 'Solution & Plan',
    4 => 'Execution',
    5 => 'Closing'
  }.freeze

  STATUSES = {
    OPEN: 'open',
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CLOSED: 'closed',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
  }.freeze

  STATUSES_ARRAY = STATUSES.values.freeze

  COST_STATUSES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  }.freeze

  COST_STATUSES_ARRAY = COST_STATUSES.values.freeze

  FINAL_COST_STATUSES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  }.freeze

  FINAL_COST_STATUSES_ARRAY = FINAL_COST_STATUSES.values.freeze

  CASE_TYPES = %w[repair maintenance installation].freeze

  PRIORITIES = %w[low medium high].freeze
end
