# Flutter Mobile App Implementation Plan

## Overview
This document outlines the implementation plan for converting the ReactJS frontend features to a Flutter mobile app. The app will reuse the existing Ruby backend APIs and match the mobile-responsive design of the ReactJS app.

## 1. Folder Structure

```
mobile_flutter/
├── lib/
│   ├── main.dart
│   ├── app.dart
│   │
│   ├── config/
│   │   ├── app_config.dart          # Environment configuration
│   │   └── routes.dart              # Route definitions
│   │
│   ├── core/
│   │   ├── api/
│   │   │   ├── api_client.dart      # HTTP client with interceptors
│   │   │   ├── endpoints.dart       # API endpoint constants
│   │   │   └── models/
│   │   │       ├── auth_models.dart
│   │   │       ├── case_models.dart
│   │   │       └── data_models.dart
│   │   │
│   │   ├── services/
│   │   │   ├── auth_service.dart    # Authentication service
│   │   │   ├── case_service.dart    # Case CRUD operations
│   │   │   └── data_service.dart    # Clients, sites, contacts
│   │   │
│   │   ├── storage/
│   │   │   └── secure_storage.dart  # Token & user data storage
│   │   │
│   │   └── utils/
│   │       ├── error_handler.dart   # Error handling utilities
│   │       └── validators.dart      # Form validation
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── models/
│   │   │   │   └── auth_state.dart
│   │   │   ├── providers/
│   │   │   │   └── auth_provider.dart
│   │   │   └── screens/
│   │   │       └── login_screen.dart
│   │   │
│   │   ├── case_list/
│   │   │   ├── models/
│   │   │   │   └── case_list_state.dart
│   │   │   ├── providers/
│   │   │   │   └── case_list_provider.dart
│   │   │   ├── screens/
│   │   │   │   └── case_list_screen.dart
│   │   │   └── widgets/
│   │   │       ├── case_table.dart
│   │   │       └── case_filters.dart
│   │   │
│   │   ├── create_case/
│   │   │   ├── models/
│   │   │   │   └── create_case_state.dart
│   │   │   ├── providers/
│   │   │   │   └── create_case_provider.dart
│   │   │   ├── screens/
│   │   │   │   └── create_case_screen.dart
│   │   │   └── widgets/
│   │   │       └── case_form.dart
│   │   │
│   │   └── case_details/
│   │       ├── models/
│   │       │   └── case_details_state.dart
│   │       ├── providers/
│   │       │   └── case_details_provider.dart
│   │       ├── screens/
│   │       │   └── case_details_screen.dart
│   │       └── widgets/
│   │           ├── case_header.dart
│   │           └── stage_section.dart
│   │
│   └── shared/
│       ├── widgets/
│       │   ├── button.dart
│       │   ├── text_field.dart
│       │   ├── select_dropdown.dart
│       │   ├── skeleton_loader.dart
│       │   ├── empty_state.dart
│       │   └── toast.dart
│       │
│       └── constants/
│           ├── case_status.dart
│           ├── stages.dart
│           └── roles.dart
│
├── assets/
│   └── images/
│
├── test/                          # (Excluded per requirements)
│
├── android/
├── ios/
├── pubspec.yaml
├── .env.example
└── README.md
```

## 2. Screen-by-Screen Mapping

### 2.1 Login Screen
**ReactJS:** `frontend/src/pages/Login.tsx` + `LoginForm.tsx`

**Flutter Equivalent:**
- **Screen:** `lib/features/auth/screens/login_screen.dart`
- **Key Features:**
  - Email input field with validation
  - Password input field with show/hide toggle
  - "Remember Me" checkbox
  - Login button with loading state
  - Error message display
  - Demo account info display
  - Auto-redirect if already authenticated
  - Remember email functionality (NOT password)

**UI Components:**
- Custom text fields with validation
- Password visibility toggle icon
- Primary button
- Error banner
- Logo and branding

### 2.2 Case List Screen
**ReactJS:** `frontend/src/pages/CaseList.tsx` + `CaseTable.tsx` + `CaseFilters.tsx`

