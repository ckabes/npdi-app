require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/profiles', (req, res) => {
  res.json([
    {
      id: 'product-manager',
      name: 'Product Manager',
      role: 'PRODUCT_MANAGER',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@milliporesigma.com',
      sbu: 'P90'
    },
    {
      id: 'pm-ops',
      name: 'PM Operations',
      role: 'PM_OPS',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@milliporesigma.com',
      sbu: '775',
      userId: 'sarah-johnson-775' // Add unique ID for assignment logic
    },
    {
      id: 'admin',
      name: 'Administrator',
      role: 'ADMIN',
      firstName: 'Mike',
      lastName: 'Wilson',
      email: 'mike.wilson@milliporesigma.com',
      sbu: '440'
    }
  ]);
});

app.use('/api/products', productRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});