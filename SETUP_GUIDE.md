# NPDI Portal Setup Guide

## Quick Start

Follow these steps to get the MilliporeSigma NPDI Portal running locally:

### 1. Prerequisites Installation

**Install Node.js (v16 or higher):**
- Download from https://nodejs.org/
- Verify installation: `node --version`

**Install MongoDB:**
- **macOS:** `brew install mongodb-community`
- **Windows:** Download from https://www.mongodb.com/try/download/community
- **Linux:** Follow MongoDB documentation for your distribution

**Start MongoDB:**
```bash
# macOS/Linux
sudo systemctl start mongod
# or
mongod

# Windows
net start MongoDB
```

### 2. Project Setup

**Clone and install:**
```bash
git clone <repository-url>
cd npdi-app

# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration

**Create environment file:**
```bash
cp .env.example .env
```

**Edit .env file with your settings:**
```bash
# Minimal configuration
MONGODB_URI=mongodb://localhost:27017/npdi-app
JWT_SECRET=your-super-secret-jwt-key-change-this
CLIENT_URL=http://localhost:5173
PORT=5000

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASS=your-app-password
```

### 4. Start the Application

**Development mode (recommended):**
```bash
npm run dev
```

This starts both the backend server (port 5000) and frontend client (port 5173).

**Or run separately:**
```bash
# Terminal 1: Backend
npm run server:dev

# Terminal 2: Frontend
cd client && npm run dev
```

### 5. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

### 6. Create Your First User

1. Navigate to http://localhost:5173/register
2. Fill out the registration form:
   - Choose **PM-OPS** role for admin access
   - Choose **Product Manager** role and select an SBU for regular access
3. Login with your new account

### 7. Test the Application

**Create a test ticket:**
1. Go to "New Ticket"
2. Fill out the form with sample data:
   - Product Name: "Test Chemical"
   - CAS Number: "64-17-5" (ethanol)
   - Add at least one SKU variant
3. Submit the ticket

**Test PM-OPS functions** (if you have PM-OPS role):
1. Go to "PM-OPS Dashboard"
2. Change the ticket status
3. Add comments

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB if not running
sudo systemctl start mongod
# or
mongod --dbpath /path/to/your/db
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process (replace PID)
kill -9 <PID>
```

### SMTP/Email Issues
Email notifications are optional. If you see SMTP errors:
1. Check your email credentials
2. Enable "App Passwords" for Gmail
3. Or comment out SMTP variables in .env to disable emails

### Module Not Found Errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Also for client
cd client
rm -rf node_modules package-lock.json
npm install
```

## Production Deployment

For production deployment, consider:

1. **Security:**
   - Use strong JWT secrets
   - Enable HTTPS
   - Configure CORS properly
   - Set up firewall rules

2. **Database:**
   - Use MongoDB Atlas or dedicated server
   - Configure backups
   - Set up monitoring

3. **Server:**
   - Use PM2 or similar process manager
   - Set up reverse proxy (nginx)
   - Configure logging
   - Set up monitoring

4. **Environment:**
   - Set `NODE_ENV=production`
   - Use secure environment variable management
   - Configure proper error handling

## Sample Data

For testing, you can use these sample values:

**Test Chemical Properties:**
- CAS Number: 64-17-5 (Ethanol)
- Molecular Formula: C2H6O
- Molecular Weight: 46.07
- Physical State: Liquid

**Test SKU:**
- Type: PREPACK
- SKU: TEST-001
- Package Size: 100 mL
- Price: $25.00

## Getting Help

If you encounter issues:
1. Check the console for error messages
2. Verify all services are running
3. Check the troubleshooting section
4. Review the main README.md for detailed information
5. Check MongoDB and application logs

## Next Steps

Once the application is running:
1. Explore the different user roles
2. Create sample tickets
3. Test the workflow from creation to completion
4. Configure email notifications
5. Customize the application for your specific needs