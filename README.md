# 🩸 Blood Stock Management Application

ระบบจัดการคลังเลือดแบบครบครัน พร้อม JWT Authentication

## 🚀 เทคโนโลยีที่ใช้

### Frontend
- **React 18** with TypeScript
- **Bootstrap 5** สำหรับ UI/UX
- **React Router** สำหรับ routing
- **Axios** สำหรับ API calls
- **JWT Token Management** พร้อม auto-refresh

### Backend
- **Node.js** with Express
- **PostgreSQL** database
- **JWT Authentication** พร้อม refresh token
- **bcryptjs** สำหรับ password hashing
- **CORS** configuration

## 📋 ความต้องการของระบบ

- Node.js 16+ 
- PostgreSQL 12+
- npm หรือ yarn

## 🔧 การติดตั้งและใช้งาน

### 1. Clone และติดตั้ง Dependencies

```bash
# ติดตั้ง dependencies ทุกตัว
npm run install-all
```

### 2. ตั้งค่า Database

1. สร้าง PostgreSQL database ชื่อ `blood_stock_db`
2. แก้ไขไฟล์ `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blood_stock_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_change_this_in_production
```

3. รัน database migration:

```bash
cd backend
npm run db:migrate
```

### 3. รันระบบ

#### รันแบบ Development (ทั้ง Frontend และ Backend พร้อมกัน)

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

#### รันแยกกัน

```bash
# Backend only
npm run dev:backend

# Frontend only  
npm run dev:frontend
```

## 📁 โครงสร้างโปรเจค

```
blood-stock-app/
├── backend/                 # Node.js Express API
│   ├── config/             # Database configuration
│   ├── middleware/         # JWT auth middleware
│   ├── routes/             # API routes
│   ├── scripts/            # Database migration scripts
│   └── server.js           # Main server file
├── frontend/               # React application
│   ├── public/             # Static files
│   └── src/
│       ├── components/     # React components
│       ├── context/        # React context (Auth)
│       └── services/       # API services
└── package.json           # Root package.json
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/logout` - ออกจากระบบ
- `POST /api/auth/refresh` - ขอ access token ใหม่
- `GET /api/auth/profile` - ดูข้อมูลผู้ใช้

### Health Check
- `GET /api/health` - ตรวจสอบสถานะ API

## 🎯 ฟีเจอร์ที่มี

### ✅ เสร็จแล้ว
- [x] JWT Authentication พร้อม refresh token
- [x] Login/Register system
- [x] Protected routes
- [x] Responsive UI ด้วย Bootstrap
- [x] PostgreSQL database setup
- [x] CORS configuration
- [x] Auto token refresh
- [x] Error handling

### 🚧 กำลังพัฒนา
- [ ] ระบบจัดการคลังเลือด
- [ ] การร้องขอเลือด
- [ ] จัดการข้อมูลผู้บริจาค
- [ ] Dashboard และรายงาน
- [ ] การแจ้งเตือน

## 🔨 การ Build สำหรับ Production

```bash
# Build frontend
npm run build

# รัน production server
npm start
```

## 🐛 การแก้ไขปัญหา

### Database Connection Error
1. ตรวจสอบว่า PostgreSQL ทำงานอยู่
2. ตรวจสอบ credentials ในไฟล์ `.env`
3. ตรวจสอบว่าได้สร้าง database แล้ว

### CORS Error
- ตรวจสอบ `FRONTEND_URL` ในไฟล์ `backend/.env`

### Token Issues
- ตรวจสอบ `JWT_SECRET` และ `JWT_REFRESH_SECRET`
- ลบ localStorage และ login ใหม่

## 👨‍💻 การพัฒนาต่อ

1. Fork repository
2. สร้าง feature branch
3. Commit changes
4. Push และสร้าง Pull Request

## 📞 การสนับสนุน

สำหรับปัญหาหรือข้อสงสัย กรุณาสร้าง Issue ในโปรเจคนี้

---

> 💡 **หมายเหตุ**: โปรเจคนี้เป็นระบบพื้นฐานสำหรับการจัดการคลังเลือด พร้อมที่จะขยายฟีเจอร์เพิ่มเติมได้ตามความต้องการ