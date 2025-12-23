# E2E Test Coverage Matrix

## Test Organization Structure

```
e2e/
├── tests/                          # All test files organized here
│   ├── auth/
│   │   └── login.spec.ts          # Authentication tests
│   ├── case/
│   │   ├── creation.spec.ts        # Case creation scenarios
│   │   ├── workflow.spec.ts       # Complete happy path workflow
│   │   ├── scenarios.spec.ts       # Various case scenarios
│   │   ├── cancellation.spec.ts   # Case cancellation tests
│   │   └── list.spec.ts           # Case list filtering tests
│   ├── permissions/
│   │   └── stages.spec.ts         # Role-based permissions across all stages
│   ├── workflows/
│   │   ├── cost-rejection.spec.ts # Cost rejection workflows (Stage 3 & 5)
│   │   ├── redo.spec.ts           # Redo workflow tests
│   │   └── final-cost-matching.spec.ts # Final cost matching logic tests
│   ├── features/
│   │   ├── attachments.spec.ts    # File upload/attachment tests
│   │   ├── signature.spec.ts      # Client signature canvas tests
│   │   ├── email-notification.spec.ts # Email notification tests
│   │   └── status-transitions.spec.ts # Status transition tests
│   └── ui/
│       ├── list-sorting.spec.ts   # Case list sorting tests
│       └── navigation.spec.ts      # Navigation tests (back button, etc.)
├── helpers/                        # Helper functions and utilities
│   ├── case-workflow-helpers.ts   # Common helper functions
│   └── test-case-builder.ts       # Test case builder class
├── shared/                         # Shared setup and cleanup
│   └── setup.ts                    # Shared setup/cleanup functions
├── constants/                      # Test constants and configuration
│   └── test-data.ts                # Test data constants
├── fixtures/                       # Test fixtures
│   └── test-data.ts                # Test fixtures
└── test-files/                     # Test files (images, PDFs, etc.)
    ├── test-image.jpg              # Test image file
    └── test-document.pdf           # Test PDF file
```

## Coverage Matrix

### 1. Authentication & Authorization
**Login Tests:**
- [x] Login with valid credentials
- [x] Login with invalid credentials
- [x] Password visibility toggle
- [x] Form validation - prevent submit with empty email
- [x] Form validation - prevent submit with empty password
- [x] Form validation - prevent submit with invalid email format
- [x] Loading state - disable submit button and form fields when loading
- [x] Login as CS role and verify UI
- [x] Login as Technician role and verify UI
- [x] Login as Leader role and verify UI

**Logout Tests:**
- [x] Logout successfully
- [x] Cannot access protected routes after logout

**Protected Routes Tests:**
- [x] Redirect to login when accessing protected route without authentication
- [x] Can access protected route after successful login

**Error Handling:**
- [x] Error message clears when user starts typing

**Session Management:**
- [x] Redirect to home if already logged in (cannot access login page)
- [x] Maintain session when navigating between pages

### 2. Case Creation
**Basic Functionality:**
- [x] Create case with all required fields
- [x] Sequential dropdown selection (Client → Site → Contact)
- [x] Submit button disabled state
- [x] Different case types (Warranty, Maintenance, Repair)
- [x] Different priorities (Low, Medium, High)
- [x] Only CS can see Create Case button

**File Upload:**
- [x] Upload files during case creation
- [x] File preview for images
- [x] Delete uploaded files before submission
- [x] Upload multiple files

**Error Handling:**
- [x] Backend validation errors display
- [x] Error messages clear when field changes

**Navigation:**
- [x] Back button navigates to case list

**Form Behavior:**
- [x] Change client resets site and contact
- [x] Change site resets contact
- [x] Description field is optional
- [x] Description field accepts text input

**UI States:**
- [x] Submit button and form fields disabled during submission
- [x] Redirects to case list after successful creation
- [x] Created case appears in case list

### 3. Stage 1 - Input & Categorization
**Permissions:**
- [x] CS can edit (assign technician)
- [x] Technician can only view
- [x] Leader can only view
- [x] Other technicians can only view

**Workflows:**
- [x] Assign technician
- [x] Complete stage
- [x] Verify stage advancement

