import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../server';
import { logger } from '../utils/logger';

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const getSalesReport = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { from, to, groupBy = 'day' } = req.query;
    
    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);
    toDate.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate
        },
        status: { not: 'CANCELLED' }
      },
      select: {
        createdAt: true,
        totalAmount: true,
        taxAmount: true,
        status: true
      }
    });

    // Group data
    const groupedData: any = {};
    
    orders.forEach(order => {
      let key: string;
      const date = new Date(order.createdAt);
      
      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          orderCount: 0,
          totalAmount: 0,
          taxAmount: 0
        };
      }
      
      groupedData[key].orderCount++;
      groupedData[key].totalAmount += Number(order.totalAmount);
      groupedData[key].taxAmount += Number(order.taxAmount);
    });

    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
      totalTax: orders.reduce((sum, o) => sum + Number(o.taxAmount), 0),
      averageOrderValue: orders.length > 0 
        ? orders.reduce((sum, o) => sum + Number(o.totalAmount), 0) / orders.length 
        : 0
    };

    res.json({
      data: Object.values(groupedData).sort((a: any, b: any) => a.date.localeCompare(b.date)),
      summary,
      period: { from, to, groupBy }
    });
  } catch (error) {
    logger.error('Get sales report error:', error);
    res.status(500).json({ error: 'Failed to get sales report' });
  }
};

export const getItemReport = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { from, to } = req.query;
    
    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);
    toDate.setHours(23, 59, 59, 999);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: fromDate,
            lte: toDate
          },
          status: { not: 'CANCELLED' }
        }
      },
      include: {
        menuItem: {
          select: { id: true, name: true, category: { select: { name: true } } }
        }
      }
    });

    // Group by menu item
    const itemStats: any = {};
    
    orderItems.forEach(item => {
      const itemId = item.menuItemId;
      
      if (!itemStats[itemId]) {
        itemStats[itemId] = {
          itemId,
          name: item.menuItem.name,
          category: item.menuItem.category?.name,
          quantity: 0,
          revenue: 0
        };
      }
      
      itemStats[itemId].quantity += item.quantity;
      itemStats[itemId].revenue += Number(item.totalPrice);
    });

    const sortedItems = Object.values(itemStats)
      .sort((a: any, b: any) => b.revenue - a.revenue);

    const summary = {
      totalItems: orderItems.reduce((sum, i) => sum + i.quantity, 0),
      totalRevenue: orderItems.reduce((sum, i) => sum + Number(i.totalPrice), 0),
      uniqueItems: Object.keys(itemStats).length
    };

    res.json({
      data: sortedItems,
      summary,
      period: { from, to }
    });
  } catch (error) {
    logger.error('Get item report error:', error);
    res.status(500).json({ error: 'Failed to get item report' });
  }
};

export const getTableReport = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { from, to } = req.query;
    
    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);
    toDate.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate
        },
        status: { not: 'CANCELLED' }
      },
      include: {
        table: {
          select: { id: true, number: true, name: true }
        }
      }
    });

    // Group by table
    const tableStats: any = {};
    
    orders.forEach(order => {
      const tableId = order.tableId;
      
      if (!tableStats[tableId]) {
        tableStats[tableId] = {
          tableId,
          tableNumber: order.table.number,
          tableName: order.table.name,
          orderCount: 0,
          totalRevenue: 0,
          averageOrderValue: 0
        };
      }
      
      tableStats[tableId].orderCount++;
      tableStats[tableId].totalRevenue += Number(order.totalAmount);
    });

    // Calculate averages
    Object.values(tableStats).forEach((table: any) => {
      table.averageOrderValue = table.totalRevenue / table.orderCount;
    });

    const sortedTables = Object.values(tableStats)
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

    res.json({
      data: sortedTables,
      period: { from, to }
    });
  } catch (error) {
    logger.error('Get table report error:', error);
    res.status(500).json({ error: 'Failed to get table report' });
  }
};

export const getWaiterReport = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { from, to } = req.query;
    
    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);
    toDate.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate
        },
        status: { not: 'CANCELLED' },
        placedById: { not: null }
      },
      include: {
        placedBy: {
          select: { id: true, name: true }
        }
      }
    });

    // Group by waiter
    const waiterStats: any = {};
    
    orders.forEach(order => {
      const waiterId = order.placedById;
      if (!waiterId) return;
      
      if (!waiterStats[waiterId]) {
        waiterStats[waiterId] = {
          waiterId,
          waiterName: order.placedBy?.name,
          orderCount: 0,
          totalRevenue: 0,
          averageOrderValue: 0
        };
      }
      
      waiterStats[waiterId].orderCount++;
      waiterStats[waiterId].totalRevenue += Number(order.totalAmount);
    });

    // Calculate averages
    Object.values(waiterStats).forEach((waiter: any) => {
      waiter.averageOrderValue = waiter.totalRevenue / waiter.orderCount;
    });

    const sortedWaiters = Object.values(waiterStats)
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

    res.json({
      data: sortedWaiters,
      period: { from, to }
    });
  } catch (error) {
    logger.error('Get waiter report error:', error);
    res.status(500).json({ error: 'Failed to get waiter report' });
  }
};

