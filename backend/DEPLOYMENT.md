# Blood Stock Management API - Deployment Guide

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+ (or MySQL 8+, SQLite, SQL Server)
- PM2 (for production process management)

## Environment Setup

1. **Copy environment file:**
   ```bash
   cp .env.production.example .env
   ```

2. **Update environment variables in `.env`:**
   - Database connection details
   - Strong JWT secret
   - Production domain/CORS settings

## Database Setup

### PostgreSQL (Recommended)
```sql
-- Create database
CREATE DATABASE blood_stock_production;

-- Create user
CREATE USER blood_stock_user WITH PASSWORD 'your_strong_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE blood_stock_production TO blood_stock_user;
```

### Database Migration & Seeding
```bash
# Run database migration (create tables)
npm run migrate

# Seed initial data (admin user, sample data)
npm run seed

# Or run both at once
npm run setup
```

### Auto Schema Creation
The application will automatically create tables on first run using Sequelize models, but for production deployment, it's recommended to run manual migration first.

## Installation

```bash
# Install dependencies
npm install --production

# Setup database (migrate + seed)
npm run setup

# Start application
npm start
```

## Production Deployment

### Using PM2 (Recommended)

1. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Start with PM2:**
   ```bash
   pm2 start server.js --name "blood-stock-api"
   ```

3. **Configure auto-start:**
   ```bash
   pm2 startup
   pm2 save
   ```

### Using Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3002

USER node

CMD ["npm", "start"]
```

## API Endpoints

- **Health Check:** `GET /api/health`
- **Authentication:** `POST /api/auth/login`, `POST /api/auth/register`
- **Blood Inventory:** `GET /api/blood-inventory`
- **Reservations:** `GET /api/reservations`

## Security Considerations

1. **Environment Variables:**
   - Use strong JWT secrets
   - Secure database credentials
   - Enable database SSL in production

2. **CORS Configuration:**
   - Set `ALLOWED_ORIGINS` to your frontend domains only

3. **HTTPS:**
   - Always use HTTPS in production
   - Configure reverse proxy (nginx) for SSL termination

4. **Database:**
   - Use connection pooling
   - Enable SSL connections
   - Regular backups

## Monitoring

```bash
# View logs
pm2 logs blood-stock-api

# Monitor resources
pm2 monit

# Restart app
pm2 restart blood-stock-api
```

## Multi-Database Support

The application supports multiple databases:
- PostgreSQL (recommended)
- MySQL 
- SQLite (development only)
- SQL Server

Change `DB_TYPE` in `.env` file to switch database types.