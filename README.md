# MilliporeSigma NPDI Portal

A New Product Development and Introduction (NPDI) ticket initiation application for capturing product data and facilitating workflow between Product Managers and PMOps at MilliporeSigma.

## Features

### Core Functionality
- **Product Ticket Management**: Create and manage development tickets for new chemical products
- **Multi-SKU Support**: Handle prepack, -CONF, -SPEC, and -VAR SKUs per product
- **Profile-Based Access**: Separate interfaces for Product Managers, PM-OPS team, and Administrators
- **Status Workflow**: DRAFT → SUBMITTED → IN_PROCESS → NPDI_INITIATED → COMPLETED/CANCELED with audit trail
- **NPDI Integration**: Seamless transition to official NPDI system with ticket number synchronization
- **SBU Organization**: Tickets organized by Strategic Business Unit
- **Dynamic Form Configuration**: Database-driven form rendering with seed script management

### Chemical Data Management
- **Chemical Properties**: CAS numbers, molecular formulas, physical states, purity ranges
- **Molecular Structure Viewer**: Professional 2D structure rendering using RDKit-JS with interactive rotation controls
  - Client-side rendering for privacy (no external data transmission)
  - Proper zigzag patterns for sp3 carbon chains
  - Monochrome skeletal formula display following ACS 1996 standards
  - Interactive rotation with +/- buttons (5° increments) and direct degree input
  - Automatic coordinate generation for optimal molecular geometry
- **Quality Specifications Parser**: Natural language input for quality specs with automatic formatting and smart capitalization
- **Quality Tests Configuration**: Database-backed parser knowledge base (303 entries) manageable via admin UI - test attributes, methods, and default mappings
- **Hazard Classification**: GHS classes, signal words, transport classifications, UN numbers
- **Storage Conditions**: Temperature, humidity, light, and atmosphere requirements
- **Regulatory Information**: FDA, EPA, REACH, TSCA compliance tracking
- **PubChem Integration**: Automatic chemical data population from CAS numbers
- **SAP Data Integration**: Palantir SQL Query API v2 for MARA dataset queries
  - Intelligent multi-criteria search (CAS, part number, or product name)
  - Automatic search type detection with visual feedback
  - Pagination with "Load More" functionality (10 results at a time)
  - Case-insensitive prefix matching for product names
  - Filters to show only base -BULK SKUs (excludes variants)
- **Similar Products Search**: Find related products with the same CAS number from SAP MARA data
- **Weight Matrix Management**: Package size to weight conversion for SKU variants
- **Plant Codes & Business Lines**: Centralized management of plant codes, business lines, and product hierarchy
- **UNSPSC Classification**: United Nations Standard Products and Services Code tracking

### Additional Features
- **Commenting System**: Collaborative discussions on tickets with user attribution
- **Dashboard Analytics**: Statistics on ticket volumes, cycle times, SBU breakdowns
- **REST API**: External application integration with API key authentication
- **User Preferences**: Customizable dashboard layouts and notification settings
- **System Settings**: Configurable security policies, integrations, and performance options
- **Microsoft Teams Integration**: Webhook notifications for ticket status changes and events
- **AI Content Generation**: Azure OpenAI integration for automated product descriptions and marketing content
- **Data Export**: Excel export functionality for PDP Checklists and product information forms

## Tech Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **Express Validator** for input validation
- **Helmet** and rate limiting for security
- **Axios** for external API integration (PubChem, Palantir)
- **Apache Arrow** for binary data parsing from Palantir queries
- **Compression** for response optimization
- **Azure OpenAI** for AI-powered content generation

