class RemoveFileNameAndFileUrlFromCaseAttachments < ActiveRecord::Migration[7.1]
  def change
    remove_column :case_attachments, :file_name, :string, if_exists: true
    remove_column :case_attachments, :file_url, :string, if_exists: true
  end
end
