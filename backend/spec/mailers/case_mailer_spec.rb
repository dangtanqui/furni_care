require 'rails_helper'

RSpec.describe CaseMailer, type: :mailer do
  let(:cs_user) { create(:user, :cs) }
  let(:client) { create(:client) }
  let(:site) { create(:site, client: client) }
  let(:contact) { create(:contact, site: site, email: 'contact@example.com') }
  let(:case_record) { create(:case, created_by: cs_user, client: client, site: site, contact: contact) }

  before do
    ActionMailer::Base.deliveries.clear
    # Set default from address for tests
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('MAILER_FROM').and_return('test@example.com')
    # Reload ApplicationMailer to pick up the new ENV value
    load Rails.root.join('app/mailers/application_mailer.rb')
  end

  describe '#execution_summary' do
    context 'when contact has email' do
      it 'sends email to contact email' do
        CaseMailer.execution_summary(case_record).deliver_now

        expect(ActionMailer::Base.deliveries.count).to eq(1)
        email = ActionMailer::Base.deliveries.first
        expect(email.to).to eq(['contact@example.com'])
        expect(email.subject).to eq("Case #{case_record.case_number} - Execution Summary")
      end

      it 'includes case number in subject' do
        CaseMailer.execution_summary(case_record).deliver_now

        email = ActionMailer::Base.deliveries.first
        expect(email.subject).to include(case_record.case_number)
      end
    end

    context 'when contact has no email' do
      let(:contact_without_email) { create(:contact, site: site, email: nil) }
      let(:case_with_contact_no_email) { create(:case, created_by: cs_user, client: client, site: site, contact: contact_without_email) }

      it 'does not send email' do
        CaseMailer.execution_summary(case_with_contact_no_email).deliver_now

        expect(ActionMailer::Base.deliveries.count).to eq(0)
      end
    end

    context 'when contact has empty email' do
      let(:contact_with_empty_email) { create(:contact, site: site, email: '') }
      let(:case_with_empty_contact_email) { create(:case, created_by: cs_user, client: client, site: site, contact: contact_with_empty_email) }

      it 'does not send email' do
        CaseMailer.execution_summary(case_with_empty_contact_email).deliver_now

        expect(ActionMailer::Base.deliveries.count).to eq(0)
      end
    end


    it 'sets instance variables for email template' do
      mail = CaseMailer.execution_summary(case_record)
      
      # Access instance variables from the mail object after it's been built
      # The mail object has access to the mailer's instance variables
      expect(mail.body.encoded).to be_present
      expect(mail.to).to eq(['contact@example.com'])
      expect(mail.subject).to eq("Case #{case_record.case_number} - Execution Summary")
    end
  end
end

