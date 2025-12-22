namespace :e2e do
  desc "Setup test database for E2E tests (requires RAILS_ENV=test)"
  task setup: :environment do
    # Ensure we're in test environment
    unless Rails.env.test?
      puts "ERROR: This task must be run with RAILS_ENV=test"
      puts "Usage: RAILS_ENV=test bundle exec rake e2e:setup"
      exit 1
    end
    
    puts "Setting up E2E test database (#{Rails.env})..."
    
    begin
      # Drop, create, migrate, and seed database
      puts "Resetting database..."
      Rake::Task['db:reset'].invoke
      
      puts "Seeding test data..."
      Rake::Task['db:seed'].invoke
      
      puts "✓ E2E test database setup complete!"
      puts "  Database: #{ActiveRecord::Base.connection_db_config.database}"
    rescue => e
      puts "✗ Error setting up test database: #{e.message}"
      puts e.backtrace.first(5).join("\n")
      exit 1
    end
  end

  desc "Reset test database for E2E tests (requires RAILS_ENV=test)"
  task reset: :environment do
    # Ensure we're in test environment
    unless Rails.env.test?
      puts "ERROR: This task must be run with RAILS_ENV=test"
      puts "Usage: RAILS_ENV=test bundle exec rake e2e:reset"
      exit 1
    end
    
    puts "Resetting E2E test database (#{Rails.env})..."
    
    begin
      # Drop, create, migrate, and seed database
      Rake::Task['db:reset'].invoke
      Rake::Task['db:seed'].invoke
      
      puts "✓ E2E test database reset complete!"
      puts "  Database: #{ActiveRecord::Base.connection_db_config.database}"
    rescue => e
      puts "✗ Error resetting test database: #{e.message}"
      puts e.backtrace.first(5).join("\n")
      exit 1
    end
  end
end

