# Blood Stock Management API

A production-ready RESTful API for blood bank inventory and reservation management system with multi-database support.

## Features

- 🩸 **Blood Inventory Management**: Track blood units, expiry dates, and availability
- 📋 **Reservation System**: Manage blood reservations and dispensing
- 🔐 **JWT Authentication**: Secure authentication with refresh tokens
- 🗄️ **Multi-Database Support**: PostgreSQL, MySQL, SQLite, SQL Server
- 🚀 **Sequelize ORM**: Modern database abstraction with automatic migrations
- 📊 **RESTful API**: Clean REST endpoints with Express.js
- 🔒 **Production Ready**: Docker, PM2, health checks included

## Quick Start

### Environment Setup
```bash
cp .env.production.example .env
# Edit .env with your database credentials
```

### Database Setup
```bash
# Create PostgreSQL database
createdb blood_stock_production
```

### Installation & Run
```bash
npm install

# Setup database (create tables + seed data)
npm run setup

# Or run separately:
# npm run migrate  # Create tables
# npm run seed     # Add sample users

npm start
```

Server runs on `http://localhost:3002`

## API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/login      # User login
POST /api/auth/register   # User registration
POST /api/auth/refresh    # Refresh token
GET  /api/auth/check      # Verify token
```

### Blood Inventory
```
GET    /api/blood-inventory           # Get all blood units
POST   /api/blood-inventory           # Add new blood unit
GET    /api/blood-inventory/:id       # Get specific unit
PUT    /api/blood-inventory/:id       # Update unit
DELETE /api/blood-inventory/:id       # Remove unit
GET    /api/blood-inventory/stats     # Get inventory statistics
```

### Reservations
```
GET    /api/reservations              # Get all reservations
POST   /api/reservations              # Create reservation
GET    /api/reservations/:id          # Get specific reservation
PUT    /api/reservations/:id          # Update reservation
DELETE /api/reservations/:id          # Cancel reservation
POST   /api/reservations/:id/dispense # Dispense blood
```

## Database Models

### Blood Inventory
- Blood type (Whole blood, PRC, LPRC)
- Blood group (A, B, AB, O)
- RH factor (Positive, Negative)
- Bag number, expiry date
- Status tracking

### Reservations
- Patient information
- Required blood specifications
- Quantity and urgency
- Department and doctor details
- Status workflow (pending → approved → completed/cancelled)

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy with PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### Docker Deployment
```bash
docker build -t blood-stock-api .
docker run -p 3002:3002 --env-file .env blood-stock-api
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3002` |
| `DB_TYPE` | Database type | `postgresql` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | Required |
| `DB_USER` | Database user | Required |
| `DB_PASSWORD` | Database password | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | Token expiration | `24h` |

## Architecture

```
├── config/
│   └── database.js          # Multi-database configuration
├── controllers/
│   └── bloodInventoryController.js
├── middleware/
│   └── auth.js              # JWT authentication
├── models/
│   ├── index.js             # Model initialization
│   ├── BloodInventory.js    # Blood unit model
│   ├── BloodReservation.js  # Reservation model
│   └── ReservationBloodBags.js
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── bloodInventory.js    # Inventory routes
│   └── reservations.js      # Reservation routes
├── server.js                # Application entry point
├── package.json             # Dependencies & scripts
├── ecosystem.config.js      # PM2 configuration
├── Dockerfile               # Container configuration
└── DEPLOYMENT.md            # Deployment guide
```

## Security

- JWT token authentication
- Password hashing with bcrypt
- Environment variable configuration
- CORS protection
- Express security middleware
- Database connection pooling

## Monitoring

```bash
# PM2 monitoring
pm2 logs blood-stock-api
pm2 monit

# Health check endpoint
curl http://localhost:3002/api/health
```

## License

MIT License - see LICENSE file for details

## Support

For deployment issues, see [DEPLOYMENT.md](./DEPLOYMENT.md)
For API documentation, visit `/api/health` endpoint when server is running.