return unless defined?(Rswag::Api)

Rswag::Api.configure do |c|
  # Specify a root folder where Swagger JSON files are generated
  # NOTE: If you're using the rswag-api to serve API descriptions, you'll need
  # to ensure that it's configured to serve Swagger from the same folder
  c.openapi_root = Rails.root.to_s + '/swagger'

  # Inject a lambda function to alter the returned Swagger prior to serialization
  # The function will have access to the rack env for the current request
  # For example, you could leverage this to dynamically assign the "host" property
  #
  # c.swagger_filter = lambda { |swagger, env| swagger['host'] = env['HTTP_HOST'] }
end

# Ensure swagger.json exists by converting from YAML if needed
Rails.application.config.after_initialize do
  swagger_yaml_path = Rails.root.join('swagger', 'v1', 'swagger.yaml')
  swagger_json_path = Rails.root.join('swagger', 'v1', 'swagger.json')
  
  if swagger_yaml_path.exist? && (!swagger_json_path.exist? || swagger_yaml_path.mtime > swagger_json_path.mtime)
    require 'yaml'
    require 'json'
    
    yaml_content = YAML.load_file(swagger_yaml_path)
    File.write(swagger_json_path, JSON.pretty_generate(yaml_content))
  end
end