### 4. Stage 2 - Site Investigation
**Permissions:**
- [x] Assigned technician can edit
- [x] CS can only view
- [x] Leader can only view
- [x] Other technicians can only view

**Workflows:**
- [x] Complete investigation report
- [x] Fill checklist
- [x] Upload attachments
- [x] Delete attachments
- [ ] Update investigation report

### 5. Stage 3 - Solution & Plan
**Permissions (No Cost Required):**
- [x] Assigned technician can edit
- [x] CS can only view
- [x] Leader can only view
- [x] Other technicians can only view

**Permissions (Cost Required - Before Approval):**
- [x] Assigned technician can edit (save cost)
- [x] Leader can edit (approve/reject buttons)
- [x] CS can only view
- [x] Other technicians can only view

**Permissions (After Approval):**
- [x] Assigned technician can edit (complete stage)
- [x] CS can edit (view/edit case)
- [x] Leader can only view

**Permissions (After Rejection):**
- [x] Assigned technician can edit (update and resubmit)
- [x] CS can edit (view/edit case)
- [x] Leader can only view

**Workflows:**
- [x] Complete without cost required
- [x] Complete with cost required and approval
- [x] Complete with cost required and rejection
- [x] Update solution after rejection
- [x] Upload attachments
- [x] Update planned execution date

### 6. Stage 4 - Execution
**Permissions:**
- [x] Assigned technician can edit
- [x] CS can only view
- [x] Leader can only view
- [x] Other technicians can only view

**Workflows:**
- [x] Complete execution report
- [x] Fill checklist
- [x] Enter client feedback
- [x] Select client rating
- [x] Upload attachments
- [x] Client signature (canvas)

### 7. Stage 5 - Closing
**Permissions (No Final Cost):**
- [x] CS can edit
- [x] Leader can only view
- [x] Technician can only view

**Permissions (Final Cost Entered - Before Approval):**
- [x] CS can edit (enter final cost)
- [x] Leader can edit (approve/reject buttons)
- [x] Technician can only view

**Permissions (After Final Cost Approval):**
- [x] CS can edit (complete stage)
- [x] Leader can only view
- [x] Technician can only view

**Permissions (After Final Cost Rejection):**
- [x] CS can edit (update final cost)
- [x] Leader can edit (approve/reject buttons)
- [x] Technician can only view

**Workflows:**
- [x] Complete without final cost
- [x] Complete with final cost and approval
- [x] Complete with final cost and rejection
- [x] Update final cost after rejection
- [x] Redo workflow (back to Stage 3)
- [x] Cancel case

### 8. Cost Approval Flows
- [x] Stage 3: Cost required → Save → Leader approve → Complete
- [x] Stage 3: Cost required → Save → Leader reject → Update → Resubmit
- [x] Stage 5: Final cost entered → Save → Leader approve → Complete
- [x] Stage 5: Final cost entered → Save → Leader reject → Update → Resubmit
- [x] Final cost matches estimated cost (no approval needed)
- [x] Final cost differs from estimated cost (approval required)

### 9. Edge Cases
- [x] Different case types (repair, maintenance, warranty)
- [x] Different priorities (low, medium, high)
- [x] Different technicians
- [x] Case with attachments
- [x] Case cancellation
- [x] Case redo (back to Stage 3)
- [x] Status transitions (Open → In Progress → Completed → Closed, Pending → Rejected → Cancelled)
- [ ] Concurrent edits
- [ ] Network errors during save

### 10. Integration Tests
- [x] Complete workflow end-to-end
- [x] Case list filtering (Status, Type, Assigned)
- [x] Case list sorting (Case ID, Client, Stage, Status)
- [ ] Case list pagination
- [ ] Case search
- [x] Case details navigation
- [x] Back navigation (from case detail to case list)
- [x] Email notification (when advancing to Stage 5)

## Test Status Legend
- [x] Covered
- [ ] Not covered / TODO
- [~] Partially covered

## Notes
- Tests should be independent and can run in parallel
- Each test should cleanup after itself
- Use helper functions for common operations
- Use constants for test data
- Document complex test scenarios

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui

# Run specific test file
npm run test:e2e -- tests/auth/login.spec.ts

# Run tests in a specific folder
npm run test:e2e -- tests/case/
```
