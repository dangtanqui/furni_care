# Exception raised when business logic rules are violated
class BusinessLogicError < ApplicationError
  def initialize(message, details: nil)
    super(message, status: :unprocessable_entity, details: details)
  end
end

