require 'rails_helper'

RSpec.describe CasePolicy, type: :policy do
  let(:cs_user) { create(:user, :cs) }
  let(:technician_user) { create(:user, :technician) }
  let(:leader_user) { create(:user, :leader) }
  let(:case_record) { create(:case, :stage_1, created_by: cs_user, assigned_to: technician_user) }

  describe '#can_approve_cost?' do
    let(:stage3_case_with_cost) { create(:case, :stage_3_with_cost, created_by: cs_user, assigned_to: technician_user) }

    it 'allows leader to approve cost at stage 3' do
      policy = CasePolicy.new(leader_user, stage3_case_with_cost)
      expect(policy.can_approve_cost?).to be true
    end

    it 'denies non-leader users' do
      policy = CasePolicy.new(cs_user, stage3_case_with_cost)
      expect(policy.can_approve_cost?).to be false
    end

    it 'denies when not at stage 3' do
      policy = CasePolicy.new(leader_user, case_record)
      expect(policy.can_approve_cost?).to be false
    end
  end

  describe '#can_reject_cost?' do
    let(:stage3_case_with_cost) { create(:case, :stage_3_with_cost, created_by: cs_user, assigned_to: technician_user) }

    it 'allows leader to reject cost at stage 3' do
      policy = CasePolicy.new(leader_user, stage3_case_with_cost)
      expect(policy.can_reject_cost?).to be true
    end

    it 'denies non-leader users' do
      policy = CasePolicy.new(technician_user, stage3_case_with_cost)
      expect(policy.can_reject_cost?).to be false
    end

    it 'denies when not at stage 3' do
      policy = CasePolicy.new(leader_user, case_record)
      expect(policy.can_reject_cost?).to be false
    end
  end

  describe '#can_cancel?' do
    let(:stage3_case_rejected) do
      create(:case, :stage_3_with_cost, created_by: cs_user, assigned_to: technician_user, 
             cost_status: 'rejected', status: 'rejected')
    end

    it 'allows CS to cancel case at stage 3 when cost is rejected' do
      policy = CasePolicy.new(cs_user, stage3_case_rejected)
      expect(policy.can_cancel?).to be true
    end

    it 'denies non-CS users' do
      policy = CasePolicy.new(technician_user, stage3_case_rejected)
      expect(policy.can_cancel?).to be false
    end

    it 'denies when not at stage 3' do
      policy = CasePolicy.new(cs_user, case_record)
      expect(policy.can_cancel?).to be false
    end

    it 'denies when cost is not rejected' do
      stage3_case = create(:case, :stage_3_with_cost, created_by: cs_user, assigned_to: technician_user)
      policy = CasePolicy.new(cs_user, stage3_case)
      expect(policy.can_cancel?).to be false
    end
  end

  describe '#can_advance_stage?' do
    context 'when case is closed or cancelled' do
      it 'denies advancement' do
        closed_case = create(:case, :closed, created_by: cs_user)
        policy = CasePolicy.new(cs_user, closed_case)
        expect(policy.can_advance_stage?).to be false
      end
    end

    context 'when at final stage' do
      it 'denies advancement' do
        stage5_case = create(:case, :stage_5, created_by: cs_user)
        policy = CasePolicy.new(cs_user, stage5_case)
        expect(policy.can_advance_stage?).to be false
      end
    end

    context 'when at stage 1' do
      it 'allows CS to advance' do
        policy = CasePolicy.new(cs_user, case_record)
        expect(policy.can_advance_stage?).to be true
      end

      it 'denies non-CS users' do
        policy = CasePolicy.new(technician_user, case_record)
        expect(policy.can_advance_stage?).to be false
      end
    end

    context 'when at stage 2' do
      let(:stage2_case) { create(:case, :stage_2, created_by: cs_user, assigned_to: technician_user) }

      it 'allows assigned technician to advance' do
        policy = CasePolicy.new(technician_user, stage2_case)
        expect(policy.can_advance_stage?).to be true
      end

      it 'denies non-assigned technician' do
        other_technician = create(:user, :technician)
        policy = CasePolicy.new(other_technician, stage2_case)
        expect(policy.can_advance_stage?).to be false
      end
    end

    context 'when at stage 3' do
      let(:stage3_case_with_cost) { create(:case, :stage_3_with_cost, created_by: cs_user, assigned_to: technician_user) }
      let(:stage3_case_no_cost) { create(:case, :stage_3, created_by: cs_user, assigned_to: technician_user, cost_required: false) }

      it 'allows leader to advance when cost_required is true' do
        policy = CasePolicy.new(leader_user, stage3_case_with_cost)
        expect(policy.can_advance_stage?).to be true
      end

      it 'allows assigned technician to advance when cost_required is false' do
        policy = CasePolicy.new(technician_user, stage3_case_no_cost)
        expect(policy.can_advance_stage?).to be true
      end

      it 'denies assigned technician when cost_required is true' do
        policy = CasePolicy.new(technician_user, stage3_case_with_cost)
        expect(policy.can_advance_stage?).to be false
      end

      it 'denies non-assigned technician' do
        other_technician = create(:user, :technician)
        policy = CasePolicy.new(other_technician, stage3_case_no_cost)
        expect(policy.can_advance_stage?).to be false
      end
    end

    context 'when at stage 4' do
      let(:stage4_case) { create(:case, current_stage: 4, created_by: cs_user, assigned_to: technician_user) }

      it 'allows assigned technician to advance' do
        policy = CasePolicy.new(technician_user, stage4_case)
        expect(policy.can_advance_stage?).to be true
      end

      it 'denies non-assigned technician' do
        other_technician = create(:user, :technician)
        policy = CasePolicy.new(other_technician, stage4_case)
        expect(policy.can_advance_stage?).to be false
      end
    end
  end

  describe '#can_update?' do
    context 'when case is closed or cancelled' do
      it 'denies update' do
        closed_case = create(:case, :closed, created_by: cs_user)
        policy = CasePolicy.new(cs_user, closed_case)
        expect(policy.can_update?).to be false
      end
    end

    context 'when at stage 1' do
      it 'allows CS to update' do
        policy = CasePolicy.new(cs_user, case_record)
        expect(policy.can_update?).to be true
      end

      it 'denies non-CS users' do
        policy = CasePolicy.new(technician_user, case_record)
        expect(policy.can_update?).to be false
      end
    end

    context 'when at stage 2' do
      let(:stage2_case) { create(:case, :stage_2, created_by: cs_user, assigned_to: technician_user) }

      it 'allows assigned technician to update' do
        policy = CasePolicy.new(technician_user, stage2_case)
        expect(policy.can_update?).to be true
      end

      it 'denies non-assigned technician' do
        other_technician = create(:user, :technician)
        policy = CasePolicy.new(other_technician, stage2_case)
        expect(policy.can_update?).to be false
      end

      it 'allows assigned technician to update even when rejected' do
        rejected_case = create(:case, :stage_2, created_by: cs_user, assigned_to: technician_user, status: 'rejected')
        policy = CasePolicy.new(technician_user, rejected_case)
        expect(policy.can_update?).to be true
      end
    end

    context 'when at stage 3' do
      let(:stage3_case) { create(:case, :stage_3, created_by: cs_user, assigned_to: technician_user) }

      it 'allows assigned technician to update' do
        policy = CasePolicy.new(technician_user, stage3_case)
        expect(policy.can_update?).to be true
      end

      it 'denies non-assigned technician' do
        other_technician = create(:user, :technician)
        policy = CasePolicy.new(other_technician, stage3_case)
        expect(policy.can_update?).to be false
      end

      it 'allows assigned technician to update regardless of status' do
        rejected_case = create(:case, :stage_3_with_cost, created_by: cs_user, assigned_to: technician_user, status: 'rejected', cost_status: 'rejected')
        policy = CasePolicy.new(technician_user, rejected_case)
        expect(policy.can_update?).to be true
      end
    end

    context 'when at stage 4' do
      let(:stage4_case) { create(:case, current_stage: 4, created_by: cs_user, assigned_to: technician_user) }

      it 'allows assigned technician to update' do
        policy = CasePolicy.new(technician_user, stage4_case)
        expect(policy.can_update?).to be true
      end

      it 'denies non-assigned technician' do
        other_technician = create(:user, :technician)
        policy = CasePolicy.new(other_technician, stage4_case)
        expect(policy.can_update?).to be false
      end

      it 'allows assigned technician to update even when rejected' do
        rejected_case = create(:case, current_stage: 4, created_by: cs_user, assigned_to: technician_user, status: 'rejected')
        policy = CasePolicy.new(technician_user, rejected_case)
        expect(policy.can_update?).to be true
      end
    end

    context 'when at stage 5' do
      let(:stage5_case) { create(:case, :stage_5, created_by: cs_user) }

      it 'allows CS to update' do
        policy = CasePolicy.new(cs_user, stage5_case)
        expect(policy.can_update?).to be true
      end

      it 'denies non-CS users' do
        policy = CasePolicy.new(technician_user, stage5_case)
        expect(policy.can_update?).to be false
      end

      it 'allows CS to update regardless of status' do
        rejected_case = create(:case, :stage_5, created_by: cs_user, status: 'rejected', final_cost_status: 'rejected')
        policy = CasePolicy.new(cs_user, rejected_case)
        expect(policy.can_update?).to be true
      end
    end
  end

  describe '#can_redo?' do
    it 'allows CS to redo case at stage 5' do
      stage5_case = create(:case, :stage_5, created_by: cs_user)
      policy = CasePolicy.new(cs_user, stage5_case)
      expect(policy.can_redo?).to be true
    end

    it 'denies redo for closed case' do
      closed_case = create(:case, :closed, created_by: cs_user)
      policy = CasePolicy.new(cs_user, closed_case)
      expect(policy.can_redo?).to be false
    end

    it 'denies redo for cancelled case' do
      cancelled_case = create(:case, :cancelled, created_by: cs_user)
      policy = CasePolicy.new(cs_user, cancelled_case)
      expect(policy.can_redo?).to be false
    end

    it 'denies redo for non-CS users' do
      stage5_case = create(:case, :stage_5, created_by: cs_user)
      policy = CasePolicy.new(technician_user, stage5_case)
      expect(policy.can_redo?).to be false
    end
  end

  describe '#can_destroy?' do
    it 'allows CS to destroy case' do
      policy = CasePolicy.new(cs_user, case_record)
      expect(policy.can_destroy?).to be true
    end

    it 'denies non-CS users' do
      policy = CasePolicy.new(technician_user, case_record)
      expect(policy.can_destroy?).to be false
    end
  end

  describe '#can_approve_final_cost?' do
    let(:stage5_case) { create(:case, :stage_5, created_by: cs_user) }

    it 'allows leader to approve final cost at stage 5' do
      policy = CasePolicy.new(leader_user, stage5_case)
      expect(policy.can_approve_final_cost?).to be true
    end

    it 'denies non-leader users' do
      policy = CasePolicy.new(cs_user, stage5_case)
      expect(policy.can_approve_final_cost?).to be false
    end

    it 'denies when not at stage 5' do
      policy = CasePolicy.new(leader_user, case_record)
      expect(policy.can_approve_final_cost?).to be false
    end
  end

  describe '#can_reject_final_cost?' do
    let(:stage5_case) { create(:case, :stage_5, created_by: cs_user) }

    it 'allows leader to reject final cost at stage 5' do
      policy = CasePolicy.new(leader_user, stage5_case)
      expect(policy.can_reject_final_cost?).to be true
    end

    it 'denies non-leader users' do
      policy = CasePolicy.new(technician_user, stage5_case)
      expect(policy.can_reject_final_cost?).to be false
    end

    it 'denies when not at stage 5' do
      policy = CasePolicy.new(leader_user, case_record)
      expect(policy.can_reject_final_cost?).to be false
    end
  end
end

