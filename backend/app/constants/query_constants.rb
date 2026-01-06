module QueryConstants
  UNASSIGNED = 'unassigned'.freeze

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

  DEFAULT_SORT_COLUMN = 'created_at'.freeze
  DEFAULT_SORT_DIRECTION = 'desc'.freeze

  SORT_DIRECTION_ASC = 'asc'.freeze
  SORT_DIRECTION_DESC = 'desc'.freeze

  DEFAULT_PAGE = 1
  DEFAULT_PER_PAGE = 20
  MAX_PER_PAGE = 100
end
