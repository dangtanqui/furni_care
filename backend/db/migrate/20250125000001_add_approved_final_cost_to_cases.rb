class AddApprovedFinalCostToCases < ActiveRecord::Migration[7.1]
  def change
    add_column :cases, :approved_final_cost, :decimal, precision: 15, scale: 2
  end
end

