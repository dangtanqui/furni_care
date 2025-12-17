class CreateCases < ActiveRecord::Migration[7.1]
  def change
    create_table :cases do |t|
      t.string :case_number, null: false
      t.references :client, null: false, foreign_key: true
      t.references :site, null: false, foreign_key: true
      t.references :contact, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.references :assigned_to, foreign_key: { to_table: :users }

      # Stage 1 - Input & Categorization
      t.text :description
      t.string :case_type
      t.string :priority, default: 'medium'
      
      # Stage 2 - Site Investigation
      t.text :investigation_report
      t.text :investigation_checklist
      
      # Stage 3 - Solution & Plan
      t.text :root_cause
      t.text :solution_description
      t.text :solution_checklist
      t.date :planned_execution_date
      t.boolean :cost_required, default: false
      t.decimal :estimated_cost, precision: 15, scale: 2
      t.text :cost_description
      t.string :cost_status # pending, approved, rejected
      t.references :cost_approved_by, foreign_key: { to_table: :users }
      
      # Stage 4 - Execution
      t.text :execution_report
      t.text :execution_checklist
      t.text :client_signature
      t.text :client_feedback
      t.integer :client_rating
      
      # Stage 5 - Closing
      t.text :cs_notes
      t.text :final_feedback
      t.integer :final_rating
      
      # Status tracking
      t.integer :current_stage, default: 1
      t.string :status, default: 'open' # open, pending, in_progress, completed, closed
      t.integer :attempt_number, default: 1

      t.timestamps
    end
    
    add_index :cases, :case_number, unique: true
    add_index :cases, :status
    add_index :cases, :current_stage
  end
end