export const exportReportCSV = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, from, to } = req.query;
    
    let data: any[] = [];
    let headers: string[] = [];
    let filename = '';

    if (type === 'sales') {
      const response = await getSalesReportData(from as string, to as string);
      data = response.data;
      headers = ['Date', 'Orders', 'Revenue', 'Tax'];
      filename = `sales-report-${from}-${to}.csv`;
    } else if (type === 'items') {
      const response = await getItemReportData(from as string, to as string);
      data = response.data;
      headers = ['Item', 'Category', 'Quantity', 'Revenue'];
      filename = `items-report-${from}-${to}.csv`;
    } else if (type === 'tables') {
      const response = await getTableReportData(from as string, to as string);
      data = response.data;
      headers = ['Table', 'Orders', 'Revenue', 'Average Order'];
      filename = `tables-report-${from}-${to}.csv`;
    } else if (type === 'waiters') {
      const response = await getWaiterReportData(from as string, to as string);
      data = response.data;
      headers = ['Waiter', 'Orders', 'Revenue', 'Average Order'];
      filename = `waiters-report-${from}-${to}.csv`;
    }

    // Generate CSV
    let csv = headers.join(',') + '\n';
    
    data.forEach((row: any) => {
      if (type === 'sales') {
        csv += `${row.date},${row.orderCount},${row.totalAmount.toFixed(2)},${row.taxAmount.toFixed(2)}\n`;
      } else if (type === 'items') {
        csv += `"${row.name}","${row.category || ''}",${row.quantity},${row.revenue.toFixed(2)}\n`;
      } else if (type === 'tables') {
        csv += `"Table ${row.tableNumber}",${row.orderCount},${row.totalRevenue.toFixed(2)},${row.averageOrderValue.toFixed(2)}\n`;
      } else if (type === 'waiters') {
        csv += `"${row.waiterName}",${row.orderCount},${row.totalRevenue.toFixed(2)},${row.averageOrderValue.toFixed(2)}\n`;
      }
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    logger.error('Export CSV error:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
};

export const exportReportPDF = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, from, to } = req.query;
    
    // For now, return JSON with PDF generation info
    // In production, you'd use a library like puppeteer or pdfkit
    res.json({
      message: 'PDF export would be generated here',
      type,
      from,
      to,
      note: 'Use a PDF generation library like puppeteer or pdfkit in production'
    });
  } catch (error) {
    logger.error('Export PDF error:', error);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
};

// Helper functions for data retrieval
async function getSalesReportData(from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: fromDate, lte: toDate },
      status: { not: 'CANCELLED' }
    },
    select: {
      createdAt: true,
      totalAmount: true,
      taxAmount: true
    }
  });

  const groupedData: any = {};
  
  orders.forEach(order => {
    const key = new Date(order.createdAt).toISOString().split('T')[0];
    
    if (!groupedData[key]) {
      groupedData[key] = { date: key, orderCount: 0, totalAmount: 0, taxAmount: 0 };
    }
    
    groupedData[key].orderCount++;
    groupedData[key].totalAmount += Number(order.totalAmount);
    groupedData[key].taxAmount += Number(order.taxAmount);
  });

  return { data: Object.values(groupedData) };
}

async function getItemReportData(from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: fromDate, lte: toDate },
        status: { not: 'CANCELLED' }
      }
    },
    include: {
      menuItem: {
        select: { name: true, category: { select: { name: true } } }
      }
    }
  });

  const itemStats: any = {};
  
  orderItems.forEach(item => {
    const itemId = item.menuItemId;
    
    if (!itemStats[itemId]) {
      itemStats[itemId] = {
        name: item.menuItem.name,
        category: item.menuItem.category?.name,
        quantity: 0,
        revenue: 0
      };
    }
    
    itemStats[itemId].quantity += item.quantity;
    itemStats[itemId].revenue += Number(item.totalPrice);
  });

  return { data: Object.values(itemStats) };
}

async function getTableReportData(from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: fromDate, lte: toDate },
      status: { not: 'CANCELLED' }
    },
    include: {
      table: { select: { number: true, name: true } }
    }
  });

  const tableStats: any = {};
  
  orders.forEach(order => {
    const tableId = order.tableId;
    
    if (!tableStats[tableId]) {
      tableStats[tableId] = {
        tableNumber: order.table.number,
        tableName: order.table.name,
        orderCount: 0,
        totalRevenue: 0
      };
    }
    
    tableStats[tableId].orderCount++;
    tableStats[tableId].totalRevenue += Number(order.totalAmount);
  });

  Object.values(tableStats).forEach((table: any) => {
    table.averageOrderValue = table.totalRevenue / table.orderCount;
  });

  return { data: Object.values(tableStats) };
}

async function getWaiterReportData(from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: fromDate, lte: toDate },
      status: { not: 'CANCELLED' },
      placedById: { not: null }
    },
    include: {
      placedBy: { select: { name: true } }
    }
  });

  const waiterStats: any = {};
  
  orders.forEach(order => {
    const waiterId = order.placedById;
    if (!waiterId) return;
    
    if (!waiterStats[waiterId]) {
      waiterStats[waiterId] = {
        waiterName: order.placedBy?.name,
        orderCount: 0,
        totalRevenue: 0
      };
    }
    
    waiterStats[waiterId].orderCount++;
    waiterStats[waiterId].totalRevenue += Number(order.totalAmount);
  });

  Object.values(waiterStats).forEach((waiter: any) => {
    waiter.averageOrderValue = waiter.totalRevenue / waiter.orderCount;
  });

  return { data: Object.values(waiterStats) };
}
