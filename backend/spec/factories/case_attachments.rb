FactoryBot.define do
  factory :case_attachment do
    association :case
    stage { 1 }
    attachment_type { "document" }
  end
end

