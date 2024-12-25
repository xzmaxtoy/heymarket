import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config/config.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/error.js';
import messagesRouter from './routes/messages.js';
import batchRouter from './routes/batch.js';

const app = express();

// Basic security middleware
app.use(helmet());

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// Root route - no auth required
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Health check - no auth required
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication middleware only for API routes
app.use('/api', authenticate);

// API routes
app.use('/api/messages', messagesRouter);
app.use('/api/batch', batchRouter);

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

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
