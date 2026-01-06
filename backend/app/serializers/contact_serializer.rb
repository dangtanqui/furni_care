class ContactSerializer
  def initialize(contact, options = {})
    @contact = contact
    @options = options
  end

  def as_json(options = {})
    {
      id: @contact.id,
      name: @contact.name,
      phone: @contact.phone
    }
  end

  def self.collection(contacts, options = {})
    contacts.map { |contact| new(contact, options).as_json }
  end
end
