import { PrismaClient, UserRole, TableStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: {
      email: 'admin@restaurant.com',
      password: adminPassword,
      name: 'Administrator',
      role: UserRole.ADMIN,
      isActive: true
    }
  });
  console.log('Created admin user:', admin.email);

  // Create reception user
  const receptionPassword = await bcrypt.hash('reception123', 10);
  const reception = await prisma.user.upsert({
    where: { email: 'reception@restaurant.com' },
    update: {},
    create: {
      email: 'reception@restaurant.com',
      password: receptionPassword,
      name: 'Reception Staff',
      role: UserRole.RECEPTION,
      isActive: true
    }
  });
  console.log('Created reception user:', reception.email);

  // Create waiter user
  const waiterPassword = await bcrypt.hash('waiter123', 10);
  const waiter = await prisma.user.upsert({
    where: { email: 'waiter@restaurant.com' },
    update: {},
    create: {
      email: 'waiter@restaurant.com',
      password: waiterPassword,
      name: 'Waiter Staff',
      role: UserRole.WAITER,
      isActive: true
    }
  });
  console.log('Created waiter user:', waiter.email);

  // Create kitchen user
  const kitchenPassword = await bcrypt.hash('kitchen123', 10);
  const kitchen = await prisma.user.upsert({
    where: { email: 'kitchen@restaurant.com' },
    update: {},
    create: {
      email: 'kitchen@restaurant.com',
      password: kitchenPassword,
      name: 'Kitchen Staff',
      role: UserRole.KITCHEN,
      isActive: true
    }
  });
  console.log('Created kitchen user:', kitchen.email);

  // Create sample tables
  const tables = [];
  for (let i = 1; i <= 10; i++) {
    const table = await prisma.table.upsert({
      where: { number: i },
      update: {},
      create: {
        number: i,
        name: `Table ${i}`,
        capacity: i <= 4 ? 2 : 4,
        status: TableStatus.FREE,
        isActive: true
      }
    });
    tables.push(table);
  }
  console.log(`Created ${tables.length} tables`);

  // Create sample categories
  const categories = [
    { name: 'Appetizers', description: 'Start your meal right', sortOrder: 1 },
    { name: 'Main Courses', description: 'Delicious main dishes', sortOrder: 2 },
    { name: 'Desserts', description: 'Sweet treats', sortOrder: 3 },
    { name: 'Beverages', description: 'Refreshing drinks', sortOrder: 4 }
  ];

    const createdCategories = [];
  for (const cat of categories) {
    let category = await prisma.category.findFirst({
      where: { name: cat.name }
    });

    if (!category) {
      category = await prisma.category.create({
        data: cat
      });
    }

    createdCategories.push(category);
  }
  console.log(`Created ${createdCategories.length} categories`);

  // Create sample menu items
  const menuItems = [
    // Appetizers
    { name: 'Caesar Salad', description: 'Fresh romaine lettuce with Caesar dressing', price: 8.99, categoryId: createdCategories[0].id },
    { name: 'Bruschetta', description: 'Grilled bread with tomato and basil', price: 7.99, categoryId: createdCategories[0].id },
    { name: 'Soup of the Day', description: 'Chef\'s special soup', price: 6.99, categoryId: createdCategories[0].id },
    
    // Main Courses
    { name: 'Grilled Salmon', description: 'Fresh salmon with seasonal vegetables', price: 22.99, categoryId: createdCategories[1].id },
    { name: 'Ribeye Steak', description: '12oz ribeye with mashed potatoes', price: 28.99, categoryId: createdCategories[1].id },
    { name: 'Chicken Parmesan', description: 'Breaded chicken with marinara and cheese', price: 18.99, categoryId: createdCategories[1].id },
    { name: 'Pasta Primavera', description: 'Fresh pasta with seasonal vegetables', price: 16.99, categoryId: createdCategories[1].id },
    
    // Desserts
    { name: 'Tiramisu', description: 'Classic Italian dessert', price: 8.99, categoryId: createdCategories[2].id },
    { name: 'Chocolate Cake', description: 'Rich chocolate layer cake', price: 7.99, categoryId: createdCategories[2].id },
    { name: 'Cheesecake', description: 'New York style cheesecake', price: 8.99, categoryId: createdCategories[2].id },
    
    // Beverages
    { name: 'House Wine', description: 'Red or white', price: 7.99, categoryId: createdCategories[3].id },
    { name: 'Craft Beer', description: 'Local craft selection', price: 6.99, categoryId: createdCategories[3].id },
    { name: 'Soft Drinks', description: 'Coke, Sprite, or Fanta', price: 2.99, categoryId: createdCategories[3].id },
    { name: 'Coffee', description: 'Fresh brewed coffee', price: 3.99, categoryId: createdCategories[3].id }
  ];

  const createdItems = [];
  for (let i = 0; i < menuItems.length; i++) {
    const item = menuItems[i];
    const menuItem = await prisma.menuItem.upsert({
      where: { 
        id: `menu-item-${i}` 
      },
      update: {},
      create: {
        ...item,
        isAvailable: true,
        isPublic: true,
        sortOrder: i
      }
    });
    createdItems.push(menuItem);
  }
  console.log(`Created ${createdItems.length} menu items`);

  // Create default settings
  const settings = [
    { key: 'qr_expiry_hours', value: '2', description: 'QR code expiry time in hours' },
    { key: 'tax_rate', value: '0.10', description: 'Tax rate as decimal' },
    { key: 'currency', value: 'USD', description: 'Currency code' },
    { key: 'printer_enabled', value: 'false', description: 'Enable thermal printer' },
    { key: 'printer_type', value: 'network', description: 'Printer type: network or usb' }
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting
    });
  }
  console.log(`Created ${settings.length} default settings`);

  // Create restaurant info
  await prisma.restaurantInfo.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: process.env.RESTAURANT_NAME || 'Your Restaurant',
      address: process.env.RESTAURANT_ADDRESS || '123 Main Street, City',
      phone: process.env.RESTAURANT_PHONE || '+1 234 567 8900',
      email: process.env.RESTAURANT_EMAIL || 'contact@restaurant.com',
      openingHours: {
        monday: '9:00 AM - 10:00 PM',
        tuesday: '9:00 AM - 10:00 PM',
        wednesday: '9:00 AM - 10:00 PM',
        thursday: '9:00 AM - 10:00 PM',
        friday: '9:00 AM - 11:00 PM',
        saturday: '9:00 AM - 11:00 PM',
        sunday: '10:00 AM - 9:00 PM'
      }
    }
  });
  console.log('Created restaurant info');

  console.log('\nSeed completed successfully!');
  console.log('\nDefault login credentials:');
  console.log('Admin: admin@restaurant.com / admin123');
  console.log('Reception: reception@restaurant.com / reception123');
  console.log('Waiter: waiter@restaurant.com / waiter123');
  console.log('Kitchen: kitchen@restaurant.com / kitchen123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
