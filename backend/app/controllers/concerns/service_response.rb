# Concern for handling service results consistently
module ServiceResponse
  extend ActiveSupport::Concern

  def render_service_result(result, serializer: nil, detail: false, status: nil)
    if result.success?
      data = if serializer
               serializer.new(result.data, request: request).as_json(detail: detail)
             else
               result.data
             end
      render json: data, status: status || result.status || :ok
    else
      # Handle single error vs multiple errors consistently
      error_response = if result.errors.is_a?(Array) && result.errors.length == 1
                         { error: result.errors.first }
                       else
                         { errors: result.errors }
                       end
      render json: error_response, status: result.status
    end
  end
end
