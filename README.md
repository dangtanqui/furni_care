# FurniCare - Furniture Warranty Management System

Ứng dụng quản lý bảo hành, bảo trì ngành nội thất.

## 🛠️ Tech Stack

- **Backend**: Rails 7.1, Ruby 3.2.6, MySQL
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, React Query (TanStack Query)

## 📋 Prerequisites

- Ruby 3.2.6
- Node.js (latest LTS)
- MySQL
- Bundler
- npm hoặc yarn

## 🚀 Installation

### 1. Database Setup

Tạo file `.env` trong folder `backend`:

```env
DATABASE_PASSWORD=your_mysql_password
DATABASE_PORT=3306
JWT_SECRET=your_secret_key
CORS_ALLOWED_ORIGINS=[http://localhost:5173]

# Email Configuration (Optional - see Email Configuration section below)
# SMTP_USERNAME=your-email@gmail.com
# SMTP_PASSWORD=your-16-character-app-password
# MAILER_FROM=your-email@gmail.com
```

### 2. Backend Setup

```bash
cd backend
bundle install
rails db:create db:migrate db:seed
rails s -p 3000
```

Backend sẽ chạy tại `http://localhost:3000`

### 3. Frontend Setup

Tạo file `.env` trong folder `frontend`:

```env
VITE_API_URL=http://localhost:3000
```

Sau đó cài đặt và chạy:

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173` (hoặc port khác nếu 5173 đã được sử dụng)

### 4. Email Configuration (Optional)

Hệ thống có tính năng gửi email tự động cho khách hàng khi case hoàn thành Stage 4. Để sử dụng tính năng này, bạn cần cấu hình SMTP.

#### Setup Gmail App Password

1. **Bật 2-Step Verification**:
   - Vào [Google Account](https://myaccount.google.com/)
   - Chọn **Security** → **2-Step Verification**
   - Bật 2-Step Verification nếu chưa bật

2. **Tạo App Password**:
   - Vào **Security** → **2-Step Verification** → **App passwords**
   - Chọn "Mail" và "Other (Custom name)"
   - Đặt tên: "FurniCare" (hoặc tên khác)
   - Click **Generate**
   - Copy **16-character password** (không có spaces)

3. **Cấu hình trong `.env` của backend**:

Thêm các biến sau vào file `backend/.env`:

```env
# Email Configuration
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
MAILER_FROM=your-email@gmail.com

# Optional (defaults to Gmail settings)
SMTP_ADDRESS=smtp.gmail.com
SMTP_PORT=587
SMTP_DOMAIN=gmail.com
```

**Lưu ý**:
- `SMTP_USERNAME` và `MAILER_FROM` có thể dùng cùng một email
- `SMTP_PASSWORD` là App Password 16 ký tự (không phải mật khẩu Gmail thông thường)
- Để test, bạn có thể dùng email cá nhân (ví dụ: quidang9656@gmail.com)
- Khi deploy production, thay bằng email của chủ/doanh nghiệp

#### Testing Email

**Backend (Rails Console)**:
```ruby
# Trong rails console
case_record = Case.where(current_stage: 5).first
CaseMailer.execution_summary(case_record).deliver_now
```

**Frontend (UI)**:
- Tạo case → Complete Stage 1-4 → Complete Stage 4
- Email sẽ tự động gửi đến email của contact hoặc client (từ bảng `contacts`, cột `email`)

#### Email Template

Email sẽ bao gồm:
- **Header**: Case Number, Client, Site, Type, Status, Priority, Attempt Number
- **Stage 1**: Description, Contact Person
- **Stage 2**: Investigation Report, Investigation Checklist
- **Stage 3**: Root Cause, Solution Description, Planned Execution Date, Cost Information
- **Stage 4**: Execution Report, Execution Checklist, Client Feedback, Rating

## 👥 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| CS | cs@demo.com | password |
| Technician | tech@demo.com | password |
| Leader | leader@demo.com | password |

## 📱 Features

### Case Management

1. **Case List** - Danh sách case với filter và search
2. **Create Case** - Tạo case mới
3. **Case Detail** - Chi tiết case với 5 stages:
   - **Stage 1**: Input & Categorization
   - **Stage 2**: Site Investigation
   - **Stage 3**: Solution & Plan
   - **Stage 4**: Execution
   - **Stage 5**: Closing

## 🔐 Roles & Permissions

- **CS (Customer Service)**: 
  - Tạo case mới
  - Assign technician
  - Đóng case
  
- **Technician**: 
  - Site investigation
  - Đề xuất solution
  - Thực hiện execution
  
- **Leader**: 
  - Approve/reject costs

## 📁 Project Structure

```
furni_care/
├── backend/                    # Rails API
│   ├── app/
│   │   ├── constants/          # Application constants
│   │   ├── controllers/        # API controllers
│   │   │   ├── api/            # API endpoints
│   │   │   └── concerns/       # Shared controller concerns
│   │   ├── exceptions/         # Custom exceptions
│   │   ├── jobs/               # Background jobs
│   │   ├── mailers/            # Email templates
│   │   ├── models/             # ActiveRecord models
│   │   ├── policies/           # Authorization policies
│   │   ├── serializers/        # JSON serializers
│   │   └── services/           # Business logic services
│   ├── config/                 # Rails configuration
│   ├── db/                      # Database migrations & seeds
│   ├── spec/                    # RSpec tests
│   └── swagger/                 # API documentation
│
├── frontend/                    # React App
│   ├── src/
│   │   ├── api/                 # API client & endpoints
│   │   ├── components/         # React components
│   │   │   ├── pages/           # Page-specific components
│   │   │   └── *.tsx            # Shared components
│   │   ├── constants/          # Application constants
│   │   ├── contexts/            # React contexts (Auth, Toast, etc.)
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── api/             # API hooks (React Query)
│   │   │   └── pages/           # Page-specific hooks
│   │   ├── lib/                 # Library configurations
│   │   ├── pages/               # Page components
│   │   ├── styles/              # CSS files
│   │   ├── types/               # TypeScript type definitions
│   │   └── utils/               # Utility functions
│   │       ├── validation.ts   # Form validation utilities
│   │       └── apiErrorHandler.ts  # Error handling utilities
│   ├── tests/                   # Unit tests (Vitest)
│   ├── e2e/                     # E2E tests (Playwright)
│   ├── .storybook/              # Storybook configuration
│   └── public/                  # Static assets
│
└── README.md
```

### Frontend Architecture

**Data Fetching:**
- **React Query (TanStack Query)**: Quản lý server state, caching, và data synchronization
- **API Hooks**: `useCases`, `useCase` - Custom hooks sử dụng React Query
- **API Client**: Axios với interceptors cho authentication và error handling

**State Management:**
- **React Context**: AuthContext, ToastContext, CaseDetailsContext
- **React Query**: Server state và caching
- **Local State**: useState, useReducer cho component-specific state

**Form Handling:**
- **Validation**: `useFormValidation` hook với validation utilities
- **Form State**: `useFormState` hook cho generic form management
- **Error Handling**: Centralized error handler với user-friendly messages

**Performance:**
- **Code Splitting**: Lazy loading routes
- **Memoization**: React.memo, useMemo, useCallback
- **Image Optimization**: Lazy loading cho images

## 🔧 Development

### Backend Commands

```bash
# Run migrations
rails db:migrate

