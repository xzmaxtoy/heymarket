import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initWebSocket } from './websocket/server.js';
import config from './config/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiSpec = yaml.load(readFileSync(join(__dirname, '..', 'api-docs.yaml'), 'utf8'));
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/error.js';
import messagesRouter from './routes/messages.js';
import batchRouter from './routes/batch.js';
import customersRouter from './routes/customers.js';
import templatesRouter from './routes/templates.js';

const app = express();

// Configure CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://your-production-domain.com' : 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Creator-Id',
    'X-Inbox-Id',
    'X-Request-Id'
  ],
  credentials: true
}));

// Basic security middleware with CSS, images, and external scripts enabled
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://esm.sh"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://zpwwsiljoyrfibillxzd.supabase.co"]
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Serve static files from public directory
app.use(express.static(join(__dirname, 'public')));

// Handle preflight requests
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import request logger
import { requestLogger } from './middleware/requestLogger.js';

// Apply request logger middleware
app.use(requestLogger);

// API Documentation - no auth required
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiSpec));

// Root route - no auth required
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running',
    documentation: '/api-docs'
  });
});

// Health check - no auth required
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public customer routes
app.use('/api/customers', customersRouter);

// Authentication middleware for protected API routes
app.use('/api/messages', authenticate, messagesRouter);
app.use('/api/batch', authenticate, batchRouter);
app.use('/api/templates', authenticate, templatesRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const port = process.env.PORT || process.env.WEBSITE_PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Process ID: ${process.pid}`);
});

// Initialize WebSocket server
initWebSocket(server);

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
