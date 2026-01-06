class ValidationError < ApplicationError
  attr_reader :errors

  def initialize(message = 'Validation failed', errors: nil, details: nil)
    super(message, status: :unprocessable_entity, details: details)
    @errors = errors || {}
  end
end
