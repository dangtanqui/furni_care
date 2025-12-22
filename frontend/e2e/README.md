# E2E Tests với Playwright

Thư mục này chứa các end-to-end tests cho ứng dụng FurniCare sử dụng Playwright.

## Cài đặt

Playwright đã được cài đặt trong `devDependencies`. Để cài đặt browsers:

```bash
npm install
npx playwright install
```

## Chạy Tests

### Chạy tất cả tests
```bash
npm run test:e2e
```

### Chạy với UI mode (khuyến nghị cho development)
```bash
npm run test:e2e:ui
```

### Chạy với browser hiển thị (headed mode)
```bash
npm run test:e2e:headed
```

### Chạy ở chế độ debug
```bash
npm run test:e2e:debug
```

### Xem test report
```bash
npm run test:e2e:report
```

## Yêu cầu

Trước khi chạy tests, đảm bảo:

1. **Setup test database** (chỉ cần làm 1 lần hoặc khi reset):
   
   **Chạy từ backend directory:**
   
   **Windows PowerShell:**
   ```powershell
   cd ../backend
   $env:RAILS_ENV = "test"
   bundle exec rake e2e:setup
   ```
   
   **Linux/Mac:**
   ```bash
   cd ../backend
   RAILS_ENV=test bundle exec rake e2e:setup
   ```

2. **Backend server sẽ tự động chạy** với `RAILS_ENV=test` và dùng database `furni_care_test`
   - Playwright sẽ tự động khởi động backend server
   - Backend chạy tại `http://localhost:3000`

3. **Frontend dev server sẽ tự động chạy** tại `http://localhost:5173`
   - Playwright sẽ tự động khởi động frontend dev server

## Test Database

E2E tests sử dụng **test database riêng** (`furni_care_test`) để:
- Tránh ảnh hưởng đến development database
- Đảm bảo data consistency giữa các test runs
- Có thể reset database trước mỗi test run nếu cần

### Setup Test Database

**Chạy từ backend directory:**

**Windows PowerShell:**
```powershell
cd ../backend
$env:RAILS_ENV = "test"
bundle exec rake e2e:setup
```

**Linux/Mac:**
```bash
cd ../backend
RAILS_ENV=test bundle exec rake e2e:setup
```

### Reset Test Database

**Chạy từ backend directory:**

**Windows PowerShell:**
```powershell
cd ../backend
$env:RAILS_ENV = "test"
bundle exec rake e2e:reset
```

**Linux/Mac:**
```bash
cd ../backend
RAILS_ENV=test bundle exec rake e2e:reset
```

### Test Data

Test database sẽ được seed với:
- **Users**: 
  - `cs@demo.com` / `password` (CS role)
  - `tech@demo.com` / `password` (Technician role)
  - `tech1@demo.com` / `password` (Technician role)
  - `leader@demo.com` / `password` (Leader role)
- **Clients**: ABC Furniture, XYZ Interior
- **Sites**: HCM Office, HN Branch, Da Nang Store
- **Contacts**: Nguyen Van A, Tran Thi B, Le Van C, Pham Thi D

## Cấu trúc Tests

- `auth.spec.ts` - Tests cho authentication flow
- `case-workflow.spec.ts` - Tests cho complete case workflow (Stage 1-5)

## Environment Variables

Bạn có thể set các biến môi trường:

- `PLAYWRIGHT_BASE_URL` - Base URL cho frontend (default: `http://localhost:5173`)
- `PLAYWRIGHT_API_URL` - Base URL cho backend API (default: `http://localhost:3000`)

## Lưu ý

- Test files (`e2e/*.spec.ts`) được commit vào git để team có thể chạy
- Các file generated (`playwright-report/`, `test-results/`) được ignore trong `.gitignore`
- Khi deploy production, chỉ deploy `dist/` folder → không bao gồm test files

