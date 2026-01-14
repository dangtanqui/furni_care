# Toast Messages Reference (from Frontend)

This document contains all toast messages used in the frontend web application. Mobile app should use the same messages for consistency.

## Success Messages

### Case Operations
- `"Case created successfully"`
- `"Case updated successfully"`
- `"Stage advanced successfully"`
- `"Case redone successfully"`
- `"Case cancelled successfully"`

### Attachments
- `"Attachment uploaded successfully"` (single)
- `"X attachments uploaded successfully"` (multiple)
- `"X attachment(s) uploaded successfully"` (when showing count)
- `"Attachment deleted successfully"`
- `"Attachment removed successfully"` (from preview)

### Cost Operations
- `"Cost approved successfully"`
- `"Cost rejected"`
- `"Final cost approved successfully"`
- `"Final cost rejected"`

### Mixed Results
- `"X attachment(s) uploaded successfully"` + `"X attachment(s) failed to upload"` (when some succeed, some fail)
- `"Case created successfully, but [error message]"` (when case created but attachments failed)

## Error Messages

### General
- `"Failed to update case. Please try again."`
- `"Failed to upload attachments. Please try again."`
- `"Failed to delete attachment. Please try again."`
- `"Failed to create case. Please try again."`
- `"Failed to advance stage. Please try again."`
- `"Duplicate image detected. Please upload a different image."`

### Case Status
- `"Cannot update case: case is already closed or cancelled"`
- `"Cannot advance stage: case is already closed or cancelled"`

### Validation
- `"Case ID is missing"`

## Waiting Messages (in Stage Content)

### Stage 1
- `"⏳ Waiting for CS to complete"` (for non-CS users when stage is current)

### Stage 2
- `"⏳ Waiting for Technician to complete"` (for non-technician users when stage is current)

### Stage 3
- `"⏳ Waiting for Technician to complete"` (default)
- `"⏳ Waiting for Technician to update or CS to close"` (when cost rejected)
- `"⏳ Waiting for Leader to complete"` (when waiting for cost approval)

### Stage 4
- `"⏳ Waiting for Technician to complete"` (for non-technician users when stage is current)

### Stage 5
- `"⏳ Waiting for CS to complete"` (default)
- `"⏳ Waiting for CS to enter"` (when final cost missing)
- `"⏳ Waiting for CS to update"` (when final cost rejected)
- `"⏳ Waiting for Leader to approve"` (when waiting for final cost approval)

## Notes

- All success messages are shown using `showSuccess()`
- All error messages are shown using `showError()`
- Waiting messages are displayed in stage content areas, not as toasts
- Duration: Default toast duration is 5000ms (5 seconds)
- Duplicate prevention: Frontend prevents duplicate toasts with same message within 500ms

