class AuthorizationError < ApplicationError
  def initialize(message = 'Not authorized', details: nil)
    super(message, status: :forbidden, details: details)
  end
end
