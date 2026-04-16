# Administrator Manual

## Overview

As an administrator, you have full access to manage the restaurant system including menu, staff, tables, and settings.

## Login

1. Navigate to the login page
2. Enter your credentials:
   - Email: admin@restaurant.com
   - Password: admin123
3. Click "Sign In"

## Dashboard

The dashboard provides an overview of:
- Today's revenue
- Today's orders
- Active tables
- Top selling items
- Order status breakdown

## Menu Management

### Categories

1. Go to "Categories" section
2. Click "Add Category" to create new
3. Enter name and description
4. Set sort order (lower numbers appear first)
5. Save

To edit or delete:
- Click the edit icon next to a category
- Make changes and save
- Or click delete to remove (only if no items exist)

### Menu Items

1. Go to "Menu Items" section
2. Click "Add Item"
3. Fill in details:
   - Name
   - Description
   - Price
   - Category
   - Image (optional)
4. Set availability
5. Save

## Table Management

1. Go to "Tables" section
2. Click "Add Table"
3. Enter:
   - Table number (must be unique)
   - Name (optional)
   - Capacity
4. Save

To edit or delete tables, use the action buttons next to each table.

**Note**: Cannot delete tables with active orders.

## Staff Management

### Adding Staff

1. Go to "Staff" section
2. Click "Add Staff"
3. Enter:
   - Name
   - Email
   - Password (min 6 characters)
   - Role (Admin, Reception, Waiter, Kitchen)
4. Save

### Roles

- **Admin**: Full system access
- **Reception**: Table management, QR codes
- **Waiter**: Order management, table service
- **Kitchen**: Kitchen display only

### Deactivating Staff

1. Find the staff member
2. Toggle the "Active" switch
3. Inactive staff cannot log in

## Order Management

1. Go to "Orders" section
2. View all orders with filters:
   - Date range
   - Status
   - Table
3. Click on an order to view details
4. Update status if needed

## Reports

### Sales Reports

1. Go to "Reports" section
2. Select "Sales" tab
3. Choose date range
4. Group by day, week, or month
5. Export as CSV or PDF

### Item Reports

Shows sales by menu item:
1. Select "Items" tab
2. Choose date range
3. View top selling items

### Table Reports

Shows table usage:
1. Select "Tables" tab
2. Choose date range
3. View orders and revenue per table

### Waiter Reports

Shows waiter performance:
1. Select "Waiters" tab
2. Choose date range
3. View orders and revenue per waiter

## Settings

### QR Code Settings

1. Go to "Settings" section
2. Find "QR Expiry Hours"
3. Set the desired expiry time (default: 2 hours)

### Tax Rate

1. Find "Tax Rate" setting
2. Enter as decimal (e.g., 0.10 for 10%)

### Printer Settings

1. Find "Printer Enabled"
2. Set to true to enable thermal printer
3. Configure printer type and connection

## Restaurant Information

1. Go to "Settings" section
2. Update:
   - Restaurant name
   - Address
   - Phone
   - Email
   - Opening hours
   - Logo

## Audit Logs

View all system changes:
1. Go to "Settings" section
2. Click "Audit Logs"
3. Filter by:
   - User
   - Action type
   - Date range

## Backup & Recovery

### Manual Backup

```bash
docker-compose exec backup /backup.sh
```

Backups are stored in `database/backups/`

### Restore from Backup

```bash
docker-compose exec postgres psql -U restaurant -d restaurant_db < backup_file.sql
```

## System Maintenance

### Updating the System

1. Pull latest changes
2. Run migrations: `docker-compose exec backend npx prisma migrate deploy`
3. Restart services: `docker-compose restart`

### Checking Logs

```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# Database logs
docker-compose logs -f postgres
```

## Troubleshooting

### Database Connection Issues

1. Check if database container is running: `docker-compose ps`
2. Check logs: `docker-compose logs postgres`
3. Verify environment variables in `.env`

### API Not Responding

1. Check backend container status
2. Check logs for errors
3. Restart backend: `docker-compose restart backend`

### Frontend Not Loading

1. Check nginx configuration
2. Verify build completed successfully
3. Check browser console for errors
