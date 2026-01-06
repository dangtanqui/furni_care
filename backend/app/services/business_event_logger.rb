class BusinessEventLogger
  def self.log(event_type, case_id:, user_id: nil, metadata: {})
    event_data = {
      event_type: event_type,
      case_id: case_id,
      user_id: user_id,
      timestamp: Time.current.iso8601,
      metadata: metadata
    }
    
    # Log in JSON format for easy parsing by log aggregation tools
    Rails.logger.info({
      type: 'business_event',
      **event_data
    }.to_json)
    
    # In production, you might want to send this to a separate event store
    # or analytics service (e.g., Segment, Mixpanel, etc.)
  end

  # Convenience methods for common events
  def self.log_case_created(case_id:, user_id:)
    log(:case_created, case_id: case_id, user_id: user_id)
  end

  def self.log_stage_advanced(case_id:, user_id:, from_stage:, to_stage:)
    log(:stage_advanced, 
        case_id: case_id, 
        user_id: user_id,
        metadata: { from_stage: from_stage, to_stage: to_stage })
  end

  def self.log_cost_approved(case_id:, user_id:)
    log(:cost_approved, case_id: case_id, user_id: user_id)
  end

  def self.log_cost_rejected(case_id:, user_id:)
    log(:cost_rejected, case_id: case_id, user_id: user_id)
  end

  def self.log_final_cost_approved(case_id:, user_id:)
    log(:final_cost_approved, case_id: case_id, user_id: user_id)
  end

  def self.log_final_cost_rejected(case_id:, user_id:)
    log(:final_cost_rejected, case_id: case_id, user_id: user_id)
  end

  def self.log_case_cancelled(case_id:, user_id:)
    log(:case_cancelled, case_id: case_id, user_id: user_id)
  end

  def self.log_case_closed(case_id:, user_id:)
    log(:case_closed, case_id: case_id, user_id: user_id)
  end

  def self.log_technician_reassigned(case_id:, user_id:, from_technician_id:, to_technician_id:)
    log(:technician_reassigned,
        case_id: case_id,
        user_id: user_id,
        metadata: { 
          from_technician_id: from_technician_id,
          to_technician_id: to_technician_id
        })
  end
end
