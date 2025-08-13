# MilliporeSigma NPDI Portal

A comprehensive New Product Development and Introduction (NPDI) application for managing chemical product development workflows at MilliporeSigma.

## Features

### Core Functionality
- **Product Ticket Management**: Create and manage development tickets for new chemical products
- **Multi-SKU Support**: Handle prepack, -CONF, -SPEC, and -VAR SKUs per product
- **Role-Based Access**: Separate interfaces for Product Managers and PM-OPS team
- **Status Workflow**: DRAFT → IN PROCESS → COMPLETED/CANCELED with audit trail
- **SBU Organization**: Tickets organized by Strategic Business Unit

### Chemical Data Management
- **Chemical Properties**: CAS numbers, molecular formulas, physical states, purity ranges
- **Hazard Classification**: GHS classes, signal words, transport classifications, UN numbers
- **Storage Conditions**: Temperature, humidity, light, and atmosphere requirements
- **Regulatory Information**: FDA, EPA, REACH, TSCA compliance tracking

### Additional Features
- **Business Justification**: Market analysis, competitive analysis, sales forecasts
- **Document Management**: Attach SDSs, COAs, spec sheets, regulatory documents
- **Commenting System**: Collaborative discussions on tickets
- **Email Notifications**: Automatic alerts for status changes and comments
- **Dashboard Analytics**: Statistics on ticket volumes, cycle times, SBU breakdowns
- **Audit Trail**: Complete history of all changes with user attribution

## Tech Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** authentication with bcrypt password hashing
- **Nodemailer** for email notifications
- **Express Validator** for input validation
- **Helmet** and rate limiting for security

### Frontend
- **React 18** with modern hooks
- **React Router** for navigation
- **Tailwind CSS** with custom MilliporeSigma branding
- **React Hook Form** for form management
- **Axios** for API communication
- **React Hot Toast** for notifications
- **Headless UI** for accessible components

## Project Structure

```
npdi-app/
├── server/                 # Backend API
│   ├── config/            # Database configuration
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Authentication & validation
│   ├── models/           # Database schemas
│   ├── routes/           # API endpoints
│   ├── utils/            # Utilities (notifications, etc.)
│   └── index.js          # Server entry point
├── client/               # Frontend React app
│   ├── public/           # Static assets
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Page components
│       ├── services/     # API client
│       ├── utils/        # Auth context, helpers
│       └── styles/       # CSS and styling
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd npdi-app
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   npm install

   # Install client dependencies
   cd client && npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Database Setup**
   - Ensure MongoDB is running locally or configure remote connection
   - The application will create the database automatically on first run

5. **Start the application**
   ```bash
   # Development mode (runs both server and client)
   npm run dev
   
   # Or run separately:
   npm run server:dev  # Backend only
   npm run client:dev  # Frontend only
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api
   - Health check: http://localhost:5000/api/health

## Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/npdi-app

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Email Notifications (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASS=your-email-password
```

## User Roles

### Product Manager
- Create new product tickets
- View and edit their own tickets
- Add comments and updates
- Limited to their assigned SBU

### PM-OPS Team
- View all tickets across SBUs
- Change ticket status
- Assign tickets to team members
- Access comprehensive dashboard

### Administrator
- Full system access
- User management capabilities
- System configuration
- All PM-OPS permissions

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Product Tickets
- `POST /api/products` - Create new ticket
- `GET /api/products` - List tickets (with filtering)
- `GET /api/products/:id` - Get ticket details
- `PUT /api/products/:id` - Update ticket
- `PATCH /api/products/:id/status` - Update ticket status
- `POST /api/products/:id/comments` - Add comment
- `GET /api/products/dashboard/stats` - Dashboard statistics

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

## Deployment

### Production Environment
1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Configure SMTP for email notifications
5. Set up reverse proxy (nginx)
6. Enable HTTPS
7. Configure monitoring and logging

### Docker Support (Future)
Docker configuration can be added for containerized deployments.

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- SQL injection prevention
- XSS protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with appropriate tests
4. Submit a pull request

## Support

For questions or issues:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed description

## License

Proprietary - MilliporeSigma Internal Use Only