Rswag::Ui.configure do |c|
  # List the Swagger endpoints that you want to be documented through the
  # swagger-ui. The first parameter is the path (absolute or relative to the UI
  # host) to the corresponding endpoint and the second is a title that will be
  # displayed within the swagger-ui. Subsequent endpoints can be added to the
  # array, with each entry containing [path_string, title_string].
  #
  # Examples:
  #
  #   c.swagger_endpoint '/api-docs/v1/swagger.json', 'API V1 Docs'
  #   c.swagger_endpoint '/v1/api-docs', 'API V1 Docs'
  #   c.swagger_endpoint '/api-docs', 'API Docs'
  #
  # OpenAPI version
  # If you are using rswag-specs to generate Swagger/OpenAPI, you can use
  # the openapi_endpoint helper instead. This will set the UI to use
  # OpenAPI 3.0 format:
  #
  #   c.openapi_endpoint '/api-docs/v1/openapi.json', 'API V1 Docs'
  #
  # If no endpoints are specified, the UI will render Swagger/OpenAPI JSON
  # files from the swagger_root folder (see below). Otherwise, you can include
  # the files yourself or add them to your .gitignore as needed.
  #
  # To add authentication see the docs: https://github.com/rswag/rswag#authenticated-endpoints
  #
  c.openapi_endpoint '/api-docs/v1/swagger.json', 'API V1 Docs'
end

