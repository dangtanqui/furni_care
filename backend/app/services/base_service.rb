class BaseService
  def self.call(*args, **kwargs, &block)
    new(*args, **kwargs).call(&block)
  end

  def success(data = nil)
    ServiceResult.new(success: true, data: data)
  end

  def failure(errors, status: :unprocessable_entity)
    ServiceResult.new(success: false, errors: errors, status: status)
  end

  class ServiceResult
    attr_reader :success, :data, :errors, :status

    def initialize(success:, data: nil, errors: nil, status: :ok)
      @success = success
      @data = data
      @errors = errors
      @status = status
    end

    def success?
      @success
    end

    def failure?
      !@success
    end
  end
end
