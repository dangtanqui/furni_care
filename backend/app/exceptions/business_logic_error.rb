class BusinessLogicError < ApplicationError
  def initialize(message, details: nil)
    super(message, status: :unprocessable_entity, details: details)
  end
end
