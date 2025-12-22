# Serializer for User model
class UserSerializer
  def initialize(user, options = {})
    @user = user
    @options = options
  end

  def as_json(options = {})
    {
      id: @user.id,
      name: @user.name,
      email: @options[:include_email] ? @user.email : nil,
      role: @user.role,
      phone: @options[:include_phone] ? @user.phone : nil
    }.compact
  end

  def self.collection(users, options = {})
    users.map { |user| new(user, options).as_json }
  end
end
