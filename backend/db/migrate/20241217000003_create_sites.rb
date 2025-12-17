class CreateSites < ActiveRecord::Migration[7.1]
  def change
    create_table :sites do |t|
      t.references :client, null: false, foreign_key: true
      t.string :name, null: false
      t.string :address
      t.string :city

      t.timestamps
    end
  end
end

