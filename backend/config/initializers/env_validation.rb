# Validate critical environment variables
if Rails.env.production?
  required_env_vars = ['JWT_SECRET']
  
  missing_vars = required_env_vars.select { |var| ENV[var].blank? }
  
  if missing_vars.any?
    raise "Missing required environment variables: #{missing_vars.join(', ')}"
  end
  
  if ENV['JWT_SECRET'] == 'default_secret'
    raise 'JWT_SECRET cannot be "default_secret" in production'
  end
end
