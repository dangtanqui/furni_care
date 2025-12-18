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

# Run tests
rails test

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

## 📝 Notes

- Đảm bảo MySQL đang chạy trước khi start backend
- Backend và Frontend cần chạy đồng thời để ứng dụng hoạt động đầy đủ
- File `.env` không được commit vào git (đã được ignore)
