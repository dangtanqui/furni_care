class CreateClients < ActiveRecord::Migration[7.1]
  def change
    create_table :clients do |t|
      t.string :name, null: false
      t.string :code
      t.string :address
      t.string :phone

      t.timestamps
    end
  end
end

