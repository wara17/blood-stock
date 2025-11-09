# 🩸 Blood Stock Management System - Production Ready

ระบบจัดการคลังเลือดแบบครบครัน พร้อม JWT Authentication และ Docker Deployment

> 🚀 **Quick Start**: ต้องการเริ่มใช้งานเร็วๆ? ดู [QUICKSTART.md](./QUICKSTART.md)

## 🏗️ System Architecture

- **Frontend**: React.js with TypeScript + Bootstrap (Port 80)
- **Backend**: Node.js with Express + Sequelize ORM (Port 3002)  
- **Database**: PostgreSQL 15 with health checks (Port 5432)
- **Reverse Proxy**: Nginx with security headers
- **Container**: Multi-stage Docker builds with health checks

## 🚀 การ Deploy

### 🎯 Option 1: Production Deployment (แนะนำ)
```bash
# 1. Copy environment template
cp .env.production.example .env

# 2. Configure production settings
nano .env  # Edit database passwords, JWT secrets

# 3. Deploy with automated scripts
# Linux/Mac:
chmod +x deploy.sh && ./deploy.sh

# Windows PowerShell:
.\deploy.ps1

# Or deploy manually:
docker-compose up -d
```

### 🔧 Option 2: Development Mode  
```bash
# Start development with hot-reload
docker-compose -f docker-compose.dev.yml up -d

# URLs:
# Frontend: http://localhost:3000 (React dev server)
# Backend: http://localhost:3002 (Node.js with nodemon)
```

### 🔗 Production URLs
- **Application**: http://localhost (หรือ domain ของคุณ)
- **API**: http://localhost/api/
- **Health Check**: http://localhost/api/health

## 👥 Default Users (หลัง Deploy)

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| Admin | `admin` | `admin123` | ผู้ดูแลระบบ |
| Doctor | `doctor1` | `doctor123` | หมอ |  
| Nurse | `nurse1` | `nurse123` | พยาบาล |

## 📋 Environment Configuration

### Required Variables (.env)
```env
# Database (จำเป็น)
DB_PASSWORD=your_strong_password_here

# Security (จำเป็น)  
JWT_SECRET=your_32_character_jwt_secret_here

# Optional
DB_NAME=blood_stock_production
DB_USER=blood_stock_user
FRONTEND_PORT=80
```
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

## � การ Deploy

### วิธีที่ 1: Deploy แบบรวม (Recommended)
ใช้ Docker Compose เพื่อ deploy ทั้งฟรอนต์เอนด์และแบ็กเอนด์พร้อมฐานข้อมูล

#### ขั้นตอนการเตรียม Environment:
```bash
# 1. สร้างไฟล์ environment
cp .env.production.example .env.production

# 2. แก้ไขค่าใน .env.production
# - DB_HOST=postgres (ชื่อ service ใน Docker Compose)
# - DB_NAME=blood_stock_db
# - DB_USER=your_db_user
# - DB_PASSWORD=strong_password
# - JWT_SECRET=your_jwt_secret
# - JWT_REFRESH_SECRET=your_refresh_secret
```

#### Deploy อัตโนมัติ:

**สำหรับ Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh production
```

**สำหรับ Windows PowerShell:**
```powershell
.\deploy.ps1 production
```

#### Deploy แบบ Manual:
```bash
# 1. Build และ start services
docker-compose up -d --build

# 2. ตรวจสอบสถานะ
docker-compose ps

# 3. ดู logs
docker-compose logs -f

# 4. เข้าถึงแอป
# Frontend: http://localhost:80
# Backend API: http://localhost:80/api
```

### วิธีที่ 2: Deploy แยก Service

#### Backend เท่านั้น:
```bash
cd backend
docker build -t blood-stock-backend .
docker run -d -p 5000:5000 --name backend blood-stock-backend
```

#### Frontend เท่านั้น:
```bash
cd frontend
docker build -t blood-stock-frontend .
docker run -d -p 80:80 --name frontend blood-stock-frontend
```

### การจัดการ Database

#### การ Migrate และ Seed ข้อมูล:
```bash
# เข้าไปใน backend container
docker-compose exec backend bash

# รัน migration
npm run migrate

# Seed ข้อมูลเริ่มต้น
npm run seed
```

#### การ Backup Database:
```bash
# Backup
docker-compose exec postgres pg_dump -U your_db_user blood_stock_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U your_db_user blood_stock_db < backup.sql
```

### Development Mode
```bash
# ใช้ development compose file
docker-compose -f docker-compose.dev.yml up -d

# หรือใช้ script
.\deploy.ps1 development  # Windows
./deploy.sh development  # Linux/Mac
```

### การ Monitor และ Troubleshooting

#### ตรวจสอบ Health Status:
```bash
# ตรวจสอบ container ทั้งหมด
docker-compose ps

# ตรวจสอบ health check
docker-compose exec backend curl http://localhost:5000/health
```

#### ดู Logs:
```bash
# ดู logs ทั้งหมด
docker-compose logs

# ดู logs ของ service เฉพาะ
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# ดู logs แบบ real-time
docker-compose logs -f backend
```

#### การหยุดและเริ่มใหม่:
```bash
# หยุดทั้งหมด
docker-compose down

# หยุดและลบ volumes (ข้อมูลหาย!)
docker-compose down -v

# เริ่มใหม่พร้อม rebuild
docker-compose up -d --build
```

## �👨‍💻 การพัฒนาต่อ

1. Fork repository
2. สร้าง feature branch
3. Commit changes
4. Push และสร้าง Pull Request

## 📞 การสนับสนุน

สำหรับปัญหาหรือข้อสงสัย กรุณาสร้าง Issue ในโปรเจคนี้

---

> 💡 **หมายเหตุ**: โปรเจคนี้เป็นระบบพื้นฐานสำหรับการจัดการคลังเลือด พร้อมที่จะขยายฟีเจอร์เพิ่มเติมได้ตามความต้องการ