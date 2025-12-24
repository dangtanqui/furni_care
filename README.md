# FurniCare - Furniture Warranty Management System

Ứng dụng quản lý bảo hành, bảo trì ngành nội thất.

## 🛠️ Tech Stack

- **Backend**: Rails 7.1, Ruby 3.2.6, MySQL
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS

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

Tạo file `.env` trong folder `frontend` (hoặc copy từ `.env.example`):

```env
VITE_API_URL=http://localhost:3000
```

**Lưu ý**: Nếu backend chạy ở port khác (ví dụ 3001), thay đổi giá trị:
```env
VITE_API_URL=http://localhost:3001
```

Sau đó cài đặt và chạy:

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173` (hoặc port khác nếu 5173 đã được sử dụng)

## 👥 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| CS | cs@demo.com | password |
| Technician | tech@demo.com | password |
| Leader | leader@demo.com | password |

## 📱 Features

### Case Management

1. **Case List** - Danh sách case với filter và search
2. **Create Case** - Tạo case mới (chỉ CS)
3. **Case Detail** - Chi tiết case với 5 stages:
   - **Stage 1**: Input & Categorization
   - **Stage 2**: Site Investigation
   - **Stage 3**: Solution & Plan (cost approval)
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
  - Quản lý tổng thể

## 📁 Project Structure

```
furni_care/
├── backend/          # Rails API
│   ├── app/
│   ├── config/
│   └── db/
├── frontend/         # React App
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── pages/
│   └── public/
└── README.md
```

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
- `src/utils/__tests__/` - Utility function tests
- `src/components/__tests__/` - Component tests
- `src/hooks/__tests__/` - Hook tests

#### E2E Tests (Playwright)

Frontend uses Playwright for E2E tests. See `frontend/e2e/README.md` for details.

```bash
cd frontend

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## 📚 API Documentation

Swagger/OpenAPI documentation is available at:
- Swagger UI: `http://localhost:3000/api-docs`
- Swagger JSON: `http://localhost:3000/api-docs/v1/swagger.json`

To update documentation, edit `backend/swagger/v1/swagger.yaml`.

## 📝 Notes

- Đảm bảo MySQL đang chạy trước khi start backend
- Backend và Frontend cần chạy đồng thời để ứng dụng hoạt động đầy đủ
- File `.env` không được commit vào git (đã được ignore)
- Nếu backend chạy ở port khác, nhớ cập nhật `VITE_API_URL` trong `frontend/.env`
