FactoryBot.define do
  factory :case do
    association :client
    association :site
    association :contact
    association :created_by, factory: :user, role: 'cs'
    association :assigned_to, factory: :user, role: 'technician'
    description { "Test case description" }
    case_type { "repair" }
    priority { "medium" }
    current_stage { 1 }
    status { "open" }
    attempt_number { 1 }

    trait :stage_1 do
      current_stage { 1 }
      status { "open" }
    end

    trait :stage_2 do
      current_stage { 2 }
      status { "in_progress" }
    end

    trait :stage_3 do
      current_stage { 3 }
      status { "in_progress" }
      cost_required { false }
      estimated_cost { nil }
    end

    trait :stage_3_with_cost do
      current_stage { 3 }
      status { "pending" }
      cost_required { true }
      estimated_cost { 1000.00 }
      cost_description { "Test cost description" }
      cost_status { "pending" }
    end

    trait :stage_5_with_cost do
      current_stage { 5 }
      status { "completed" }
      cost_required { true }
      estimated_cost { 1000.00 }
      cost_status { "approved" }
      final_cost { 950.00 }
    end

    trait :stage_4 do
      current_stage { 4 }
      status { "in_progress" }
    end

    trait :stage_5 do
      current_stage { 5 }
      status { "completed" }
    end

    trait :closed do
      current_stage { 5 }
      status { "closed" }
    end

    trait :cancelled do
      status { "cancelled" }
    end
  end
end

