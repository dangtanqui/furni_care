FactoryBot.define do
  factory :site do
    association :client
    name { "Test Site #{rand(10000)}" }
    address { "456 Site Avenue" }
    city { "Test City" }
  end
end

