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
    # Only CS can redo cases
    return false unless @user.cs?
    
    # Only allow redo if case is at Stage 5
    # Cannot redo if case is closed or cancelled
    @case.current_stage == 5 && 
      @case.status != Case::STATUSES[4] && # not 'closed'
      @case.status != Case::STATUSES[6] # not 'cancelled'
  end

  def can_view?
    true
  end

  def can_destroy?
    # Only CS can delete cases
    @user.cs?
  end

  def can_approve_final_cost?
    # Only leaders can approve final cost
    @user.leader?
  end

  def can_reject_final_cost?
    # Only leaders can reject final cost
    @user.leader?
  end
end
