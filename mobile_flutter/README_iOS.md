# Hướng dẫn chạy iOS cho FurniCare Mobile App

## Các bước để chạy app trên iOS:

### 1. Cài đặt CocoaPods (nếu chưa có)

```bash
sudo gem install cocoapods
pod setup
```

Nếu gặp lỗi với CocoaPods, thử:
```bash
sudo gem uninstall cocoapods
sudo gem install cocoapods
```

### 2. QUAN TRỌNG: Tạo đầy đủ iOS project

**Bước này BẮT BUỘC** để Flutter tạo đầy đủ cấu trúc iOS project:

```bash
cd mobile_flutter

# Cài đặt Flutter dependencies
flutter pub get

# Tạo đầy đủ iOS project (nếu chưa có)
flutter create --platforms=ios .
```

Lệnh `flutter create --platforms=ios` sẽ tạo các file trong `ios/Flutter/ephemeral/Flutter/` mà CocoaPods cần.

### 3. Cài đặt dependencies với CocoaPods

```bash
cd ios
pod install
```

**Lưu ý:** 
- Luôn chạy `pod install` trong thư mục `ios/`, không phải thư mục root của project.
- Phải chạy `flutter pub get` trước khi chạy `pod install`

### 4. Mở project trong Xcode

Có 2 cách:

**Cách 1: Mở bằng Flutter (Khuyến nghị)**
```bash
cd mobile_flutter
flutter run -d ios
```

**Cách 2: Mở bằng Xcode thủ công**
```bash
cd mobile_flutter/ios
open Runner.xcworkspace
```

**QUAN TRỌNG:** Luôn mở file `.xcworkspace`, KHÔNG mở `.xcodeproj`!

### 5. Chạy app trong Xcode

1. Mở `Runner.xcworkspace` trong Xcode
2. Chọn simulator hoặc thiết bị iOS từ dropdown ở trên cùng
3. Nhấn nút Run (▶️) hoặc nhấn `Cmd + R`

## Cấu trúc thư mục iOS:

```
mobile_flutter/
├── ios/
│   ├── Podfile                    # File cấu hình CocoaPods
│   ├── Runner.xcworkspace        # File để mở trong Xcode (QUAN TRỌNG!)
│   ├── Runner.xcodeproj          # Project file (KHÔNG mở trực tiếp)
│   ├── Runner/                   # Source code iOS
│   └── Flutter/                  # Flutter framework files
└── lib/                          # Dart source code
```

## Troubleshooting:

### Lỗi: "No Podfile found"
- Đảm bảo bạn đang ở trong thư mục `mobile_flutter/ios/`
- Chạy `pod install` từ thư mục `ios/`

### Lỗi: "cannot load such file -- podhelper" hoặc "podhelper not found"
**Đây là lỗi phổ biến nhất!** Bạn cần tạo đầy đủ iOS project trước:

```bash
cd mobile_flutter

# Bước 1: Cài đặt Flutter dependencies
flutter pub get

# Bước 2: Tạo đầy đủ iOS project (QUAN TRỌNG!)
flutter create --platforms=ios .

# Bước 3: Cài đặt CocoaPods
cd ios
pod install
```

Lệnh `flutter create --platforms=ios` sẽ tạo các file Flutter ephemeral cần thiết trong `ios/Flutter/ephemeral/Flutter/`.

### Lỗi: "CocoaPods not installed"
```bash
sudo gem install cocoapods
pod setup
```

### Lỗi: "Unable to find a specification"
```bash
cd ios
pod repo update
pod install
```

### Lỗi khi build trong Xcode
1. Clean build folder: `Product > Clean Build Folder` (Shift + Cmd + K)
2. Xóa DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData`
3. Chạy lại `pod install`
4. Build lại trong Xcode

### Cập nhật dependencies sau khi thay đổi pubspec.yaml
```bash
cd mobile_flutter
flutter pub get
cd ios
pod install
```

## Chạy từ terminal với Flutter:

```bash
cd mobile_flutter

# List các iOS devices/simulators
flutter devices

# Chạy trên iOS simulator
flutter run -d ios

# Chạy trên thiết bị cụ thể
flutter run -d <device-id>
```