**Flutter Equivalent:**
- **Screen:** `lib/features/case_list/screens/case_list_screen.dart`
- **Key Features:**
  - Header with "Case List" title
  - "Create Case" button (visible only for CS role)
  - Filter section (Status, Type, Assigned To)
  - Sortable table with columns:
    - Case ID (sortable)
    - Client (sortable)
    - Site (sortable)
    - Stage (sortable)
    - Status (sortable, with badge)
    - Priority (sortable, with color coding)
    - Assigned (sortable)
  - Pagination controls
  - Empty state when no cases
  - Loading skeleton
  - Row click navigation to case details

**UI Components:**
- AppBar with action button
- Filter chips/dropdowns
- DataTable or ListView with custom cells
- Pagination widget
- Empty state widget
- Skeleton loaders

### 2.3 Create Case Screen
**ReactJS:** `frontend/src/pages/CreateCase.tsx` + `CaseForm.tsx`

**Flutter Equivalent:**
- **Screen:** `lib/features/create_case/screens/create_case_screen.dart`
- **Key Features:**
  - Back button
  - Form with fields:
    - Client (dropdown, required)
    - Site (dropdown, required, depends on client)
    - Contact Person (dropdown, required, depends on site)
    - Description (textarea, optional)
    - File upload with preview
    - Case Type (dropdown, required)
    - Priority (dropdown, required)
  - Field validation with error messages
  - Success indicators on valid fields
  - Submit button (disabled until required fields filled)
  - Loading state during submission

**UI Components:**
- Form with validation
- Dropdown selectors
- Text area
- File picker with image preview grid
- Primary button

### 2.4 Case Detail Screen
**ReactJS:** `frontend/src/pages/CaseDetails.tsx` + `CaseHeader.tsx` + `StageSection.tsx`

**Flutter Equivalent:**
- **Screen:** `lib/features/case_details/screens/case_details_screen.dart`
- **Key Features:**
  - Back button
  - Case header card with:
    - Case ID
    - Client name
    - Current stage with attempt number
    - Status badge
    - Priority indicator
    - Stage progress indicator (5 stages)
  - Expandable stage sections (5 stages)
  - Stage-specific content and actions
  - Loading skeleton
  - Error display

**UI Components:**
- Card widgets
- Expandable sections
- Progress indicator
- Status badges
- Action buttons

## 3. API Integration Approach

### 3.1 HTTP Client Setup
- **Package:** `http` or `dio` (recommend `dio` for interceptors)
- **Base URL:** Configurable via environment variables
- **Interceptors:**
  - Request: Add Bearer token from secure storage
  - Response: Handle 401 errors (logout and redirect to login)
  - Error: Normalize errors to consistent format

### 3.2 API Endpoints Mapping

**Authentication:**
- `POST /api/auth/login` → `AuthService.login()`
- `GET /api/auth/me` → `AuthService.getMe()`

**Cases:**
- `GET /api/cases` → `CaseService.getCases()`
- `GET /api/cases/:id` → `CaseService.getCase()`
- `POST /api/cases` → `CaseService.createCase()`
- `PATCH /api/cases/:id` → `CaseService.updateCase()`
- `POST /api/cases/:id/advance_stage` → `CaseService.advanceStage()`
- `POST /api/cases/:id/attachments` → `CaseService.uploadAttachments()`
- `DELETE /api/cases/:id/case_attachments/:attachment_id` → `CaseService.deleteAttachment()`

**Data:**
- `GET /api/clients` → `DataService.getClients()`
- `GET /api/clients/:id/sites` → `DataService.getSites()`
- `GET /api/sites/:id/contacts` → `DataService.getContacts()`
- `GET /api/users/technicians` → `DataService.getTechnicians()`

### 3.3 Data Models
- Convert TypeScript interfaces to Dart classes
- Use `json_serializable` for JSON serialization/deserialization
- Match ReactJS model structure exactly

## 4. Authentication & Token Storage

