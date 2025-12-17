class CreateCaseAttachments < ActiveRecord::Migration[7.1]
  def change
    create_table :case_attachments do |t|
      t.references :case, null: false, foreign_key: true
      t.integer :stage, null: false
      t.string :attachment_type # photo, document, cost_attachment
      t.string :file_name
      t.string :file_url

      t.timestamps
    end
  end
end

