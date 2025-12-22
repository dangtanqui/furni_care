# E2E Test Database Setup

## Rake Tasks

Có 2 rake tasks để quản lý test database:

- `rake e2e:setup` - Setup test database (drop, create, migrate, seed)
- `rake e2e:reset` - Reset test database (drop, create, migrate, seed)

**Lưu ý:** Các tasks này **bắt buộc** phải chạy với `RAILS_ENV=test` để đảm bảo an toàn.

## Setup Test Database

Chạy từ **backend directory**:

### Windows PowerShell

```powershell
# Cách 1: Set environment variable trước
$env:RAILS_ENV = "test"
bundle exec rake e2e:setup

# Cách 2: Set trong cùng command (PowerShell 7+)
$env:RAILS_ENV = "test"; bundle exec rake e2e:setup
```

### Linux/Mac (Bash)

```bash
# Cách 1: Set environment variable trong command
RAILS_ENV=test bundle exec rake e2e:setup

# Cách 2: Export trước
export RAILS_ENV=test
bundle exec rake e2e:setup
```

## Reset Test Database

### Windows PowerShell

```powershell
# Cách 1: Set environment variable trước
$env:RAILS_ENV = "test"
bundle exec rake e2e:reset

# Cách 2: Set trong cùng command
$env:RAILS_ENV = "test"; bundle exec rake e2e:reset
```

### Linux/Mac (Bash)

```bash
RAILS_ENV=test bundle exec rake e2e:reset
```

## Xem danh sách tasks

```bash
bundle exec rake -T e2e
```

## Rollback về Development Environment

Sau khi set `$env:RAILS_ENV = "test"`, để rollback về development:

**Windows PowerShell:**
```powershell
# Cách 1: Set về development
$env:RAILS_ENV = "development"

# Cách 2: Unset (remove) environment variable
Remove-Item Env:RAILS_ENV

# Cách 3: Đóng PowerShell và mở lại (tự động về default)
```

**Linux/Mac:**
```bash
# Cách 1: Set về development
export RAILS_ENV=development

# Cách 2: Unset environment variable
unset RAILS_ENV

# Cách 3: Đóng terminal và mở lại
```

**Lưu ý:** 
- Environment variables chỉ tồn tại trong session hiện tại
- Khi đóng PowerShell/terminal, biến sẽ tự động reset
- Để tránh ảnh hưởng session, nên set trong cùng command

## Test Data

Sau khi setup, test database (`furni_care_test`) sẽ có:

- **Users**: 
  - `cs@demo.com` / `password` (CS role)
  - `tech@demo.com` / `password` (Technician role)
  - `leader@demo.com` / `password` (Leader role)
- **Clients**: ABC Furniture, XYZ Interior
- **Sites**: HCM Office, HN Branch, Da Nang Store
- **Contacts**: Nguyen Van A, Tran Thi B, Le Van C, Pham Thi D

## Lưu ý

- Test database (`furni_care_test`) tách biệt với development database (`furni_care_development`)
- E2E tests sẽ tự động chạy backend với `RAILS_ENV=test` khi chạy `npm run test:e2e` từ frontend directory
- Có thể reset database trước mỗi test run để đảm bảo data consistency

