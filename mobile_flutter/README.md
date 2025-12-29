# FurniCare Mobile App

Flutter mobile application for FurniCare warranty management system.

## Features

- Login screen with authentication
- Case list screen with filtering and sorting
- Create case screen with form validation
- Case detail screen with stage management

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

5. Nếu có bug run lại
```bash
flutter clean
flutter pub get
flutter run
```

6. Có file lỗi
- Cài đặt dependencies (nếu chưa chạy)
```bash
flutter pub get
```

- Generate các file .g.dart cho JSON serialization
```bash
flutter pub run build_runner build -delete-conflicting-outputs
```

## Project Structure

- `lib/config/` - App configuration and routes
- `lib/core/` - Core infrastructure (API, storage, utils)
- `lib/features/` - Feature modules (auth, case_list, create_case, case_details)
- `lib/shared/` - Shared widgets and constants

## API Integration

The app connects to the existing Ruby backend API. Ensure the backend is running and accessible at the configured `API_BASE_URL`.

## Authentication

The app uses JWT token-based authentication. Tokens are stored securely using `flutter_secure_storage`.

## iOS

sudo gem uninstall cocoapods
sudo gem install cocoapods
pod setup
