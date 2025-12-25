# Constants for query services (sorting, pagination, filtering)
# This module centralizes all query-related constants to avoid duplication
# and improve maintainability
module QueryConstants
  # Filter values
  UNASSIGNED = 'unassigned'.freeze

  # Sortable columns for cases
  SORTABLE_COLUMNS = %w[
    case_number
    client
    site
    current_stage
    status
    priority
    assigned_to
    created_at
  ].freeze

  # Default sort configuration
  DEFAULT_SORT_COLUMN = 'created_at'.freeze
  DEFAULT_SORT_DIRECTION = 'desc'.freeze

  # Sort directions
  SORT_DIRECTION_ASC = 'asc'.freeze
  SORT_DIRECTION_DESC = 'desc'.freeze

  # Pagination defaults
  DEFAULT_PAGE = 1
  DEFAULT_PER_PAGE = 20
  MAX_PER_PAGE = 100
end

