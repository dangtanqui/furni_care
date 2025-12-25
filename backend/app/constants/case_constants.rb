# Constants for Case model
# This module centralizes all case-related constants to avoid duplication
# and improve maintainability
module CaseConstants
  # Stage definitions
  STAGES = {
    1 => 'Input & Categorization',
    2 => 'Site Investigation',
    3 => 'Solution & Plan',
    4 => 'Execution',
    5 => 'Closing'
  }.freeze

  # Status definitions (using hash for easy access by symbol)
  STATUSES = {
    OPEN: 'open',
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CLOSED: 'closed',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
  }.freeze

  # Array for validations (derived from hash values)
  STATUSES_ARRAY = STATUSES.values.freeze

  # Cost status definitions
  COST_STATUSES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  }.freeze

  # Array for validations (derived from hash values)
  COST_STATUSES_ARRAY = COST_STATUSES.values.freeze

  # Final cost status definitions
  FINAL_COST_STATUSES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  }.freeze

  # Array for validations (derived from hash values)
  FINAL_COST_STATUSES_ARRAY = FINAL_COST_STATUSES.values.freeze

  # Case type definitions
  CASE_TYPES = %w[repair maintenance installation].freeze

  # Priority definitions
  PRIORITIES = %w[low medium high].freeze
end

