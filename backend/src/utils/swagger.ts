import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Restaurant QR Ordering System API',
      version: '1.0.0',
      description: 'API documentation for the Restaurant QR Ordering System',
      contact: {
        name: 'API Support',
        email: 'support@restaurant.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'RECEPTION', 'WAITER', 'KITCHEN'] },
            isActive: { type: 'boolean' }
          }
        },
        Table: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            number: { type: 'integer' },
            name: { type: 'string' },
            capacity: { type: 'integer' },
            status: { type: 'string', enum: ['FREE', 'OCCUPIED', 'RESERVED'] }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            sortOrder: { type: 'integer' }
          }
        },
        MenuItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            imageUrl: { type: 'string' },
            isAvailable: { type: 'boolean' },
            categoryId: { type: 'string' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            tableId: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'PAID', 'CANCELLED'] },
            totalAmount: { type: 'number' },
            items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } }
          }
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            menuItemId: { type: 'string' },
            quantity: { type: 'integer' },
            unitPrice: { type: 'number' },
            totalPrice: { type: 'number' },
            notes: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'] }
          }
        },
        QRSession: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            tableId: { type: 'string' },
            token: { type: 'string' },
            isActive: { type: 'boolean' },
            expiresAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerSpec, swaggerUi };
