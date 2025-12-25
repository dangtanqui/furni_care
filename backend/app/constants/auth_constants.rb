# Constants for authentication
# This module centralizes all auth-related constants to avoid duplication
# and improve maintainability
module AuthConstants
  # JWT configuration
  DEFAULT_JWT_SECRET = 'default_secret'.freeze
  JWT_ALGORITHM = 'HS256'.freeze

  # Token expiration
  REMEMBER_ME_EXPIRATION_DAYS = 30
  DEFAULT_EXPIRATION_DAYS = 1

  # String values for boolean params
  TRUE_STRING = 'true'.freeze
end

