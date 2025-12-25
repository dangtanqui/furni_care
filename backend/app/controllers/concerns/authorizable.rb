# Concern for authorization helpers
module Authorizable
  extend ActiveSupport::Concern

  def authorize_case_action(action, case_record = @case)
    policy = CasePolicy.new(current_user, case_record)
    
    unless policy.public_send("can_#{action}?")
      raise AuthorizationError, "Not authorized to #{action}"
    end
  end

  def case_policy(case_record = @case)
    CasePolicy.new(current_user, case_record)
  end
end
