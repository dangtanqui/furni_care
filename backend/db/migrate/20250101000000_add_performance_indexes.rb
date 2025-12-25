class AddPerformanceIndexes < ActiveRecord::Migration[7.1]
  def change
    # Composite index for filtering cases by status and stage (common query pattern)
    add_index :cases, [:status, :current_stage], name: 'index_cases_on_status_and_current_stage'
    
    # Composite index for technician queries (assigned cases by status)
    add_index :cases, [:assigned_to_id, :status], name: 'index_cases_on_assigned_to_id_and_status'
    
    # Index for cost status filtering (if frequently filtered)
    add_index :cases, :cost_status, name: 'index_cases_on_cost_status'
    
    # Index for final cost status filtering (if frequently filtered)
    add_index :cases, :final_cost_status, name: 'index_cases_on_final_cost_status'
    
    # Index for case number lookups (already unique, but explicit index helps)
    # Note: case_number already has unique index from schema, but keeping for clarity
  end
end

