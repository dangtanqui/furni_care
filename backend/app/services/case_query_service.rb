# Service for querying and filtering cases
class CaseQueryService < BaseService
  include QueryConstants

  def initialize(params:, current_user:)
    @params = params
    @current_user = current_user
  end

  def call
    cases = base_query
    cases = apply_filters(cases)
    cases = apply_sorting(cases)
    paginated_result = apply_pagination(cases)
    
    success(paginated_result)
  end

  private

  def base_query
    # Eager load all associations that will be accessed in serializer
    Case.includes(:client, :site, :contact, :assigned_to, :created_by, :cost_approved_by, :final_cost_approved_by)
  end

  def apply_filters(cases)
    cases = cases.where(status: @params[:status]) if @params[:status].present?
    cases = cases.where(case_type: @params[:case_type]) if @params[:case_type].present?
    
    if @params[:assigned_to].present?
      if @params[:assigned_to] == UNASSIGNED
        cases = cases.where(assigned_to_id: nil)
      else
        cases = cases.where(assigned_to_id: @params[:assigned_to])
      end
    end
    
    cases = cases.where(current_stage: @params[:stage]) if @params[:stage].present?
    cases
  end

  def apply_sorting(cases)
    # Support multiple sorts: parse JSON string or use single sort params for backward compatibility
    sorts = []
    
    if @params[:sorts].present?
      # New format: JSON array of {column, direction}
      begin
        sorts = JSON.parse(@params[:sorts]) if @params[:sorts].is_a?(String)
        sorts = @params[:sorts] if @params[:sorts].is_a?(Array)
      rescue JSON::ParserError
        # Fallback to default if JSON parsing fails
        sorts = []
      end
    elsif @params[:sort_by].present?
      # Legacy format: single sort
      sort_by = @params[:sort_by]
      sort_direction = @params[:sort_direction]&.downcase == SORT_DIRECTION_ASC ? SORT_DIRECTION_ASC : SORT_DIRECTION_DESC
      sorts = [{ 'column' => sort_by, 'direction' => sort_direction }]
    end
    
    # Default sort if no sorts provided
    if sorts.empty?
      sorts = [{ 'column' => DEFAULT_SORT_COLUMN, 'direction' => DEFAULT_SORT_DIRECTION }]
    end
    
    # Track which associations need to be eager loaded for sorting
    needs_client_join = sorts.any? { |s| (s['column'] || s[:column]) == 'client' }
    needs_site_join = sorts.any? { |s| (s['column'] || s[:column]) == 'site' }
    
    # Eager load associations that will be used for sorting to avoid N+1
    if needs_client_join
      cases = cases.includes(:client) unless cases.includes_values.include?(:client)
    end
    if needs_site_join
      cases = cases.includes(:site) unless cases.includes_values.include?(:site)
    end
    
    # Apply multiple sorts in order (first sort has highest priority)
    sorts.each do |sort|
      column = sort['column'] || sort[:column]
      direction = (sort['direction'] || sort[:direction] || SORT_DIRECTION_DESC).to_s.downcase == SORT_DIRECTION_ASC ? :asc : :desc
      
      case column
      when 'case_number'
        cases = cases.order(case_number: direction)
      when 'client'
        cases = cases.joins(:client).order('clients.name' => direction)
      when 'site'
        cases = cases.joins(:site).order('sites.name' => direction)
      when 'current_stage'
        cases = cases.order(current_stage: direction)
      when 'status'
        cases = cases.order(status: direction)
      when 'priority'
        cases = cases.order(priority: direction)
      when 'assigned_to'
        cases = cases.order(assigned_to_id: direction)
      when 'created_at'
        cases = cases.order(created_at: direction)
      end
    end
    
    cases
  end

  def apply_pagination(cases)
    page = @params[:page]&.to_i || DEFAULT_PAGE
    per_page = @params[:per_page]&.to_i || DEFAULT_PER_PAGE
    per_page = [per_page, MAX_PER_PAGE].min
    
    # Use count(:all) for better performance with large datasets
    # This avoids loading all records into memory
    total = cases.count(:all)
    paginated_cases = cases.offset((page - 1) * per_page).limit(per_page)
    
    {
      data: paginated_cases,
      pagination: {
        page: page,
        per_page: per_page,
        total: total,
        total_pages: (total.to_f / per_page).ceil
      }
    }
  end
end
