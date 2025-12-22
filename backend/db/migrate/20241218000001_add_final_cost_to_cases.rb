class AddFinalCostToCases < ActiveRecord::Migration[7.1]
  def change
    add_column :cases, :final_cost, :decimal, precision: 15, scale: 2
    add_column :cases, :final_cost_status, :string # pending, approved, rejected
    add_reference :cases, :final_cost_approved_by, foreign_key: { to_table: :users }
  end
end
