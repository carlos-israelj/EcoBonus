import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './config/logger.js';
import pool from './config/database.js';
import supabase, { testSupabaseConnection } from './config/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'EcoBonus API',
    version: '1.0.0',
    description: 'Backend API for EcoBonus Clean-to-Earn platform on Stellar',
    docs: '/api/health',
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

// Database connection test (PostgreSQL - legacy)
async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info('PostgreSQL (legacy) connected:', result.rows[0]);
  } catch (error) {
    logger.warn('PostgreSQL connection failed (optional):', error.message);
  }
}

// Start server
app.listen(PORT, async () => {
  logger.info(`EcoBonus API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Stellar Network: ${process.env.STELLAR_NETWORK || 'testnet'}`);

  // Test Supabase connection
  const supabaseConnected = await testSupabaseConnection();
  if (supabaseConnected) {
    logger.info('Using Supabase as primary database');
  } else {
    logger.warn('Supabase not configured, some features may be unavailable');
  }

  // Test legacy PostgreSQL (optional)
  await testDatabaseConnection();

  logger.info('Server ready to accept connections');
  logger.info('Auth methods: Privy (social) + Stellar (wallet)');
});

export default app;
