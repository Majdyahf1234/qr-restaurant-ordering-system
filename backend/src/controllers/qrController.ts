import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { prisma, redis } from '../server';
import { logger } from '../utils/logger';
import { createAuditLog } from '../middleware/auditLog';
import { io } from '../server';

const QR_EXPIRY_HOURS = parseInt(process.env.QR_EXPIRY_HOURS || '2');

export const generateQRCode = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tableId } = req.params;

    // Verify table exists
    const table = await prisma.table.findUnique({
      where: { id: tableId }
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    if (!table.isActive) {
      return res.status(400).json({ error: 'Table is not active' });
    }

    // Deactivate any existing active QR sessions for this table
    const existingSessions = await prisma.qRSession.findMany({
      where: { 
        tableId,
        isActive: true
      }
    });

    if (existingSessions.length > 0) {
      await prisma.qRSession.updateMany({
        where: { 
          tableId,
          isActive: true
        },
        data: { 
          isActive: false,
          deactivatedAt: new Date(),
          deactivatedBy: req.user?.userId
        }
      });

      // Remove old tokens from Redis
      for (const session of existingSessions) {
        await redis.del(`qr:session:${session.token}`);
      }

      logger.info(`Deactivated ${existingSessions.length} existing QR sessions for table ${table.number}`);
    }

    // Generate new session token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + QR_EXPIRY_HOURS);

    // Create new QR session
    const session = await prisma.qRSession.create({
      data: {
        tableId,
        token,
        expiresAt,
        isActive: true
      }
    });

    // Store in Redis for quick validation
    await redis.setex(
      `qr:session:${token}`,
      QR_EXPIRY_HOURS * 3600,
      JSON.stringify({
        sessionId: session.id,
        tableId,
        tableNumber: table.number,
        expiresAt
      })
    );

    // Generate QR code
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const orderUrl = `${frontendUrl}/order?token=${token}`;
    
    const qrCodeDataUrl = await QRCode.toDataURL(orderUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Update table status to occupied
    await prisma.table.update({
      where: { id: tableId },
      data: { status: 'OCCUPIED' }
    });

    await redis.del('tables:all');
    await createAuditLog(req.user?.userId, 'GENERATE_QR', 'QRSession', session.id, undefined, { tableId, tableNumber: table.number }, req);

    // Notify clients about table status change
    io.emit('table:updated', { tableId, status: 'OCCUPIED' });

    res.json({
      qrCode: qrCodeDataUrl,
      token,
      session,
      orderUrl,
      table: {
        id: table.id,
        number: table.number,
        name: table.name
      }
    });
  } catch (error) {
    logger.error('Generate QR code error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};

export const validateQRSession = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.body;

    // Check Redis first
    const cached = await redis.get(`qr:session:${token}`);
    
    if (cached) {
      const sessionData = JSON.parse(cached);
      
      // Check if expired
      if (new Date(sessionData.expiresAt) < new Date()) {
        await redis.del(`qr:session:${token}`);
        return res.status(401).json({ error: 'QR session has expired' });
      }

      return res.json({
        valid: true,
        session: sessionData
      });
    }

    // Fallback to database
    const session = await prisma.qRSession.findUnique({
      where: { token },
      include: {
        table: {
          select: {
            id: true,
            number: true,
            name: true,
            capacity: true
          }
        }
      }
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid QR session' });
    }

    if (!session.isActive) {
      return res.status(401).json({ error: 'QR session has been deactivated' });
    }

    if (session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'QR session has expired' });
    }

    // Cache in Redis
    await redis.setex(
      `qr:session:${token}`,
      Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
      JSON.stringify({
        sessionId: session.id,
        tableId: session.tableId,
        tableNumber: session.table.number,
        expiresAt: session.expiresAt
      })
    );

    res.json({
      valid: true,
      session: {
        sessionId: session.id,
        tableId: session.tableId,
        tableNumber: session.table.number,
        tableName: session.table.name,
        expiresAt: session.expiresAt
      }
    });
  } catch (error) {
    logger.error('Validate QR session error:', error);
    res.status(500).json({ error: 'Failed to validate QR session' });
  }
};

export const getQRSessionInfo = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const session = await prisma.qRSession.findUnique({
      where: { token },
      include: {
        table: {
          select: {
            id: true,
            number: true,
            name: true
          }
        },
        orders: {
          where: {
            status: {
              notIn: ['PAID', 'CANCELLED']
            }
          },
          select: {
            id: true,
            status: true,
            totalAmount: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      id: session.id,
      tableId: session.tableId,
      tableNumber: session.table.number,
      tableName: session.table.name,
      isActive: session.isActive,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      activeOrders: session.orders
    });
  } catch (error) {
    logger.error('Get QR session info error:', error);
    res.status(500).json({ error: 'Failed to get session info' });
  }
};

export const printQRCode = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tableId } = req.params;

    // Generate QR code first
    const table = await prisma.table.findUnique({
      where: { id: tableId }
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Get or generate QR session
    let session = await prisma.qRSession.findFirst({
      where: { 
        tableId,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!session) {
      // Generate new session if none exists
      const token = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + QR_EXPIRY_HOURS);

      session = await prisma.qRSession.create({
        data: {
          tableId,
          token,
          expiresAt,
          isActive: true
        }
      });

      await redis.setex(
        `qr:session:${token}`,
        QR_EXPIRY_HOURS * 3600,
        JSON.stringify({
          sessionId: session.id,
          tableId,
          tableNumber: table.number,
          expiresAt
        })
      );

      await prisma.table.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' }
      });

      await redis.del('tables:all');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const orderUrl = `${frontendUrl}/order?token=${session.token}`;

    // Generate QR code for printing
    const qrCodeDataUrl = await QRCode.toDataURL(orderUrl, {
      width: 300,
      margin: 2
    });

    // Here you would integrate with ESC/POS printer
    // For now, return the QR code for browser printing
    const printData = {
      tableNumber: table.number,
      tableName: table.name,
      qrCode: qrCodeDataUrl,
      orderUrl,
      printedAt: new Date().toISOString(),
      expiresAt: session.expiresAt,
      note: `Table ${table.number} - Scan to order`
    };

    await createAuditLog(req.user?.userId, 'PRINT_QR', 'QRSession', session.id, undefined, { tableId, tableNumber: table.number }, req);

    res.json({
      success: true,
      printData
    });
  } catch (error) {
    logger.error('Print QR code error:', error);
    res.status(500).json({ error: 'Failed to print QR code' });
  }
};

export const deactivateQRSession = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId } = req.params;

    const session = await prisma.qRSession.findUnique({
      where: { id: sessionId },
      include: { table: true }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await prisma.qRSession.update({
      where: { id: sessionId },
      data: { 
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy: req.user?.userId
      }
    });

    await redis.del(`qr:session:${session.token}`);
    await createAuditLog(req.user?.userId, 'DEACTIVATE_QR', 'QRSession', sessionId, { isActive: true }, { isActive: false }, req);

    res.json({ message: 'QR session deactivated successfully' });
  } catch (error) {
    logger.error('Deactivate QR session error:', error);
    res.status(500).json({ error: 'Failed to deactivate QR session' });
  }
};
