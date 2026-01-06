# Release Guide - FurniCare Mobile App

Hướng dẫn build và release app lên Google Play Store và Apple App Store.

## Prerequisites

- Flutter SDK đã được cài đặt và cấu hình
- Android Studio (cho Android builds)
- Xcode (cho iOS builds, chỉ trên macOS)
- Google Play Console account (cho Android)
- Apple Developer account (cho iOS)

## Version Management

Version được quản lý trong `pubspec.yaml`:
- Format: `MAJOR.MINOR.PATCH+BUILD_NUMBER`
- Hiện tại: `1.0.0+1`
- Khi release mới, update version trong `pubspec.yaml`

## Android Release

### 1. Setup Keystore (Chỉ cần làm 1 lần)

Xem chi tiết trong [android/RELEASE_SETUP.md](android/RELEASE_SETUP.md)

Tóm tắt:
```bash
cd mobile_flutter/android
keytool -genkey -v -keystore keystore/furnicare-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias furnicare
cp key.properties.example key.properties
# Edit key.properties với thông tin keystore của bạn
```

### 2. Build Release

#### Build AAB (cho Play Store):
```bash
cd mobile_flutter
flutter clean
flutter pub get
flutter build appbundle --release
```

File output: `build/app/outputs/bundle/release/app-release.aab`

#### Build APK (cho direct install):
```bash
flutter build apk --release
```

File output: `build/app/outputs/flutter-apk/app-release.apk`

### 3. Upload to Google Play Store

1. Đăng nhập vào [Google Play Console](https://play.google.com/console)
2. Tạo app mới hoặc chọn app existing
3. Vào **Production** > **Create new release**
4. Upload file `app-release.aab`
5. Điền release notes
6. Review và submit

## iOS Release

### 1. Xcode Configuration

1. Mở project trong Xcode:
```bash
cd mobile_flutter/ios
open Runner.xcworkspace
```

2. Verify configuration:
   - **Signing & Capabilities**: Chọn team và verify automatic signing
   - **Bundle Identifier**: `com.furnicare.furniCareMobile`
   - **Version**: Kiểm tra version trong General tab

3. Select **Any iOS Device** hoặc specific device từ device dropdown

### 2. Build Archive

1. Trong Xcode: **Product** > **Archive**
2. Đợi archive hoàn thành
3. Window **Organizer** sẽ mở tự động

### 3. Upload to App Store Connect

1. Trong Organizer, chọn archive vừa tạo
2. Click **Distribute App**
3. Chọn **App Store Connect**
4. Chọn **Upload**
5. Follow wizard để upload
6. Đợi processing hoàn thành (có thể mất vài phút đến vài giờ)

### 4. App Store Connect

1. Đăng nhập vào [App Store Connect](https://appstoreconnect.apple.com)
2. Vào **My Apps** > chọn app
3. Vào **TestFlight** để test build hoặc **App Store** để submit
4. Điền app metadata (description, screenshots, etc.)
5. Submit for review

## Environment Configuration

App sử dụng environment files:
- `.env.development` - Development environment
- `.env.staging` - Staging environment  
- `.env.production` - Production environment

File được load dựa trên build flavor hoặc default là development.

Để build với environment cụ thể:
```bash
flutter build appbundle --release --dart-define=ENV=production
```

## App Icons

### iOS
App icons đã được cấu hình trong `ios/Runner/Assets.xcassets/AppIcon.appiconset/`

### Android
App sử dụng adaptive icons trong `android/app/src/main/res/mipmap-*/`

Để thay đổi app icon, thay thế các file icon trong các thư mục tương ứng.

## Testing Before Release

### Checklist

- [ ] Test trên Android emulator/device
- [ ] Test trên iOS simulator/device
- [ ] Test với các user roles (CS, Technician, Leader)
- [ ] Test các flows chính:
  - [ ] Login/Logout
  - [ ] Case list với filters và sorting
  - [ ] Create case
  - [ ] Case details với stage management
- [ ] Test offline scenarios
- [ ] Test với slow network
- [ ] Verify API URLs đúng cho production

## Troubleshooting

### Android Build Issues

**Error: Keystore file not found**
- Verify `key.properties` đã được tạo và path đúng
- Verify keystore file tồn tại tại path chỉ định

**Error: ProGuard issues**
- Check `android/app/proguard-rules.pro`
- Verify rules không conflict với dependencies

### iOS Build Issues

**Error: Code signing**
- Verify Apple Developer account đã được thêm vào Xcode
- Check bundle identifier đúng
- Verify certificates và provisioning profiles

**Error: Archive failed**
- Clean build folder: **Product** > **Clean Build Folder** (Shift + Cmd + K)
- Delete DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData`
- Rebuild

## Notes

- **Keystore Security**: Giữ keystore file và passwords an toàn. Nếu mất, không thể update app trên Play Store.
- **Version Updates**: Mỗi release mới cần update version trong `pubspec.yaml`
- **Environment Files**: `.env.production` không nên commit vào git
- **Build Time**: Release builds có thể mất 5-15 phút tùy vào machine

## Support

Nếu gặp vấn đề, check:
- [Flutter Documentation](https://docs.flutter.dev/deployment)
- [Android Release Guide](https://docs.flutter.dev/deployment/android)
- [iOS Release Guide](https://docs.flutter.dev/deployment/ios)