### Frontend
- **React 18** with modern hooks
- **React Router** for navigation
- **Tailwind CSS** with custom MilliporeSigma branding
- **React Hook Form** for form management
- **Axios** for API communication
- **React Hot Toast** for user notifications
- **Headless UI** for accessible components
- **Heroicons** for UI icons
- **RDKit-JS** for molecular structure rendering (via CDN)

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
│   │   ├── BusinessLine.js
│   │   ├── FormConfiguration.js
│   │   ├── ParserConfiguration.js
│   │   ├── PlantCode.js
│   │   ├── ProductHierarchy.js
│   │   ├── ProductTicket.js
│   │   ├── SystemSettings.js
│   │   ├── TicketTemplate.js
│   │   ├── User.js
│   │   ├── UserPreferences.js
│   │   └── WeightMatrix.js
│   ├── routes/               # API endpoint definitions
│   │   ├── admin.js          # Admin panel routes
│   │   ├── businessLines.js  # Business line management routes
│   │   ├── formConfig.js     # Form configuration routes
│   │   ├── parserConfig.js   # Parser knowledge base routes
│   │   ├── permissions.js    # Permission management routes
│   │   ├── plantCodes.js     # Plant code management routes
│   │   ├── productHierarchy.js # Product hierarchy routes
│   │   ├── products.js       # Product ticket routes
│   │   ├── systemSettings.js # System settings routes
│   │   ├── templates.js      # Template management routes
│   │   ├── ticketApi.js      # External API routes
│   │   ├── userPreferences.js # User preferences routes
│   │   ├── users.js          # User/profile management routes
│   │   └── weightMatrix.js   # Weight matrix management routes
│   ├── scripts/              # Utility scripts
│   │   ├── generateApiKey.js
│   │   ├── seedApiKey.js
│   │   ├── seedFormConfig.js
│   │   ├── seedParserConfig.js
│   │   ├── seedProductHierarchy.js
│   │   ├── testAzureOpenAI.js
│   │   └── testSAPConnectivity.js
│   ├── services/             # External service integrations
│   │   ├── pubchemService.js
│   │   ├── palantirService.js
│   │   ├── aiContentService.js
│   │   ├── azureOpenAIService.js
│   │   ├── teamsNotificationService.js
│   │   ├── pdpChecklistExportService.js
│   │   └── dataExportService.js
│   ├── utils/                # Helper utilities
│   │   ├── enumCleaner.js   # Enum validation and cleaning
│   │   ├── errorHandler.js  # Error handling utilities
│   │   └── encryption.js    # Data encryption utilities
│   └── index.js              # Server entry point
├── client/                   # Frontend React app
│   ├── public/               # Static assets
│   └── src/
│       ├── components/       # Reusable UI components
│       │   ├── admin/       # Admin-specific components
│       │   │   └── GenericCRUDManager.jsx  # Reusable CRUD component
│       │   ├── common/      # Shared UI components
│       │   │   ├── Badge.jsx           # Role/status badges
│       │   │   ├── LoadingSpinner.jsx  # Loading states
│       │   │   └── EmptyState.jsx      # Empty data states
│       │   ├── forms/       # Form components
│       │   └── MoleculeViewerRDKit.jsx  # Molecular structure viewer
│       ├── pages/           # Page components
│       ├── services/        # API client services
│       ├── utils/           # Utilities and helpers
│       │   ├── AuthContext.jsx      # Authentication context
│       │   ├── dateFormatters.js    # Date formatting utilities
│       │   ├── currencyUtils.js     # Currency formatting
│       │   ├── pricingCalculations.js  # Pricing logic
│       │   └── qualitySpecParser.js    # Quality spec parsing
│       └── styles/          # CSS and styling
├── docs/                     # Project documentation
│   ├── api/                 # API documentation
│   ├── architecture/        # System architecture docs
│   ├── integrations/        # Third-party integrations (Teams)
│   ├── guides/              # How-to guides
│   ├── security/            # Security assessments
│   ├── reports/             # Technical reports
│   ├── archive/             # Historical documentation
│   └── README.md            # Documentation index
└── README.md                # This file
```

## Documentation

**Comprehensive documentation is available in the [docs/](docs/) folder.**

**Quick Links:**
- [Documentation Index](docs/README.md) - Complete documentation guide
- [Setup Guide](docs/guides/SETUP_GUIDE.md) - Installation and configuration
- [API Documentation](docs/api/API_DOCUMENTATION.md) - REST API reference
- [Architecture](docs/architecture/ARCHITECTURE.md) - System design
- [Microsoft Teams Integration](docs/integrations/TEAMS_INTEGRATION.md) - Teams webhooks
- [AI Content Generation](docs/features/AI_CONTENT_GENERATION.md) - Azure OpenAI integration
- [Palantir SQL Query API Integration](docs/Palantir-SQL-Query-API-Integration-Guide.md) - SAP MARA data access
- [SAP MARA Field Mapping](docs/features/SAP-MARA-to-ProductTicket-Mapping.md) - MARA to ProductTicket schema mapping
- [Similar Products Search](docs/features/SIMILAR_PRODUCTS_SEARCH.md) - Find related products by CAS number
- [Recent Improvements - December 2025](docs/features/RECENT_IMPROVEMENTS_2025_12.md) - SAP search enhancements, currency support, and UX improvements
- [Recent Improvements - November 2025](docs/features/RECENT_IMPROVEMENTS_2025_11.md) - Previous enhancements and bug fixes

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
- `GET /api/products/cas-lookup/:casNumber` - PubChem CAS number lookup
- `GET /api/products/sap-search/:partNumber` - SAP MARA data search via Palantir
- `GET /api/products/similar-products/:casNumber` - Search for similar products by CAS number
- `POST /api/products/generate-corpbase-content` - AI content generation
- `GET /api/products/:id/export-pdp` - Export PDP Checklist (Excel)
- `GET /api/products/:id/export-pif` - Export Product Information Form (Excel)
- `GET /api/products/:id/export-data` - Export ticket data (Excel)

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

### Form Configuration (Read-Only)
- `GET /api/form-config/active` - Get active form configuration
- `GET /api/form-config/all` - Get all form configurations
- `GET /api/form-config/:id` - Get specific form configuration

**Note:** Form configurations are managed via seed scripts (`server/scripts/seedFormConfig.js`) for version control.

### System Settings
- `GET /api/system-settings` - Get system settings
- `PUT /api/system-settings` - Update system settings
- `POST /api/system-settings/test-pubchem` - Test PubChem connection
- `POST /api/system-settings/test-azure-openai` - Test Azure OpenAI connection

### Weight Matrix
- `GET /api/weight-matrix` - Get all weight matrix entries (paginated)
- `GET /api/weight-matrix/search` - Search weight matrix entries
- `GET /api/weight-matrix/lookup/:packageSize` - Lookup weight by package size
- `POST /api/weight-matrix` - Create weight matrix entry
- `PUT /api/weight-matrix/:id` - Update weight matrix entry
- `DELETE /api/weight-matrix/:id` - Delete weight matrix entry

For detailed API documentation including request/response examples, see [docs/api/API_DOCUMENTATION.md](docs/api/API_DOCUMENTATION.md).

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

See [docs/api/API_KEY_SETUP.md](docs/api/API_KEY_SETUP.md) for detailed setup instructions.

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
The application is designed to be containerizable with separate containers for Node.js application server, MongoDB database, and Nginx reverse proxy.

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
The application uses a **profile-based authentication** system:
- User profiles stored in file-based JSON (`/server/data/devProfiles.json`)
- Profile data passed via request headers (`x-user-role`, `x-user-email`, etc.)
- Managed by `devProfileController.js` and `authenticateProfile` middleware

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