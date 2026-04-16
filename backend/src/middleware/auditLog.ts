import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { logger } from '../utils/logger';

interface AuditLogOptions {
  action: string;
  entityType: string;
  getEntityId?: (req: Request) => string | undefined;
}

export const auditLog = (options: AuditLogOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    
    let responseBody: any;
    
    res.json = function(body: any) {
      responseBody = body;
      return originalJson(body);
    };
    
    res.send = function(body: any) {
      responseBody = body;
      return originalSend(body);
    };

    res.on('finish', async () => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const entityId = options.getEntityId ? options.getEntityId(req) : req.params.id;
          
          await prisma.auditLog.create({
            data: {
              userId: req.user?.userId,
              action: options.action,
              entityType: options.entityType,
              entityId,
              oldValue: req.body.id ? undefined : undefined,
              newValue: responseBody,
              ipAddress: req.ip,
              userAgent: req.get('user-agent')
            }
          });
        }
      } catch (error) {
        logger.error('Failed to create audit log:', error);
      }
    });

    next();
  };
};

export const createAuditLog = async (
  userId: string | undefined,
  action: string,
  entityType: string,
  entityId?: string,
  oldValue?: any,
  newValue?: any,
  req?: Request
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : undefined,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
        ipAddress: req?.ip,
        userAgent: req?.get('user-agent')
      }
    });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }
};
