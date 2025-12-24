# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2025_12_24_085226) do
  create_table "active_storage_attachments", charset: "utf8mb4", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", charset: "utf8mb4", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", charset: "utf8mb4", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "case_attachments", charset: "utf8mb4", force: :cascade do |t|
    t.bigint "case_id", null: false
    t.integer "stage", null: false
    t.string "attachment_type"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["case_id"], name: "index_case_attachments_on_case_id"
  end

  create_table "cases", charset: "utf8mb4", force: :cascade do |t|
    t.string "case_number", null: false
    t.bigint "client_id", null: false
    t.bigint "site_id", null: false
    t.bigint "contact_id", null: false
    t.bigint "created_by_id", null: false
    t.bigint "assigned_to_id"
    t.text "description"
    t.string "case_type"
    t.string "priority", default: "medium"
    t.text "investigation_report"
    t.text "investigation_checklist"
    t.text "root_cause"
    t.text "solution_description"
    t.text "solution_checklist"
    t.date "planned_execution_date"
    t.boolean "cost_required", default: false
    t.decimal "estimated_cost", precision: 15, scale: 2
    t.text "cost_description"
    t.string "cost_status"
    t.bigint "cost_approved_by_id"
    t.text "execution_report"
    t.text "execution_checklist"
    t.text "client_signature"
    t.text "client_feedback"
    t.integer "client_rating"
    t.text "cs_notes"
    t.text "final_feedback"
    t.integer "final_rating"
    t.integer "current_stage", default: 1
    t.string "status", default: "open"
    t.integer "attempt_number", default: 1
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "final_cost", precision: 15, scale: 2
    t.string "final_cost_status"
    t.bigint "final_cost_approved_by_id"
    t.index ["assigned_to_id"], name: "index_cases_on_assigned_to_id"
    t.index ["case_number"], name: "index_cases_on_case_number", unique: true
    t.index ["client_id"], name: "index_cases_on_client_id"
    t.index ["contact_id"], name: "index_cases_on_contact_id"
    t.index ["cost_approved_by_id"], name: "index_cases_on_cost_approved_by_id"
    t.index ["created_by_id"], name: "index_cases_on_created_by_id"
    t.index ["current_stage"], name: "index_cases_on_current_stage"
    t.index ["final_cost_approved_by_id"], name: "index_cases_on_final_cost_approved_by_id"
    t.index ["site_id"], name: "index_cases_on_site_id"
    t.index ["status"], name: "index_cases_on_status"
  end

  create_table "clients", charset: "utf8mb4", force: :cascade do |t|
    t.string "name", null: false
    t.string "code"
    t.string "address"
    t.string "phone"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "contacts", charset: "utf8mb4", force: :cascade do |t|
    t.bigint "site_id", null: false
    t.string "name", null: false
    t.string "phone"
    t.string "email"
    t.string "position"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["site_id"], name: "index_contacts_on_site_id"
  end

  create_table "sites", charset: "utf8mb4", force: :cascade do |t|
    t.bigint "client_id", null: false
    t.string "name", null: false
    t.string "address"
    t.string "city"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["client_id"], name: "index_sites_on_client_id"
  end

  create_table "users", charset: "utf8mb4", force: :cascade do |t|
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "name", null: false
    t.string "role", default: "cs"
    t.string "phone"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "case_attachments", "cases"
  add_foreign_key "cases", "clients"
  add_foreign_key "cases", "contacts"
  add_foreign_key "cases", "sites"
  add_foreign_key "cases", "users", column: "assigned_to_id"
  add_foreign_key "cases", "users", column: "cost_approved_by_id"
  add_foreign_key "cases", "users", column: "created_by_id"
  add_foreign_key "cases", "users", column: "final_cost_approved_by_id"
  add_foreign_key "contacts", "sites"
  add_foreign_key "sites", "clients"
end
