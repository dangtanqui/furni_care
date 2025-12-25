# Constants for User model
# This module centralizes all user-related constants to avoid duplication
# and improve maintainability
module UserConstants
  # Role definitions
  ROLES = {
    CS: 'cs',
    TECHNICIAN: 'technician',
    LEADER: 'leader'
  }.freeze

  # Array for validations (derived from hash values)
  ROLES_ARRAY = ROLES.values.freeze
end

