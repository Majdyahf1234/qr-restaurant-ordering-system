# Restaurant QR Ordering System

A production-ready restaurant ordering system with QR code-based ordering, real-time kitchen display, and comprehensive management tools.

## Features

### Public Website
- Restaurant information (name, address, hours, contact)
- Menu display with categories and items (no prices for public view)

### QR Code Ordering
- **Reception Dashboard**: Grid/list of tables with status (free/occupied)
- One-click QR code generation and printing
- Automatic deactivation of old QR codes when new ones are printed
- Session-based ordering with UUID tokens
- Real-time order status tracking

### Customer Experience
- Scan QR → loads ordering page with menu (prices visible)
- Add items with special instructions
- Submit orders directly to kitchen
- Track order status in real-time
- Request bill functionality

### Waiter Interface
- Mobile/tablet-friendly design
- View tables with active sessions
- Place orders on behalf of customers
- Update order status
- Request bill for tables

### Admin Panel
- **Menu Management**: CRUD categories and items
- **Table Management**: Add/edit/delete tables
- **Staff Management**: Accounts with roles (admin, reception, waiter, kitchen)
- **Order Management**: View all orders (active & historical)
- **Sales Reports**: Daily/weekly/monthly totals, breakdown by item/table/waiter
- **Settings**: QR expiry duration, tax rate, printer config

### Kitchen Display
- Real-time order display
- Mark items as preparing/ready
- Order grouping by table
- Visual timers for order age

## Tech Stack

### Backend
- **Node.js** with Express
- **PostgreSQL** database (Prisma ORM)
- **Redis** for caching and session management
- **Socket.io** for real-time updates
- **JWT** authentication
- **Swagger** API documentation

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Socket.io-client** for real-time updates
- **Vite** build tool

### Infrastructure
- **Docker** & Docker Compose for deployment
- **Nginx** reverse proxy
- Automated database backups

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd restaurant-qr-system
```

2. Copy the environment file:
```bash
cp .env.example .env
```

3. Edit `.env` with your configuration:
```env
DB_USER=restaurant
DB_PASSWORD=your_secure_password
DB_NAME=restaurant_db
JWT_SECRET=your_super_secret_key
```

4. Start with Docker Compose:
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
docker-compose exec backend npx prisma migrate dev
```

6. Seed the database:
```bash
docker-compose exec backend npm run db:seed
```

7. Access the application:
- Frontend: http://localhost
- API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@restaurant.com | admin123 |
| Reception | reception@restaurant.com | reception123 |
| Waiter | waiter@restaurant.com | waiter123 |
| Kitchen | kitchen@restaurant.com | kitchen123 |

## Development

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Database Migrations

```bash
# Create migration
docker-compose exec backend npx prisma migrate dev --name migration_name

# Deploy migration
docker-compose exec backend npx prisma migrate deploy

# Open Prisma Studio
docker-compose exec backend npx prisma studio
```

## API Documentation

The API documentation is available at `/api-docs` when the server is running.

### Main Endpoints

- `POST /api/auth/login` - User login
- `GET /api/menu/categories` - Get menu categories
- `GET /api/menu/items` - Get menu items
- `GET /api/tables` - Get all tables
- `POST /api/qr/generate/:tableId` - Generate QR code
- `POST /api/orders` - Create order
- `GET /api/orders/active` - Get active orders
- `GET /api/kitchen/orders` - Get kitchen orders
- `GET /api/admin/dashboard` - Get dashboard stats

## Project Structure

```
restaurant-qr-system/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, audit log
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utilities
│   │   └── websockets/     # Socket.io handlers
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── uploads/            # Uploaded images
├── frontend/
│   └── src/
│       ├── components/     # React components
│       ├── pages/          # Page components
│       ├── contexts/       # React contexts
│       ├── hooks/          # Custom hooks
│       ├── types/          # TypeScript types
│       └── utils/          # Utilities
├── database/
│   ├── init/               # Initialization scripts
│   └── backups/            # Backup files
├── docs/                   # Documentation
└── docker-compose.yml
```

## Security Features

- JWT authentication with role-based access control
- QR tokens (UUID v4) with automatic deactivation
- HTTPS enforcement in production
- Input validation and sanitization
- Rate limiting
- Audit logging for all changes

## Backup & Recovery

Automated daily backups are configured in Docker Compose. Backups are stored in `database/backups/`.

To manually create a backup:
```bash
docker-compose exec backup /backup.sh
```

To restore from a backup:
```bash
docker-compose exec postgres psql -U restaurant -d restaurant_db < backup_file.sql
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_USER` | PostgreSQL username | restaurant |
| `DB_PASSWORD` | PostgreSQL password | restaurant123 |
| `DB_NAME` | PostgreSQL database | restaurant_db |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiry time | 24h |
| `REDIS_HOST` | Redis host | redis |
| `REDIS_PORT` | Redis port | 6379 |
| `QR_EXPIRY_HOURS` | QR code expiry | 2 |
| `TAX_RATE` | Tax rate (decimal) | 0.10 |

## License

MIT License

## Support

For support, email support@restaurant.com or open an issue on GitHub.
