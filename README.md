# MilliporeSigma NPDI Portal

A comprehensive New Product Development and Introduction (NPDI) application for managing chemical product development workflows at MilliporeSigma.

## Features

### Core Functionality
- **Product Ticket Management**: Create and manage development tickets for new chemical products
- **Multi-SKU Support**: Handle prepack, -CONF, -SPEC, and -VAR SKUs per product
- **Profile-Based Access**: Separate interfaces for Product Managers, PM-OPS team, and Administrators
- **Status Workflow**: DRAFT → SUBMITTED → IN_PROCESS → COMPLETED/CANCELED with audit trail
- **SBU Organization**: Tickets organized by Strategic Business Unit
- **Dynamic Form Configuration**: Customizable form fields with live preview editor

### Chemical Data Management
- **Chemical Properties**: CAS numbers, molecular formulas, physical states, purity ranges
- **Hazard Classification**: GHS classes, signal words, transport classifications, UN numbers
- **Storage Conditions**: Temperature, humidity, light, and atmosphere requirements
- **Regulatory Information**: FDA, EPA, REACH, TSCA compliance tracking
- **PubChem Integration**: Automatic chemical data population from CAS numbers

### Additional Features
- **Commenting System**: Collaborative discussions on tickets with user attribution
- **Dashboard Analytics**: Statistics on ticket volumes, cycle times, SBU breakdowns
- **REST API**: External application integration with API key authentication
- **User Preferences**: Customizable dashboard layouts and notification settings
- **System Settings**: Configurable security policies, integrations, and performance options

## Tech Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **Express Validator** for input validation
- **Helmet** and rate limiting for security
- **Axios** for external API integration (PubChem)
- **Compression** for response optimization

### Frontend
- **React 18** with modern hooks
- **React Router** for navigation
- **Tailwind CSS** with custom MilliporeSigma branding
- **React Hook Form** for form management
- **Axios** for API communication
- **React Hot Toast** for user notifications
- **Headless UI** for accessible components
- **Heroicons** for UI icons

## Project Structure

```
npdi-app/
├── server/                     # Backend API
│   ├── config/                # Database configuration
│   ├── controllers/           # Route handlers and business logic
│   │   ├── apiKeyController.js
│   │   ├── devProfileController.js
│   │   ├── productController.js
│   │   ├── systemSettingsController.js
│   │   ├── ticketApiController.js
│   │   └── userPreferencesController.js
│   ├── data/                  # Development data and profiles
│   ├── middleware/            # Authentication, validation, API auth
│   │   ├── apiAuth.js        # API key authentication
│   │   ├── auth.js           # Profile-based authentication
│   │   └── validators.js
│   ├── models/               # Database schemas (Mongoose)
│   │   ├── ApiKey.js
│   │   ├── FormConfiguration.js
│   │   ├── ProductTicket.js
│   │   ├── SystemSettings.js
│   │   ├── TicketTemplate.js
│   │   ├── User.js
│   │   └── UserPreferences.js
│   ├── routes/               # API endpoint definitions
│   │   ├── admin.js          # Admin panel routes
│   │   ├── formConfig.js     # Form configuration routes
│   │   ├── permissions.js    # Permission management routes
│   │   ├── products.js       # Product ticket routes
│   │   ├── systemSettings.js # System settings routes
│   │   ├── templates.js      # Template management routes
│   │   ├── ticketApi.js      # External API routes
│   │   ├── userPreferences.js # User preferences routes
│   │   └── users.js          # User/profile management routes
│   ├── scripts/              # Utility scripts
│   │   ├── generateApiKey.js
│   │   └── seedApiKey.js
│   ├── services/             # External service integrations
│   │   └── pubchemService.js
│   ├── utils/                # Helper utilities
│   │   └── enumCleaner.js
│   └── index.js              # Server entry point
├── client/                   # Frontend React app
│   ├── public/               # Static assets
│   └── src/
│       ├── components/       # Reusable UI components
│       │   ├── admin/       # Admin-specific components
│       │   └── forms/       # Form components
│       ├── pages/           # Page components
│       ├── services/        # API client services
│       ├── utils/           # Auth context, helpers
│       └── styles/          # CSS and styling
├── docs/                     # Project documentation
│   └── archive/             # Archived documentation
├── API_DOCUMENTATION.md      # API documentation
├── API_KEY_SETUP.md         # API key setup guide
├── FORM_CONFIGURATION_GUIDE.md
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

# API Keys (Optional - for external application integration)
# Generate using: node server/scripts/generateApiKey.js
# MASTER_API_KEY=your-master-api-key-here
```

