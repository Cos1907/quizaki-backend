const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('../routes/authRoutes');
const adminRoutes = require('../routes/adminRoutes');
const testRoutes = require('../routes/testRoutes');
const questionRoutes = require('../routes/questionRoutes');
const categoryRoutes = require('../routes/categoryRoutes');
const blogRoutes = require('../routes/blog');
const notificationRoutes = require('../routes/notifications');
const testResultRoutes = require('../routes/testResults');
const subscriptionRoutes = require('../routes/subscriptions');
const subscriptionPlanRoutes = require('../routes/subscriptionPlanRoutes');
const iqRankingsRoutes = require('../routes/iqRankings');
const campaignRoutes = require('../routes/campaignRoutes');
const pixelRoutes = require('../routes/pixelRoutes');
const pageRoutes = require('../routes/pageRoutes');
const adminActivityRoutes = require('../routes/adminActivityRoutes');
const { setupLogger } = require('../utils/logger');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const logger = setupLogger();

// Helmet for HTTP security headers
app.use(helmet());

// Rate limiter for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.'
});

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://panel.senin-domainin.com',
  'https://senin-domainin.com',
  'https://mobil.iqtestim.com',
  'https://panel.iqtestim.com',
  'https://iqtestim.com',
  'https://iqtestim-backend.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    try {
      new URL(origin);
    } catch (error) {
      return callback(null, false);
    }
    
    const isAllowed = allowedOrigins.some(allowed => origin === allowed);
    
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    if (!isAllowed) {
      return callback(null, false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set');
    }
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

connectDB();

// Routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/test-results', testResultRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/subscription-plans', subscriptionPlanRoutes);
app.use('/api/iq-rankings', iqRankingsRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/pixels', pixelRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/admin-activities', adminActivityRoutes);

// Basic routes
app.get('/', (req, res) => {
  res.json({
    message: 'API is running...',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage()
  };
  
  if (mongoose.connection.readyState !== 1) {
    health.status = 'ERROR';
    health.mongoError = 'MongoDB not connected';
  }
  
  res.json(health);
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn(`Route not found: ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
