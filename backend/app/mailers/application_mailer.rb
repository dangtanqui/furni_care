class ApplicationMailer < ActionMailer::Base
  default from: ENV['MAILER_FROM'] || 'noreply@furnicare.com'
  layout 'mailer'
end
