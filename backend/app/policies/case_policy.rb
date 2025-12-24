# Policy class for Case authorization
class CasePolicy
  def initialize(user, case_record)
    @user = user
    @case = case_record
  end

  # Helper methods để tránh code lặp lại
  private

  def closed_or_cancelled?
    @case.status == Case::STATUSES_HASH[:CLOSED] || 
    @case.status == Case::STATUSES_HASH[:CANCELLED]
  end

  def rejected?
    @case.status == Case::STATUSES_HASH[:REJECTED]
  end

  def is_assigned_technician?
    @user.technician? && 
    @case.assigned_to_id == @user.id
  end

  def cost_rejected?
    @case.cost_status == Case::COST_STATUSES_HASH[:REJECTED]
  end

  def final_cost_rejected?
    @case.final_cost_status == Case::FINAL_COST_STATUSES_HASH[:REJECTED]
  end

  def cost_approved?
    @case.cost_status == Case::COST_STATUSES_HASH[:APPROVED]
  end

  def final_cost_approved?
    @case.final_cost_status == Case::FINAL_COST_STATUSES_HASH[:APPROVED]
  end

  def cost_pending?
    @case.cost_status == Case::COST_STATUSES_HASH[:PENDING]
  end

  def final_cost_pending?
    @case.final_cost_status == Case::FINAL_COST_STATUSES_HASH[:PENDING]
  end

  public

  def can_approve_cost?
    return false unless @user.leader?
    # Should only be able to approve cost at Stage 3
    @case.current_stage == 3 && 
      @case.cost_required && 
      !closed_or_cancelled?
  end

  def can_reject_cost?
    return false unless @user.leader?
    # Should only be able to reject cost at Stage 3
    @case.current_stage == 3 && 
      @case.cost_required && 
      !closed_or_cancelled?
  end

  def can_cancel?
    return false unless @user.cs?
    # Can only cancel at Stage 3 when cost is rejected
    @case.current_stage == 3 && 
      @case.cost_required && 
      cost_rejected? &&
      !closed_or_cancelled?
  end

  def can_advance_stage?
    # Cannot advance if case is closed or cancelled
    return false if closed_or_cancelled?
    
    # Cannot advance if already at final stage
    return false if @case.current_stage >= 5
    
    # Stage 1: Only CS can advance
    return @user.cs? if @case.current_stage == 1
    
    # Stage 2: Only assigned technician can advance
    return is_assigned_technician? if @case.current_stage == 2
    
    # Stage 3: Leader can advance (when approving cost), Technician can advance when cost_required is false
    if @case.current_stage == 3
      # Leader can approve cost which automatically advances to stage 4
      return true if @user.leader? && @case.cost_required
      # Technician can advance when cost_required is false
      return is_assigned_technician? && !@case.cost_required
    end
    
    # Stage 4: Only assigned technician can advance
    return is_assigned_technician? if @case.current_stage == 4
    
    # Default: deny
    false
  end

  def can_update?
    # Cannot update if case is closed or cancelled
    return false if closed_or_cancelled?
    
    # Stage 1: Only CS can update
    return @user.cs? if @case.current_stage == 1
    
    # Stage 2: Only assigned technician can update
    return is_assigned_technician? if @case.current_stage == 2 || @case.current_stage == 3 || @case.current_stage == 4
    
    # Stage 5: Only CS can update (CS always can update)
    return @user.cs? if @case.current_stage == 5
    
    # Default: deny
    false
  end

  def can_redo?
    # Only CS can redo cases
    return false unless @user.cs?
    
    # Only allow redo if case is at Stage 5
    # Cannot redo if case is closed or cancelled
    @case.current_stage == 5 && !closed_or_cancelled?
  end

  def can_view?
    true
  end

  def can_destroy?
    # Only CS can delete cases
    @user.cs?
  end

  def can_approve_final_cost?
    return false unless @user.leader?
    # Should only be able to approve final cost at Stage 5
    @case.current_stage == 5 && !closed_or_cancelled?
  end

  def can_reject_final_cost?
    return false unless @user.leader?
    # Should only be able to reject final cost at Stage 5
    @case.current_stage == 5 && !closed_or_cancelled?
  end
end
