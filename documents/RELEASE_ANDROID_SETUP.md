# Android Release Setup Guide

## Tạo Keystore

Để build release APK/AAB, bạn cần tạo keystore file:

```bash
cd mobile_flutter/android
keytool -genkey -v -keystore keystore/furnicare-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias furnicare
```

Lệnh này sẽ tạo file `keystore/furnicare-release.jks` và yêu cầu bạn nhập:
- Keystore password
- Key password (có thể giống keystore password)
- Thông tin về organization

## Cấu hình key.properties

1. Copy file example:
```bash
cp key.properties.example key.properties
```

2. Mở `key.properties` và điền thông tin:
```properties
storePassword=your_keystore_password
keyPassword=your_key_password
keyAlias=furnicare
storeFile=../keystore/furnicare-release.jks
```

**QUAN TRỌNG**: 
- File `key.properties` và `keystore/` KHÔNG được commit vào git
- Giữ keystore file và passwords an toàn
- Nếu mất keystore, bạn sẽ không thể update app trên Play Store

## Build Release

Sau khi cấu hình keystore:

```bash
cd mobile_flutter
flutter build appbundle --release  # For Play Store
# hoặc
flutter build apk --release  # For direct install
```

File build sẽ nằm tại:
- AAB: `build/app/outputs/bundle/release/app-release.aab`
- APK: `build/app/outputs/flutter-apk/app-release.apk`

## Nếu chưa có keystore

Nếu chưa tạo keystore, app vẫn có thể build release nhưng sẽ dùng debug signing (không phù hợp cho production release lên Play Store).

