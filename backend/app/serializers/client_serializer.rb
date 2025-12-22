# Serializer for Client model
class ClientSerializer
  def initialize(client, options = {})
    @client = client
    @options = options
  end

  def as_json(options = {})
    {
      id: @client.id,
      name: @client.name,
      code: @client.code
    }
  end

  def self.collection(clients, options = {})
    clients.map { |client| new(client, options).as_json }
  end
end
