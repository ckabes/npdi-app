require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

const productRoutes = require('./routes/products');
const formConfigRoutes = require('./routes/formConfig');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const permissionRoutes = require('./routes/permissions');
const systemSettingsRoutes = require('./routes/systemSettings');
const userPreferencesRoutes = require('./routes/userPreferences');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
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

// Get all active profiles for login page (development profiles from file)
app.get('/api/profiles', async (req, res) => {
  try {
    const profilesFile = path.join(__dirname, 'data/devProfiles.json');

    // Ensure data directory exists
    const dataDir = path.dirname(profilesFile);
    await fs.mkdir(dataDir, { recursive: true });

    // Check if file exists, create if not
    try {
      await fs.access(profilesFile);
    } catch {
      const defaultProfiles = [
        {
          id: 'product-manager',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@milliporesigma.com',
          role: 'PRODUCT_MANAGER',
          sbu: 'Life Science',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'pm-ops',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@milliporesigma.com',
          role: 'PM_OPS',
          sbu: 'Process Solutions',
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'admin',
          firstName: 'Mike',
          lastName: 'Wilson',
          email: 'mike.wilson@milliporesigma.com',
          role: 'ADMIN',
          sbu: 'Electronics',
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
      await fs.writeFile(profilesFile, JSON.stringify(defaultProfiles, null, 2), 'utf8');
    }

    const data = await fs.readFile(profilesFile, 'utf8');
    const profiles = JSON.parse(data);

    // Filter only active profiles and format for login page
    const activeProfiles = profiles
      .filter(profile => profile.isActive)
      .map(profile => ({
        id: profile.id,
        name: `${profile.firstName} ${profile.lastName}`,
        role: profile.role,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        sbu: profile.sbu,
        userId: profile.id
      }));

    res.json(activeProfiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    // Fallback to empty array in case of error
    res.json([]);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/form-config', formConfigRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/system-settings', systemSettingsRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);

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