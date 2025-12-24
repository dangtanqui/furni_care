FactoryBot.define do
  factory :contact do
    association :site
    name { "Test Contact #{rand(10000)}" }
    phone { "0987654321" }
    email { "contact#{rand(10000)}@example.com" }
    position { "Manager" }
  end
end

