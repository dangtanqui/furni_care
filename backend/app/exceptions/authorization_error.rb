# Exception raised when user is not authorized to perform an action
class AuthorizationError < ApplicationError
  def initialize(message = 'Not authorized', details: nil)
    super(message, status: :forbidden, details: details)
  end
end

