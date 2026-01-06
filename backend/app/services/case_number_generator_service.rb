class CaseNumberGeneratorService
  def self.generate
    # Use database-level locking to prevent race conditions
    # Optimized for scale: use maximum(:id) instead of order().lock.first
    # This is much faster with millions/billions of records as it uses index directly
    # Check if we're already in a transaction (e.g., in tests with transactional fixtures)
    # If so, don't set isolation level as it's not allowed in nested transactions
    if ActiveRecord::Base.connection.open_transactions > 0
      # Already in a transaction, use it without setting isolation
      generate_within_transaction
    else
      # Not in a transaction, can set isolation level
      ActiveRecord::Base.transaction(isolation: :read_committed) do
        generate_within_transaction
      end
    end
  end

  private

  def self.generate_within_transaction
    connection = ActiveRecord::Base.connection
    adapter_name = connection.adapter_name.downcase
    
    # Use advisory lock to prevent concurrent case number generation
    # This prevents race conditions without locking entire table
    lock_acquired = false
    
    if adapter_name.include?('mysql')
      # MySQL/MariaDB: use GET_LOCK for advisory locking
      # Lock name is a constant, safe for string interpolation
      lock_key = 'case_number_generation'
      result = connection.execute("SELECT GET_LOCK('#{lock_key}', 5)")
      lock_acquired = result.first.first == 1
      
      unless lock_acquired
        raise ActiveRecord::StatementInvalid, "Could not acquire lock for case number generation"
      end
    elsif adapter_name.include?('postgresql')
      # PostgreSQL: use pg_advisory_lock
      # Use a fixed numeric key for case number generation
      lock_key = 123456789
      result = connection.execute("SELECT pg_try_advisory_xact_lock(#{lock_key})")
      lock_acquired = result.first.first
      
      unless lock_acquired
        raise ActiveRecord::StatementInvalid, "Could not acquire lock for case number generation"
      end
    end
    # For SQLite and other databases, rely on transaction isolation and retry logic
    
    begin
      # Get maximum id efficiently (uses index, very fast even with billions of records)
      # This is O(1) operation with proper index on id column
      max_id = Case.maximum(:id) || 0
      next_number = max_id + 1
      case_number = "C-#{next_number.to_s.rjust(4, '0')}"
      
      # Retry if case_number already exists (handles edge case of concurrent inserts)
      # This handles race conditions even without advisory locks
      retries = 0
      while Case.exists?(case_number: case_number) && retries < 5
        next_number += 1
        case_number = "C-#{next_number.to_s.rjust(4, '0')}"
        retries += 1
      end
      
      case_number
    ensure
      # Release advisory lock if acquired
      if lock_acquired && adapter_name.include?('mysql')
        # MySQL requires explicit lock release
        connection.execute("SELECT RELEASE_LOCK('case_number_generation')")
      end
      # PostgreSQL releases lock automatically on transaction commit/rollback
    end
  end
end
