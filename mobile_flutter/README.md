# FurniCare Mobile App

Flutter mobile application for FurniCare warranty management system. The app reuses the existing Ruby backend APIs and matches the mobile-responsive design of the ReactJS app.

## Features

- **Login Screen** - Email/password authentication with "Remember Me" functionality
- **Case List Screen** - Filterable and sortable case list with pagination
- **Create Case Screen** - Form with cascading dropdowns (Client → Site → Contact) and file upload
- **Case Detail Screen** - Case details with stage management and progress tracking

## Setup

1. Install Flutter dependencies:
```bash
flutter pub get
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your API base URL

4. Run the app:
```bash
flutter run
```

5. If you encounter issues, try:
```bash
flutter clean
flutter pub get
flutter run
```

## Code Generation

This project uses `json_serializable` for automatic JSON serialization/deserialization.

After adding or modifying models in `lib/core/api/models/`, run:

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

This will generate the `.g.dart` files needed for JSON serialization.

**Models requiring generation:**
- `lib/core/api/models/auth_models.dart` → `auth_models.g.dart`
- `lib/core/api/models/case_models.dart` → `case_models.g.dart`
- `lib/core/api/models/data_models.dart` → `data_models.g.dart`

**Watch mode** (for continuous generation during development):
```bash
flutter pub run build_runner watch
```

## iOS Setup

### Prerequisites

1. Install CocoaPods (if not already installed):
```bash
sudo gem install cocoapods
pod setup
```

If you encounter CocoaPods errors, try:
```bash
sudo gem uninstall cocoapods
sudo gem install cocoapods
```

### Setup Steps

1. **Create iOS project** (required for CocoaPods):
```bash
cd mobile_flutter
flutter pub get
flutter create --platforms=ios .
```

2. **Install CocoaPods dependencies**:
```bash
cd ios
pod install
```

**Important:** Always run `pod install` from the `ios/` directory, not the project root.

3. **Run the app**:

**Option 1: Using Flutter (Recommended)**
```bash
cd mobile_flutter
flutter run -d ios
```

**Option 2: Using Xcode**
```bash
cd mobile_flutter/ios
open Runner.xcworkspace
```

**Important:** Always open `.xcworkspace`, NOT `.xcodeproj`!

### iOS Troubleshooting

**"No Podfile found"**
- Ensure you're in the `mobile_flutter/ios/` directory
- Run `pod install` from the `ios/` directory

**"cannot load such file -- podhelper" or "podhelper not found"**
- Create the full iOS project first:
```bash
cd mobile_flutter
flutter pub get
flutter create --platforms=ios .
cd ios
pod install
```

**"CocoaPods not installed"**
```bash
sudo gem install cocoapods
pod setup
```

**"Unable to find a specification"**
```bash
cd ios
pod repo update
pod install
```

**Build errors in Xcode**
1. Clean build folder: `Product > Clean Build Folder` (Shift + Cmd + K)
2. Delete DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData`
3. Run `pod install` again
4. Rebuild in Xcode

**Update dependencies after changing pubspec.yaml**
```bash
cd mobile_flutter
flutter pub get
cd ios
pod install
```

## Project Structure

```
mobile_flutter/
├── lib/
│   ├── config/          # App configuration and routes
│   ├── core/            # Core infrastructure
│   │   ├── api/         # HTTP client, endpoints, models
│   │   ├── services/    # API services (auth, case, data)
│   │   ├── storage/     # Secure storage for tokens
│   │   └── utils/       # Error handling, validators
│   ├── features/        # Feature modules
│   │   ├── auth/        # Authentication
│   │   ├── case_list/   # Case list with filters
│   │   ├── create_case/ # Create case form
│   │   └── case_details/# Case detail view
│   └── shared/          # Shared widgets and constants
├── android/
├── ios/
└── pubspec.yaml
```

## API Integration

The app connects to the existing Ruby backend API. Ensure the backend is running and accessible at the configured `API_BASE_URL`.

### API Endpoints

**Authentication:**
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

**Cases:**
- `GET /api/cases` - List cases with filters and pagination
- `GET /api/cases/:id` - Get case details
- `POST /api/cases` - Create new case
- `PATCH /api/cases/:id` - Update case
- `POST /api/cases/:id/advance_stage` - Advance case stage
- `POST /api/cases/:id/attachments` - Upload attachments
- `DELETE /api/cases/:id/case_attachments/:attachment_id` - Delete attachment

**Data:**
- `GET /api/clients` - List clients
- `GET /api/clients/:id/sites` - Get sites for a client
- `GET /api/sites/:id/contacts` - Get contacts for a site
- `GET /api/users/technicians` - List technicians

## Authentication

The app uses JWT token-based authentication. Tokens are stored securely using `flutter_secure_storage`.

- Tokens expire after 30 days if "Remember Me" is checked, otherwise 1 day
- Auto-logout on 401 responses
- Email is remembered (not password) when "Remember Me" is checked

## Dependencies

Key dependencies used in this project:

- `dio` - HTTP client with interceptors
- `flutter_secure_storage` - Secure token storage
- `provider` - State management
- `flutter_dotenv` - Environment configuration
- `json_serializable` - JSON serialization
- `go_router` - Navigation
- `image_picker` & `file_picker` - File selection
- `cached_network_image` - Image caching

See `pubspec.yaml` for the complete list.

## Color Scheme

Based on ReactJS design:
- **Primary:** `#1e3a5f` (dark blue)
- **Accent:** `#0d9488` (teal)
- **Status Colors:**
  - Open: Blue
  - In Progress/Pending: Yellow
  - Completed/Closed: Green
  - Cancelled: Gray
  - Rejected: Red
- **Priority Colors:**
  - Low: Gray
  - Medium: Yellow
  - High: Red
