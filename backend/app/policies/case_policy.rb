# Policy class for Case authorization
class CasePolicy
  def initialize(user, case_record)
    @user = user
    @case = case_record
  end

  def can_approve_cost?
    @user.leader?
  end

  def can_reject_cost?
    @user.leader?
  end

  def can_cancel?
    @user.cs?
  end

  def can_advance_stage?
    # Add more complex logic here if needed
    # For now, any authenticated user can advance stages
    # but cost approval is checked separately
    true
  end

  def can_update?
    # Add logic based on case status, stage, and user role
    true
  end

  def can_redo?
    # Only allow redo if case is completed or rejected
    @case.status.in?([Case::STATUSES[3], Case::STATUSES[6]]) # ['completed', 'rejected']
  end

  def can_view?
    true
  end

  def can_destroy?
    # Only CS can delete cases
    @user.cs?
  end
end