# Seed database
rails db:seed

# Start server
rails s
```

### Frontend Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Start Storybook
npm run storybook

# Build Storybook for production
npm run build-storybook
```

## 🧪 Testing

### Backend Testing (RSpec)

1. Setup test database:
```bash
cd backend
rails db:test:prepare
```

2. Run tests:
```bash
# Run all tests
bundle exec rspec

# Run specific test file
bundle exec rspec spec/models/user_spec.rb

# Run with documentation format
bundle exec rspec --format documentation
```

**Test Structure:**
- `spec/models/` - Model tests
- `spec/services/` - Service tests
- `spec/controllers/` - Controller tests
- `spec/policies/` - Policy tests
- `spec/factories/` - Factory definitions for test data

### Frontend Testing

#### Unit Tests (Vitest)

Frontend uses Vitest for unit testing with React Testing Library.

```bash
cd frontend

# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

**Test Structure:**
- `tests/utils/` - Utility function tests (validation, error handling, etc.)
- `tests/components/` - Component tests
- `tests/hooks/` - Hook tests (useFormValidation, useLoadingState, etc.)
- `tests/api/` - API client tests
- `tests/contexts/` - Context tests

#### E2E Tests (Playwright)

Frontend uses Playwright for E2E tests. See `frontend/e2e/README.md` for detailed documentation.

**Setup Test Database:**

E2E tests sử dụng test database riêng (`furni_care_test`). Setup database trước khi chạy tests:

**Windows PowerShell:**
```powershell
cd backend
$env:RAILS_ENV = "test"
bundle exec rake e2e:setup
```

**Linux/Mac:**
```bash
cd backend
RAILS_ENV=test bundle exec rake e2e:setup
```

**Rake Tasks:**
- `rake e2e:setup` - Setup test database (drop, create, migrate, seed)
- `rake e2e:reset` - Reset test database (drop, create, migrate, seed)

**Lưu ý:** Các tasks này **bắt buộc** phải chạy với `RAILS_ENV=test` để đảm bảo an toàn.

**Test Data:**

Sau khi setup, test database sẽ có:
- **Users**: 
  - `cs@demo.com` / `password` (CS role)
  - `tech@demo.com` / `password` (Technician role)
  - `leader@demo.com` / `password` (Leader role)
- **Clients**: ABC Furniture, XYZ Interior
- **Sites**: HCM Office, HN Branch, Da Nang Store
- **Contacts**: Nguyen Van A, Tran Thi B, Le Van C, Pham Thi D

**Chạy Tests:**

```bash
cd frontend

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI (khuyến nghị cho development)
npm run test:e2e:ui

# Run with browser hiển thị (headed mode)
npm run test:e2e:headed

# Xem test report
npm run test:e2e:report
```

**Lưu ý:**
- Test database (`furni_care_test`) tách biệt với development database (`furni_care_development`)
- E2E tests sẽ tự động chạy backend với `RAILS_ENV=test` khi chạy `npm run test:e2e`
- Backend và Frontend servers sẽ tự động được khởi động bởi Playwright
- Có thể reset database trước mỗi test run để đảm bảo data consistency

## 📖 Storybook

Storybook là công cụ để phát triển và document UI components một cách độc lập.

### Khởi động Storybook

```bash
cd frontend
npm run storybook
```

Storybook sẽ chạy tại `http://localhost:6006`
