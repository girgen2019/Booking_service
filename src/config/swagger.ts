import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';


dotenv.config();

const PORT = process.env.SERVER_PORT || '3000';
const URL = `http://localhost:${PORT}`;

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Booking Service API',
            version: '1.0.0',
            description: 'API для управления книгами'
        },
        servers: [
            {
                url: URL,
                description: 'Development server'
            }
        ],
        components: {
            schemas: {
                Book: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        title: { type: 'string' },
                        author: { type: 'string' },
                        year: { type: 'integer' },
                        price: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' }
                    },
                    required: ['id', 'title', 'author', 'year']
                },
                Reservation: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        book_id: { type: 'integer' },
                        customer_name: { type: 'string' },
                        start_date: { type: 'string', format: 'date', example: '2026-12-01' },
                        end_date: { type: 'string', format: 'date', example: '2026-12-05' },
                        status: { type: 'string', enum: ['active', 'cancelled'] },
                        created_at: { type: 'string', format: 'date-time' }
                    },
                    required: ['id', 'book_id', 'customer_name', 'start_date', 'end_date', 'status']
                }
            }
        }
    },
    apis: ['./src/app.ts']
}
const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;