### 4.1 Token Storage
- **Package:** `flutter_secure_storage`
- **Storage Keys:**
  - `token` - JWT token
  - `token_expiration` - Expiration timestamp
  - `remembered_email` - Email (only if remember me checked)
  - `remember_me` - Boolean flag

### 4.2 Authentication Flow
1. **Login:**
   - User enters email/password
   - Call `POST /api/auth/login` with `remember_me` flag
   - Store token and expiration (30 days if remember me, 1 day otherwise)
   - Store email if remember me checked
   - Navigate to case list

2. **Token Validation:**
   - On app start, check if token exists and not expired
   - If valid, call `GET /api/auth/me` to get user data
   - If invalid/expired, clear storage and show login

3. **Auto-Logout:**
   - On 401 response, clear token and redirect to login
   - On token expiration check, logout if expired

### 4.3 State Management
- Use `Provider` or `Riverpod` for auth state
- AuthProvider holds:
  - `user` (User object)
  - `token` (String?)
  - `isCS`, `isTechnician`, `isLeader` (computed from role)
  - `login()` method
  - `logout()` method

## 5. Environment Configuration

### 5.1 Environment Files
Create `.env` files for different environments:

**.env.development:**
```
API_BASE_URL=http://localhost:3000/api
```

**.env.staging:**
```
API_BASE_URL=https://staging-api.example.com/api
```

**.env.production:**
```
API_BASE_URL=https://api.example.com/api
```

### 5.2 Configuration Management
- **Package:** `flutter_dotenv`
- Load appropriate `.env` file based on build flavor
- Access via `dotenv.env['API_BASE_URL']`
- Fallback to default if not set

### 5.3 Build Flavors
- **Development:** Uses `.env.development`
- **Staging:** Uses `.env.staging`
- **Production:** Uses `.env.production`

## 6. Step-by-Step Execution Order

### Phase 1: Project Setup
1. ✅ Create `mobile_flutter/` directory
2. ✅ Initialize Flutter project: `flutter create mobile_flutter`
3. ✅ Update `pubspec.yaml` with dependencies:
   - `http` or `dio` (HTTP client)
   - `flutter_secure_storage` (token storage)
   - `provider` or `riverpod` (state management)
   - `flutter_dotenv` (environment config)
   - `json_serializable` + `json_annotation` (JSON serialization)
   - `intl` (date formatting)
   - `image_picker` (file uploads)
   - `file_picker` (file selection)
4. ✅ Create folder structure
5. ✅ Set up environment configuration files

### Phase 2: Core Infrastructure
6. ✅ Create `app_config.dart` for environment management
7. ✅ Create `api_client.dart` with interceptors
8. ✅ Create `secure_storage.dart` for token management
9. ✅ Create `endpoints.dart` with API endpoint constants
10. ✅ Create data models (auth, case, data models)
11. ✅ Create services (auth, case, data services)
12. ✅ Create error handler utility

### Phase 3: Authentication
13. ✅ Create `AuthProvider` for state management
14. ✅ Create `LoginScreen` with form
15. ✅ Implement login API integration
16. ✅ Implement token storage and validation
17. ✅ Implement auto-logout on 401
18. ✅ Test login flow

### Phase 4: Case List Screen
19. ✅ Create `CaseListProvider` for state management
20. ✅ Create `CaseListScreen` with header and filters
21. ✅ Create `CaseTable` widget with sortable columns
22. ✅ Create `CaseFilters` widget
23. ✅ Implement pagination
24. ✅ Implement empty state
25. ✅ Implement loading skeleton
26. ✅ Test case list with filters, sorting, pagination

### Phase 5: Create Case Screen
27. ✅ Create `CreateCaseProvider` for state management
28. ✅ Create `CreateCaseScreen` with form
29. ✅ Create `CaseForm` widget with all fields
30. ✅ Implement cascading dropdowns (Client → Site → Contact)
31. ✅ Implement file upload with preview
32. ✅ Implement form validation
33. ✅ Test create case flow

