FactoryBot.define do
  factory :user do
    email { "user#{rand(10000)}@example.com" }
    password { "password123" }
    name { "Test User" }
    role { "cs" }
    phone { "1234567890" }

    trait :cs do
      role { "cs" }
    end

    trait :technician do
      role { "technician" }
    end

    trait :leader do
      role { "leader" }
    end
  end
end

