class CreateContacts < ActiveRecord::Migration[7.1]
  def change
    create_table :contacts do |t|
      t.references :site, null: false, foreign_key: true
      t.string :name, null: false
      t.string :phone
      t.string :email
      t.string :position

      t.timestamps
    end
  end
end

