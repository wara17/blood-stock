# 🚀 Quick Start Guide - Blood Stock Management App

## Prerequisites
- Docker และ Docker Compose
- Git

## การติดตั้งและรันแอปใน 5 ขั้นตอน

### 1. Clone โปรเจค
```bash
git clone <your-repo-url>
cd blood-stock-app
```

### 2. เตรียม Environment
```bash
# สำหรับ Windows PowerShell
cp .env.production.example .env.production

# สำหรับ Linux/Mac
cp .env.production.example .env.production
```

### 3. แก้ไขไฟล์ .env.production
เปิดไฟล์ `.env.production` แล้วแก้ไข:
```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=blood_stock_db
DB_USER=admin
DB_PASSWORD=SecurePassword123!

# JWT Secrets
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_REFRESH_SECRET=your_super_secret_refresh_key_minimum_32_characters

# Frontend URL
FRONTEND_URL=http://localhost
```

### 4. Deploy แอป

**Windows:**
```powershell
.\deploy.ps1 production
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh production
```

**หรือ Manual:**
```bash
docker-compose up -d --build
```

### 5. ตรวจสอบการทำงาน

**Windows:**
```powershell
.\test-deployment.ps1
```

**Linux/Mac:**
```bash
chmod +x test-deployment.sh
./test-deployment.sh
```

## 🎯 เข้าถึงแอป

- **Frontend:** http://localhost
- **Backend API:** http://localhost/api
- **Health Check:** http://localhost/api/health

## 📊 การตรวจสอบสถานะ

```bash
# ดูสถานะ containers
docker-compose ps

# ดู logs
docker-compose logs -f

# ตรวจสอบ resource usage
docker stats
```

## 🔧 คำสั่งที่มีประโยชน์

```bash
# หยุดแอป
docker-compose down

# เริ่มใหม่พร้อม rebuild
docker-compose up -d --build

# ดู logs ของ service เฉพาะ
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# เข้าไปใน container
docker-compose exec backend bash
docker-compose exec postgres psql -U admin -d blood_stock_db

# Backup database
docker-compose exec postgres pg_dump -U admin blood_stock_db > backup.sql

# Scale backend
docker-compose up -d --scale backend=2
```

## 🐛 แก้ไขปัญหาเบื้องต้น

### แอปไม่ตอบสนอง
```bash
# ตรวจสอบ containers
docker-compose ps

# รีสตาร์ท
docker-compose restart

# ดู error logs
docker-compose logs
```

### Database connection error
```bash
# ตรวจสอบ postgres container
docker-compose logs postgres

# ตรวจสอบ environment variables
docker-compose exec backend printenv | grep DB
```

### Frontend ไม่โหลด
```bash
# ตรวจสอบ frontend container
docker-compose logs frontend

# ตรวจสอบ nginx config
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
```

## 🛠️ Development Mode

```bash
# รัน development version พร้อม hot reload
docker-compose -f docker-compose.dev.yml up -d

# หรือใช้ script
.\deploy.ps1 development  # Windows
./deploy.sh development  # Linux/Mac
```

## 🔒 Production Tips

1. **เปลี่ยน default passwords** ใน .env.production
2. **ใส่ strong JWT secrets** (32+ characters)
3. **ตั้งค่า firewall** ปิด ports ที่ไม่จำเป็น
4. **ใช้ reverse proxy** สำหรับ SSL/HTTPS
5. **ตั้งค่า backup** database อัตโนมัติ

## 📞 หาความช่วยเหลือ

- ตรวจสอบ logs: `docker-compose logs`
- รัน health check: `.\test-deployment.ps1` หรือ `./test-deployment.sh`
- อ่าน README.md สำหรับข้อมูลเพิ่มเติม

---

🎉 **ยินดีด้วย!** แอป Blood Stock Management พร้อมใช้งานแล้ว!