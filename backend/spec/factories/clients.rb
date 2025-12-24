FactoryBot.define do
  factory :client do
    name { "Test Client #{rand(10000)}" }
    code { "CLI#{rand(1000)}" }
    address { "123 Test Street" }
    phone { "1234567890" }
  end
end

