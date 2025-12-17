# FurniCare - Furniture Warranty Management System

Ứng dụng quản lý bảo hành, bảo trì ngành nội thất.

## Stack

- **Backend**: Rails 7.1, Ruby 3.2.6, MySQL
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS

## Cài đặt

### 1. Database

Tạo file `.env` trong folder `backend`:

```
DATABASE_PASSWORD=your_mysql_password
DATABASE_PORT=3306
JWT_SECRET=your_secret_key
```

### 2. Backend

```bash
cd backend
bundle install
rails db:create db:migrate db:seed
rails s -p 3000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| CS | cs@demo.com | password |
| Technician | tech@demo.com | password |
| Leader | leader@demo.com | password |

## Screens

1. **Case List** - Danh sách case với filter
2. **Create Case** - Tạo case mới (CS only)
3. **Case Detail** - Chi tiết case với 5 stages:
   - Stage 1: Input & Categorization
   - Stage 2: Site Investigation
   - Stage 3: Solution & Plan (cost approval)
   - Stage 4: Execution
   - Stage 5: Closing

## Roles & Permissions

- **CS**: Tạo case, assign technician, close case
- **Technician**: Investigation, solution, execution
- **Leader**: Approve/reject costs