### Phase 6: Case Detail Screen
34. ✅ Create `CaseDetailsProvider` for state management
35. ✅ Create `CaseDetailsScreen` with header
36. ✅ Create `CaseHeader` widget with progress indicator
37. ✅ Create `StageSection` widget (expandable)
38. ✅ Implement stage-specific content
39. ✅ Implement loading skeleton
40. ✅ Test case detail view

### Phase 7: Navigation & Routing
41. ✅ Set up routing with `go_router` or `flutter_navigation`
42. ✅ Implement protected routes (require authentication)
43. ✅ Implement navigation between screens
44. ✅ Test navigation flow

### Phase 8: UI Polish
45. ✅ Match colors and styling from ReactJS CSS
46. ✅ Implement responsive design for different screen sizes
47. ✅ Add loading states and error handling
48. ✅ Add toast notifications for success/error
49. ✅ Test on different devices

### Phase 9: Final Testing
50. ✅ Test all user flows
51. ✅ Test error scenarios
52. ✅ Test with different user roles (CS, Technician, Leader)
53. ✅ Verify API integration matches ReactJS behavior
54. ✅ Performance testing

## 7. Key Design Decisions

### 7.1 State Management
- **Choice:** Provider (simpler, built-in) or Riverpod (more powerful)
- **Recommendation:** Provider for simplicity, matches "minimal and straightforward" requirement

### 7.2 HTTP Client
- **Choice:** `http` (simple) or `dio` (feature-rich)
- **Recommendation:** `dio` for better interceptor support and error handling

### 7.3 Navigation
- **Choice:** `go_router` (declarative) or `flutter_navigation` (imperative)
- **Recommendation:** `go_router` for cleaner route definitions

### 7.4 UI Styling
- **Approach:** Match ReactJS Tailwind CSS classes with Flutter equivalents
- **Colors:** Extract from ReactJS CSS files
- **Spacing:** Use consistent padding/margin values
- **Typography:** Match font sizes and weights

## 8. Excluded Features (Per Requirements)
- ❌ Unit tests
- ❌ E2E tests
- ❌ Storybook
- ❌ New Relic monitoring
- ❌ Sentry error tracking
- ❌ Admin features
- ❌ Desktop-only features

## 9. Dependencies Summary

```yaml
dependencies:
  flutter:
    sdk: flutter
  dio: ^5.4.0                    # HTTP client
  flutter_secure_storage: ^9.0.0 # Token storage
  provider: ^6.1.1              # State management
  flutter_dotenv: ^5.1.0        # Environment config
  json_annotation: ^4.8.1       # JSON serialization
  intl: ^0.19.0                 # Date formatting
  image_picker: ^1.0.7          # Image selection
  file_picker: ^6.1.1           # File selection
  go_router: ^13.0.0            # Navigation
  cached_network_image: ^3.3.1   # Image caching

dev_dependencies:
  flutter_test:
    sdk: flutter
  json_serializable: ^6.7.1     # Code generation
  build_runner: ^2.4.7          # Code generation runner
```

## 10. Color Scheme (from ReactJS CSS)

Based on ReactJS styles:
- **Primary:** `#1e3a5f` (dark blue)
- **Accent:** `#0d9488` (teal)
- **Status Colors:**
  - Open: `bg-blue-100 text-blue-700`
  - In Progress/Pending: `bg-yellow-100 text-yellow-700`
  - Completed/Closed: `bg-green-100 text-green-700`
  - Cancelled: `bg-gray-100 text-gray-700`
  - Rejected: `bg-red-100 text-red-700`
- **Priority Colors:**
  - Low: `text-gray-500`
  - Medium: `text-yellow-600`
  - High: `text-red-600`

## 11. Success Criteria

✅ All 4 screens implemented and functional
✅ UI matches mobile-responsive ReactJS design
✅ API integration works with existing backend
✅ Authentication flow matches ReactJS behavior
✅ Token storage and expiration handling works
✅ Error handling matches ReactJS patterns
✅ Loading states and skeletons implemented
✅ Form validation matches ReactJS validation
✅ Navigation flow works correctly
✅ Works on iOS and Android

---

**Next Steps:** Begin Phase 1 implementation.

