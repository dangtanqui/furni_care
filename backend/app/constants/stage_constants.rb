# Constants for Case stages
# This module centralizes all stage-related constants to avoid duplication
# and improve maintainability
module StageConstants
  # Stage numbers
  STAGE_1 = 1
  STAGE_2 = 2
  STAGE_3 = 3
  STAGE_4 = 4
  STAGE_5 = 5

  # Stage range for validations
  MIN_STAGE = 1
  MAX_STAGE = 5
  STAGE_RANGE = (MIN_STAGE..MAX_STAGE).freeze
end

