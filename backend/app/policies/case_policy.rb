class CasePolicy
  include StageConstants
  
  attr_reader :case_record

  def initialize(user, case_record)
    @user = user
    @case = case_record
    @case_record = case_record
  end

  private

  def closed_or_cancelled?
    @case.status == CaseConstants::STATUSES[:CLOSED] || 
      @case.status == CaseConstants::STATUSES[:CANCELLED]
  end

  def rejected?
    @case.status == CaseConstants::STATUSES[:REJECTED]
  end

  def is_assigned_technician?
    @user.technician? && @case.assigned_to_id == @user.id
  end

  def cost_rejected?
    @case.cost_status == CaseConstants::COST_STATUSES[:REJECTED]
  end

  def final_cost_rejected?
    @case.final_cost_status == CaseConstants::FINAL_COST_STATUSES[:REJECTED]
  end

  def cost_approved?
    @case.cost_status == CaseConstants::COST_STATUSES[:APPROVED]
  end

  def final_cost_approved?
    @case.final_cost_status == CaseConstants::FINAL_COST_STATUSES[:APPROVED]
  end

  def cost_pending?
    @case.cost_status == CaseConstants::COST_STATUSES[:PENDING]
  end

  def final_cost_pending?
    @case.final_cost_status == CaseConstants::FINAL_COST_STATUSES[:PENDING]
  end

  public

  def can_create?
    @user.cs?
  end

  def can_approve_cost?
    return false if closed_or_cancelled?

    @user.leader? && @case.current_stage == STAGE_3 && @case.cost_required
  end

  def can_reject_cost?
    return false if closed_or_cancelled?
    @user.leader? && @case.current_stage == STAGE_3 && @case.cost_required
  end

  def can_cancel?
    return false if closed_or_cancelled?

    @user.cs? && @case.current_stage == STAGE_3 && @case.cost_required && cost_rejected?
  end

  def can_advance_stage?
    return false if closed_or_cancelled?
    
    return @user.cs? if @case.current_stage == STAGE_1
    
    return is_assigned_technician? if @case.current_stage == STAGE_2 || @case.current_stage == STAGE_4
    
    if @case.current_stage == STAGE_3
      return @user.leader? if @case.cost_required
        
      return is_assigned_technician?
    end
    
    false
  end

  def can_update?
    return false if closed_or_cancelled?
    
    if @case.current_stage == STAGE_2 || @case.current_stage == STAGE_3 || @case.current_stage == STAGE_4 || @case.current_stage == STAGE_5
      return true if is_assigned_technician?
    end
    
    @user.cs?
  end

  def can_redo?
    return false if closed_or_cancelled?

    @user.cs? && @case.current_stage == STAGE_5
  end

  def can_view?
    true
  end

  def can_destroy?
    @user.cs?
  end

  def can_approve_final_cost?
    return false if closed_or_cancelled?

    @user.leader? && @case.current_stage == STAGE_5
  end

  def can_reject_final_cost?
    return false if closed_or_cancelled?
    
    @user.leader? && @case.current_stage == STAGE_5
  end
end