## User Roles & Access

The application uses a profile-based authentication system:

### Product Manager
- Create and submit new product tickets
- View and edit their own tickets (in DRAFT/SUBMITTED status)
- Add comments and updates
- Access to personal dashboard
- Customizable user preferences

### PM-OPS Team
- View all tickets across all SBUs
- Change ticket status and workflow
- Assign tickets to team members
- Edit ticket details at any stage
- Access comprehensive analytics dashboard
- Manage ticket templates

### Administrator
- Full system access and configuration
- User management and role assignments
- API key management for external integrations
- Form configuration editor
- System settings management
- All PM-OPS permissions
- Access to admin dashboard

## API Endpoints

### Authentication & Profiles
- `GET /api/profiles` - Get available development profiles for selection

### Product Tickets (Web Interface)
- `POST /api/products` - Create new ticket
- `GET /api/products` - List tickets (with filtering)
- `GET /api/products/:id` - Get ticket details
- `PUT /api/products/:id` - Update ticket
- `PATCH /api/products/:id/status` - Update ticket status
- `POST /api/products/:id/comments` - Add comment
- `GET /api/products/dashboard/stats` - Dashboard statistics

### External API (API Key Authentication)
- `POST /api/v1/tickets` - Create ticket via API
- `GET /api/v1/tickets/:id` - Get ticket details via API
- `PUT /api/v1/tickets/:id` - Update ticket via API
- `GET /api/v1/tickets` - List tickets via API
- `POST /api/v1/tickets/:id/comments` - Add comment via API

### Admin Routes
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/api-keys` - List API keys
- `POST /api/admin/api-keys` - Generate new API key
- `DELETE /api/admin/api-keys/:id` - Revoke API key

### Form Configuration
- `GET /api/form-config` - Get current form configuration
- `PUT /api/form-config` - Update form configuration
- `POST /api/form-config/restore-default` - Restore default configuration

### System Settings
- `GET /api/system-settings` - Get system settings
- `PUT /api/system-settings` - Update system settings
- `POST /api/system-settings/test-pubchem` - Test PubChem connection

For detailed API documentation including request/response examples, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## External API Integration

The application provides a REST API for external systems to integrate with the NPDI platform.

### Setting Up API Access
1. Generate an API key using the admin dashboard or CLI:
   ```bash
   node server/scripts/generateApiKey.js
   ```
2. Store the API key securely in your external application
3. Include the API key in request headers:
   ```
   X-API-Key: your-api-key-here
   ```

### API Features
- Create and manage product tickets programmatically
- Retrieve ticket information and status
- Add comments and updates
- List tickets with filtering options
- Full CRUD operations on tickets

See [API_KEY_SETUP.md](./API_KEY_SETUP.md) for detailed setup instructions.

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
2. Configure production MongoDB database
3. Set secure JWT secret (strong, random value)
4. Generate API keys for external integrations
5. Set up reverse proxy (nginx/Apache)
6. Enable HTTPS with SSL certificates
7. Configure monitoring and logging
8. Set up automated database backups
9. Configure CORS for production domains

### Docker Support
Docker configuration can be added for containerized deployments. The application is designed to be containerizable with separate containers for:
- Node.js application server
- MongoDB database
- Nginx reverse proxy

## Security Features

- **Profile-Based Authentication**: Development profile selection system for testing
- **API Key Authentication**: Secure authentication for external API access
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Express Validator for request validation
- **CORS Configuration**: Controlled cross-origin resource sharing
- **Helmet Security Headers**: Enhanced HTTP security headers
- **NoSQL Injection Prevention**: Mongoose schema validation
- **XSS Protection**: Input sanitization and output encoding
- **Role-Based Access Control**: Granular permissions system by role
- **Activity Tracking**: User attribution for all ticket actions and comments

## Architecture Notes

### Authentication System
The application uses a **profile-based authentication** system for development and testing:
- User profiles stored in file-based JSON (`/server/data/devProfiles.json`)
- Profile data passed via request headers (`x-user-role`, `x-user-email`, etc.)
- Managed by `devProfileController.js` and `authenticateProfile` middleware
- Suitable for development; can be replaced with JWT/SSO for production

### Future Enhancements
The following features are planned for future implementation:
- **Archived Tickets View**: UI to view and manage archived tickets (backend route exists)
- **Document Management**: File upload system for SDSs, COAs, spec sheets (schema ready)
- **Email Notifications**: SMTP integration for ticket status updates
- **Advanced Analytics**: Deeper insights into ticket patterns and bottlenecks

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