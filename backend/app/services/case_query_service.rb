# Service for querying and filtering cases
class CaseQueryService < BaseService
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
    Case.includes(:client, :site, :contact, :assigned_to, :created_by)
  end

  def apply_filters(cases)
    cases = cases.where(status: @params[:status]) if @params[:status].present?
    cases = cases.where(case_type: @params[:case_type]) if @params[:case_type].present?
    
    if @params[:assigned_to].present?
      if @params[:assigned_to] == 'unassigned'
        cases = cases.where(assigned_to_id: nil)
      else
        cases = cases.where(assigned_to_id: @params[:assigned_to])
      end
    end
    
    cases = cases.where(current_stage: @params[:stage]) if @params[:stage].present?
    cases
  end

  def apply_sorting(cases)
    sort_by = @params[:sort_by] || 'created_at'
    sort_direction = @params[:sort_direction]&.downcase == 'asc' ? 'asc' : 'desc'
    
    case sort_by
    when 'case_number'
      cases.order(case_number: sort_direction.to_sym)
    when 'client'
      cases.joins(:client).order('clients.name' => sort_direction.to_sym)
    when 'site'
      cases.joins(:site).order('sites.name' => sort_direction.to_sym)
    when 'current_stage'
      cases.order(current_stage: sort_direction.to_sym)
    when 'status'
      cases.order(status: sort_direction.to_sym)
    when 'priority'
      cases.order(priority: sort_direction.to_sym)
    when 'assigned_to'
      cases.order(assigned_to_id: sort_direction.to_sym)
    else
      cases.order(created_at: :desc)
    end
  end

  def apply_pagination(cases)
    page = @params[:page]&.to_i || 1
    per_page = @params[:per_page]&.to_i || 20
    per_page = [per_page, 100].min # Max 100 per page
    
    total = cases.count
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
