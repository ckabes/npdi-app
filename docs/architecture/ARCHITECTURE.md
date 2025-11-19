# NPDI Application Architecture Documentation

## Document Information

**Application:** MilliporeSigma NPDI Application
**Version:** 1.0.0
**Last Updated:** 2025-10-21
**Purpose:** Comprehensive architectural overview for stakeholders and technical teams

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Architectural Patterns](#3-architectural-patterns)
4. [Component Architecture](#4-component-architecture)
5. [Data Architecture](#5-data-architecture)
6. [Security Architecture](#6-security-architecture)
7. [Integration Architecture](#7-integration-architecture)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Maintainability & Scalability](#9-maintainability--scalability)

---

## 1. Executive Summary

The NPDI (New Product Data Introduction) Application is a full-stack web application designed to initiate and capture chemical product development tickets at MilliporeSigma. The system facilitates collaboration between Product Managers, Product Management Operations (PMOps) teams, and administrators for preparing product information prior to formal NPDI system submission.

### Key Architectural Characteristics

- **Architecture Pattern:** Model-View-Controller (MVC) with clear separation of concerns
- **Technology Stack:** MERN Stack (MongoDB, Express.js, React, Node.js)
- **Deployment Model:** Client-Server with REST API
- **Database:** MongoDB with Mongoose ODM
- **External Integrations:** PubChem API for chemical data enrichment
- **Security Model:** Multi-layered with API key authentication and role-based access control

---

## 2. System Overview

### 2.1 Business Context

The NPDI application facilitates the interface between Product Managers and Product Management Operations (PMOps) for initiating new chemical product development tickets. The system captures product data, manages ticket workflow, and prepares information for formal NPDI system submission. The system serves three primary user roles:

- **Product Managers:** Create and submit product tickets
- **PMOps Team:** Review, process, and assign SKUs to submitted tickets
- **Administrators:** Manage system configuration, users, and permissions

### 2.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│                    (React SPA - Port 5173)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Pages      │  │  Components  │  │  Services/Utils      │   │
│  │  - Dashboard │  │  - Forms     │  │  - API Client        │   │
│  │  - Tickets   │  │  - Admin     │  │  - Auth Context      │   │
│  │  - Admin     │  │  - Badges    │  │  - Calculations      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                         Server Layer                            │
│                  (Express.js API - Port 5000)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Routes     │  │ Controllers  │  │     Services         │   │ 
│  │  (Endpoints) │ →│  (Business   │ →│  - PubChem           │   │
│  │              │  │   Logic)     │  │  - Data Processing   │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│         ↕                 ↕                      ↕              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Middleware  │  │    Models    │  │      Utilities       │   │
│  │  - Auth      │  │  (Mongoose   │  │  - Enum Cleaner      │   │
│  │  - Security  │  │   Schemas)   │  │  - Validation        │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                 │
│                   MongoDB Database                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Collections:                                              │ │
│  │  - producttickets  - users         - permissions           │ │
│  │  - apikeys         - formconfigs   - systemsettings        │ │
│  │  - userpreferences - templates                             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                   External Integrations                         │
│              PubChem API (Chemical Data Enrichment)             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Technology Stack

#### Backend
- **Runtime:** Node.js v16+
- **Framework:** Express.js 4.18.2
- **Database:** MongoDB with Mongoose ODM 7.5.0
- **Security:** Helmet, CORS, express-rate-limit
- **Validation:** express-validator 7.0.1
- **HTTP Client:** Axios 1.11.0 (for PubChem integration)

#### Frontend
- **Framework:** React 18.2.0
- **Router:** React Router DOM 6.15.0
- **Build Tool:** Vite 4.4.5
- **HTTP Client:** Axios 1.5.0
- **Form Management:** React Hook Form 7.45.4
- **UI Components:** Headless UI, Heroicons
- **Styling:** Tailwind CSS 3.3.3
- **Notifications:** React Hot Toast 2.4.1

#### Development Tools
- **Process Manager:** Nodemon (server), Concurrently (parallel dev)
- **Linting:** ESLint 8.47.0
- **Configuration:** dotenv 16.3.1

---

## 3. Architectural Patterns

### 3.1 Model-View-Controller (MVC) Pattern

The NPDI application implements a strict MVC architecture, providing clear separation between data management, business logic, and presentation.

#### 3.1.1 Model Layer

**Location:** `server/models/`

The Model layer defines the data structure and business rules using Mongoose schemas.

**Key Models:**
- **ProductTicket** - Core entity representing a product introduction request
- **User** - User account information (currently profile-based)
- **Permission** - Role-based access control definitions
- **ApiKey** - External API authentication credentials
- **FormConfiguration** - Dynamic form field configurations
- **SystemSettings** - Application-wide configuration
- **UserPreferences** - User-specific settings
- **TicketTemplate** - Reusable ticket templates

**Responsibilities:**
- Define data schemas with strict type validation
- Implement business rules via Mongoose validators
- Manage data relationships and references
- Provide pre-save and post-save middleware hooks
- Enforce data integrity constraints

**Example: ProductTicket Schema**
```javascript
// server/models/ProductTicket.js
const productTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    required: false
  },
  chemicalProperties: {
    casNumber: {
      type: String,
      required: true,
      match: /^\d{1,7}-\d{2}-\d$/  // CAS format validation
    },
    // ... additional properties
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'IN_PROCESS', 'NPDI_INITIATED', 'COMPLETED', 'CANCELED'],
    default: 'DRAFT'
  },
  // ... additional fields
});

// Pre-save middleware for automatic ticket number generation
productTicketSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketNumber) {
    const count = await mongoose.model('ProductTicket').countDocuments();
    const year = new Date().getFullYear();
    this.ticketNumber = `NPDI-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});
```

#### 3.1.2 Controller Layer

**Location:** `server/controllers/`

Controllers contain business logic and orchestrate operations between routes, models, and services.

**Key Controllers:**
- **productController** - Ticket CRUD operations and workflow
- **userPreferencesController** - User settings management
- **systemSettingsController** - System configuration
- **adminController** - Administrative functions
- **apiKeyController** - API key lifecycle management
- **ticketApiController** - External API endpoints
- **devProfileController** - Development profile selection (development mode only)

**Note:** Permission management is handled directly in `server/routes/permissions.js` without a separate controller.

**Responsibilities:**
- Receive requests from routes
- Validate and sanitize input data
- Execute business logic
- Interact with models and services
- Format responses
- Handle errors gracefully

**Example: Create Ticket Flow**
```javascript
// server/controllers/productController.js
const createTicket = async (req, res) => {
  try {
    // 1. Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // 2. Sanitize and prepare data
    let ticketData = {
      ...req.body,
      createdBy: null // Profile-based auth
    };
    ticketData = ensureDefaultSBU(ticketData, 'P90');
    ticketData = ensureDefaultSKU(ticketData);
    ticketData = cleanTicketData(ticketData);

    // 3. Auto-populate from PubChem if CAS provided and not skipped
    if (ticketData.chemicalProperties?.casNumber && !ticketData.skipAutopopulate) {
      try {
        console.log('Auto-populating ticket data from PubChem...');
        const enrichedData = await pubchemService.enrichTicketData(
          ticketData.chemicalProperties.casNumber
        );
        // Merge PubChem data with provided data, giving priority to user input
        ticketData = { ...ticketData, ...enrichedData };
      } catch (pubchemError) {
        console.warn('PubChem enrichment failed, proceeding with user data:', pubchemError.message);
        // Continue with user-provided data only
      }
    }

    // 4. Create model instance
    const ticket = new ProductTicket(ticketData);

    // 5. Save to database
    await ticket.save();

    // 6. Return response
    res.status(201).json({
      message: 'Product ticket created successfully',
      ticket
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      message: 'Server error during ticket creation',
      error: error.message
    });
  }
};
```

#### 3.1.3 View Layer

**Location:** `client/src/`

The View layer is implemented as a React Single Page Application (SPA) with component-based architecture.

**Structure:**
- **Pages** (`client/src/pages/`) - Top-level route components
- **Components** (`client/src/components/`) - Reusable UI components
- **Forms** (`client/src/components/forms/`) - Form components
- **Admin** (`client/src/components/admin/`) - Administrative interfaces

**Responsibilities:**
- Render user interfaces
- Handle user interactions
- Manage local component state
- Make API calls to backend
- Display data and feedback to users

**Example: Component Hierarchy**
```
App.jsx
├── Layout.jsx
│   └── Navigation
├── Dashboard.jsx
│   ├── StatusBadge
│   ├── PriorityBadge
│   └── Activity Feed
├── CreateTicket.jsx
│   ├── DynamicFormRenderer
│   │   ├── DynamicBasicInfo
│   │   ├── ChemicalPropertiesForm
│   │   ├── SKUVariantsForm
│   │   └── CorpBaseDataForm
│   └── PricingCalculationForm
└── AdminDashboard.jsx
    ├── UserManagement
    ├── PermissionsManagement
    ├── FormConfigurationEditor
    └── ApiKeyManagement
```

### 3.2 Benefits of MVC Architecture

#### 3.2.1 Separation of Concerns

Each layer has distinct responsibilities, making the codebase easier to understand and maintain:

- **Models** handle data structure and integrity
- **Controllers** implement business logic
- **Views** manage user interaction and presentation

This separation allows developers to work on different layers independently without causing conflicts.

#### 3.2.2 Maintainability

**Code Organization:**
- Related functionality is grouped logically
- Easy to locate specific features (e.g., all ticket operations in `productController.js`)
- Consistent file structure across the application

**Example: Adding a New Feature**

To add a "ticket approval workflow":
1. **Model:** Add approval fields to `ProductTicket.js` schema
2. **Controller:** Add `approveTicket()` function to `productController.js`
3. **Route:** Add endpoint in `routes/products.js`
4. **View:** Create `ApprovalButton.jsx` component

Each change is isolated to its respective layer, minimizing code coupling.

#### 3.2.3 Testability

MVC enables comprehensive testing at each layer:

- **Model Tests:** Validate schema rules, defaults, and middleware
- **Controller Tests:** Mock models to test business logic
- **Integration Tests:** Test full request/response cycles
- **Component Tests:** Test UI rendering and user interactions

**Example Test Isolation:**
```javascript
// Testing controller logic without database
jest.mock('../models/ProductTicket');
const productController = require('../controllers/productController');

test('createTicket validates CAS number format', async () => {
  const req = { body: { chemicalProperties: { casNumber: 'invalid' } } };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

  await productController.createTicket(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});
```

#### 3.2.4 Scalability

MVC supports growth in multiple dimensions:

**Horizontal Scaling:**
- Stateless controllers enable multiple server instances
- Database operations through Mongoose are connection-pooled
- Frontend can be served from CDN

**Feature Scaling:**
- New models can be added without affecting existing ones
- Controllers can be split as they grow (e.g., separate `ticketWorkflowController` from `productController`)
- Components are reusable across different pages

**Team Scaling:**
- Frontend and backend teams can work in parallel
- Clear interfaces (API contracts) between layers
- Reduced merge conflicts due to organized file structure

#### 3.2.5 Flexibility

**Technology Independence:**
- Frontend can be replaced (React → Vue/Angular) without changing backend
- Database can be swapped (MongoDB → PostgreSQL) by updating models only
- Controllers remain stable across view/data changes

**Business Logic Centralization:**
- All ticket creation logic is in `createTicket()` controller
- Used by both web UI and external API endpoints
- Single source of truth for business rules

#### 3.2.6 Code Reusability

**Shared Components:**
- `DynamicFormSection` renders any configurable form
- `StatusBadge` used across Dashboard, TicketList, and TicketDetails
- `cleanTicketData()` utility used in create, update, and draft operations

**Shared Services:**
- `pubchemService` used by ticket creation and CAS lookup endpoints
- `apiAuth` middleware protects multiple routes
- `enumCleaner` utility standardizes data across operations

---

## 4. Component Architecture

### 4.1 Backend Components

#### 4.1.1 Server Entry Point

**File:** `server/index.js`

The main application entry point that:
- Initializes Express application
- Configures security middleware (Helmet, CORS, rate limiting)
- Sets up request parsing and compression
- Registers API routes
- Establishes MongoDB connection
- Implements error handling

**Middleware Stack Order:**
```javascript
1. helmet()                 // Security headers
2. compression()            // Response compression
3. cors()                   // Cross-origin resource sharing
4. rateLimit()              // API rate limiting
5. express.json()           // JSON body parsing
6. express.urlencoded()     // URL-encoded body parsing
7. Application routes       // API endpoints
8. 404 handler              // Not found responses
9. Error handler            // Global error handling
```

#### 4.1.2 Routes

**Location:** `server/routes/`

Routes define API endpoints and attach middleware/validation:

- **products.js** - Product ticket endpoints
- **formConfig.js** - Dynamic form configuration
- **users.js** - User management
- **permissions.js** - Permission management
- **systemSettings.js** - System configuration
- **userPreferences.js** - User preferences
- **templates.js** - Ticket templates
- **admin.js** - Administrative functions
- **ticketApi.js** - External API (v1)

**Example Route Definition:**
```javascript
// server/routes/products.js
router.post('/', [
  body('chemicalProperties.casNumber').matches(/^\d{1,7}-\d{2}-\d$/),
  body('productLine').notEmpty().trim(),
  // ... additional validation
], productController.createTicket);
```

#### 4.1.3 Middleware

**Location:** `server/middleware/`

**Authentication Middleware:**
- `auth.js` - Profile-based authentication for web UI
- `apiAuth.js` - API key authentication for external integrations

**Features:**
- Role extraction from request headers
- Permission validation
- SBU (Strategic Business Unit) access filtering
- API key validation with database lookup
- IP whitelist enforcement
- Usage tracking

#### 4.1.4 Services

**Location:** `server/services/`

Services encapsulate complex operations and external integrations:

**PubChem Service** (`pubchemService.js`):
- Fetches chemical compound data by CAS number
- Retrieves molecular properties, synonyms, and hazard information
- Parses physical properties (melting point, boiling point, etc.)
- Generates AI-based product descriptions
- Implements rate limiting (200ms delay between requests)
- Handles errors gracefully with fallback data

**Key Methods:**
- `getCompoundByCAS(casNumber)` - Primary lookup function
- `enrichTicketData(casNumber)` - Returns complete enriched data for tickets
- `parseGHSData(ghsData)` - Extracts GHS classification information
- `parsePhysicalProperties(data)` - Extracts experimental properties

**AI Content Service** (`aiContentService.js`):
- Generates marketing content using Azure OpenAI
- Template-based prompt generation
- Variable substitution for personalization
- Content type management (descriptions, titles, features)

**Langdock Service** (`langdockService.js`):
- Azure OpenAI API integration (Merck NLP endpoint)
- Environment-specific endpoint configuration
- Authentication and request handling
- Error handling with VPN troubleshooting

**Teams Notification Service** (`teamsNotificationService.js`):
- Sends formatted notifications to Microsoft Teams channels
- Adaptive Card generation
- Event-based notification triggers
- Webhook URL management

**PDP Checklist Export Service** (`pdpChecklistExportService.js`):
- Generates Excel files from ticket data
- Template-based export with data mapping
- Preserves formatting from template files
- Maps ticket fields to specific checklist rows

**Data Export Service** (`dataExportService.js`):
- General data export functionality
- Multiple format support (Excel, CSV, JSON)
- Filtered export capabilities
- Batch export operations

#### 4.1.5 Utilities

**Location:** `server/utils/`

**Enum Cleaner** (`enumCleaner.js`):
- Sanitizes empty string values from enum fields
- Ensures required fields have valid defaults
- Converts textarea strings to arrays
- Prevents Mongoose validation errors

**Functions:**
- `cleanTicketData(ticketData)` - Main cleaning function
- `cleanChemicalPropertiesEnums()` - Cleans chemical property fields
- `cleanSKUVariantsEnums()` - Ensures valid SKU variant data
- `ensureDefaultSBU()` - Sets default SBU if missing
- `ensureDefaultSKU()` - Creates default SKU variant

### 4.2 Frontend Components

#### 4.2.1 Application Structure

**Entry Point:** `client/src/main.jsx`
- Mounts React application
- Wraps app in Router and AuthContext providers

**Root Component:** `client/src/App.jsx`
- Defines application routes
- Manages authentication state
- Implements protected routes

#### 4.2.2 Pages

Top-level route components representing application views:

**Dashboard Pages:**
- `Dashboard.jsx` - Product Manager dashboard with tickets and activity
- `PMOPSDashboard.jsx` - PMOps team dashboard with queues and analytics
- `AdminDashboard.jsx` - Administrator control panel

**Ticket Pages:**
- `CreateTicket.jsx` - New ticket creation form
- `TicketDetails.jsx` - Individual ticket view/edit
- `TicketList.jsx` - Searchable ticket listing
- `TestCAS.jsx` - CAS number testing utility (development only)

**Administrative Pages:**
- `ProfileSelection.jsx` - User role selection (development mode)
- `UserPreferences.jsx` - User settings and preferences

#### 4.2.3 Reusable Components

**Forms** (`client/src/components/forms/`):
- `DynamicFormRenderer.jsx` - Renders forms based on configuration
- `DynamicFormSection.jsx` - Generic section renderer
- `DynamicBasicInfo.jsx` - Basic information section
- `DynamicCustomSections.jsx` - Custom dynamic sections
- `ChemicalPropertiesForm.jsx` - Chemical data input
- `SKUVariantsForm.jsx` - SKU management interface
- `CorpBaseDataForm.jsx` - Marketing/website content
- `PricingCalculationForm.jsx` - Automated pricing calculator
- `QualitySpecificationsForm.jsx` - Quality attributes

**Admin Components** (`client/src/components/admin/`):
- `UserManagement.jsx` - User CRUD operations
- `UserForm.jsx` - User creation/editing form
- `PermissionsManagement.jsx` - Role-based access control
- `FormConfigurationEditor.jsx` - Dynamic form builder
- `FormConfiguration.jsx` - Form configuration viewer
- `ApiKeyManagement.jsx` - API key lifecycle
- `SystemSettings.jsx` - Global configuration
- `TemplateManagement.jsx` - Ticket template editor
- `TemplateFormManagement.jsx` - Template form editor

**UI Components:**
- `StatusBadge.jsx` - Colored status indicators
- `PriorityBadge.jsx` - Priority level badges
- `Layout.jsx` - Application frame with navigation
- `Loading.jsx` - Loading state indicator
- `SKUAssignment.jsx` - SKU base number assignment widget

#### 4.2.4 Hooks and Context

**Custom Hooks** (`client/src/hooks/`):
- `useFormConfig.js` - Fetches and caches form configuration

**Context Providers** (`client/src/utils/`):
- `AuthContext.jsx` - Global authentication state management
  - Stores current profile (role, name, email, SBU)
  - Provides login/logout functions
  - Injects authentication headers into API requests

#### 4.2.5 Services and Utilities

**API Client** (`client/src/services/api.js`):
- Axios instance with base URL configuration
- Request interceptor for authentication headers
- Response interceptor for error handling
- Centralized API endpoint definitions

**Utilities:**
- `pricingCalculations.js` - Pricing formulas and calculations

---

## 5. Data Architecture

### 5.1 Database Design

The application uses MongoDB, a document-oriented NoSQL database, chosen for:
- Flexible schema supporting evolving product requirements
- Native JSON storage matching JavaScript objects
- Excellent performance for read-heavy dashboards
- Horizontal scalability for future growth

### 5.2 Core Collections

#### 5.2.1 ProductTickets Collection

**Purpose:** Stores all product introduction tickets

**Key Fields:**
- `ticketNumber` - Auto-generated unique identifier (NPDI-YYYY-####)
- `productName` - Chemical/product name
- `productLine` - Product category/line
- `sbu` - Strategic Business Unit (775, P90, 440, P87, P89, P85)
- `status` - Workflow state (DRAFT, SUBMITTED, IN_PROCESS, NPDI_INITIATED, COMPLETED, CANCELED)
- `priority` - Urgency level (LOW, MEDIUM, HIGH, URGENT)
- `chemicalProperties` - Embedded chemical data (CAS, formula, molecular weight, etc.)
- `hazardClassification` - GHS classification and safety data
- `skuVariants[]` - Array of SKU configurations with pricing
- `quality` - Quality attributes and MQ levels
- `composition` - Product composition breakdown
- `regulatoryInfo` - Regulatory compliance data
- `corpbaseData` - Marketing and web content
- `statusHistory[]` - Audit trail of all changes
- `comments[]` - User comments and notes
- `createdBy`, `assignedTo` - User references
- `createdAt`, `updatedAt` - Timestamps

**Indexes:**
- Unique index on `ticketNumber`
- Compound index on `status`, `sbu`, `priority` for dashboard queries
- Text index on `productName`, `ticketNumber` for search

#### 5.2.2 Users Collection

**Purpose:** User account data (currently minimal, using profile-based auth)

**Key Fields:**
- `firstName`, `lastName`, `email`
- `role` - User role (PRODUCT_MANAGER, PM_OPS, ADMIN)
- `sbu` - Business unit assignment
- `isActive` - Account status

#### 5.2.3 Permissions Collection

**Purpose:** Role-based access control definitions

**Key Fields:**
- `role` - Role identifier
- `privileges` - Object mapping sections to permissions (view/edit)
- `description` - Role description

**Example Document:**
```json
{
  "role": "PM_OPS",
  "privileges": {
    "basicInfo": { "view": true, "edit": true },
    "chemicalProperties": { "view": true, "edit": true },
    "skuVariants": { "view": true, "edit": true },
    "pricing": { "view": true, "edit": true }
  }
}
```

#### 5.2.4 ApiKeys Collection

**Purpose:** External API authentication and access control

**Key Fields:**
- `name` - Descriptive name for the key
- `keyHash` - SHA-256 hash of the API key
- `keyPrefix` - First 8 characters for identification
- `permissions[]` - Array of granted permissions (read, write, admin)
- `application` - Application/system using this key
- `ipWhitelist[]` - Allowed IP addresses
- `expiresAt` - Expiration timestamp
- `isActive` - Enable/disable flag
- `lastUsedAt` - Last usage timestamp
- `usageCount` - Total number of API calls

**Security Features:**
- Keys are hashed (SHA-256) before storage
- Only prefix shown in admin interface
- Automatic expiration checking
- IP-based access control
- Usage tracking and monitoring

#### 5.2.5 FormConfiguration Collection

**Purpose:** Dynamic form field configurations

**Key Fields:**
- `sections[]` - Array of form sections
  - `sectionId` - Unique section identifier
  - `title` - Display title
  - `order` - Display sequence
  - `fields[]` - Array of field definitions
    - `fieldId`, `label`, `type`, `required`, `visible`, `editable`
    - `options[]` - For dropdown/radio fields
    - `defaultValue` - Initial value

**Benefits:**
- Forms can be customized without code changes
- Field visibility controlled dynamically
- Supports rapid business process changes

#### 5.2.6 SystemSettings Collection

**Purpose:** Application-wide configuration

**Key Fields:**
- `smtpConfig` - Email server settings (future use)
- `pubchemApiConfig` - PubChem API configuration
  - `baseUrl` - API endpoint
  - `timeout` - Request timeout
  - `rateLimit` - Delay between requests
  - `enabled` - Feature toggle
- `applicationSettings` - General settings
  - `defaultSBU`, `defaultPriority`
  - `enableAutoNumbering`
  - `requireApproval`

#### 5.2.7 UserPreferences Collection

**Purpose:** User-specific settings and preferences

**Key Fields:**
- `userId` - User reference
- `theme` - UI theme preference
- `notifications` - Notification settings
- `dashboardLayout` - Dashboard customization
- `defaultFilters` - Saved filter preferences

#### 5.2.8 Templates Collection

**Purpose:** Reusable ticket templates

**Key Fields:**
- `name` - Template name
- `description` - Template description
- `category` - Template category
- `templateData` - Pre-filled ticket data
- `createdBy`, `isActive`

### 5.3 Data Relationships

**Referencing Strategy:**
- User references stored as ObjectIds
- Currently using header-based profile authentication

**Embedded Documents:**
- Chemical properties embedded in tickets (1-to-1 relationship)
- SKU variants array embedded in tickets (1-to-many, always accessed together)
- Status history embedded for audit trail (never queried independently)
- Comments embedded for performance (displayed with ticket)

**Design Rationale:**
- Embedding for data always accessed together (reduces joins)
- Referencing for data shared across documents (users, templates)
- Denormalization acceptable for read-optimized dashboards

### 5.4 Data Flow

#### 5.4.1 Ticket Creation Flow

```
1. User submits form data (React)
   ↓
2. API client sends POST /api/products with auth headers
   ↓
3. Express route validates input (express-validator)
   ↓
4. Controller sanitizes data (cleanTicketData utility)
   ↓
5. Controller calls PubChem service if CAS number provided
   ↓
6. PubChem service fetches external data
   ↓
7. Controller merges user input with PubChem data
   ↓
8. Controller creates ProductTicket model instance
   ↓
9. Mongoose pre-save middleware generates ticket number
   ↓
10. Mongoose validates schema and saves to MongoDB
   ↓
11. Controller returns response to client
   ↓
12. React updates UI and redirects to ticket details
```

#### 5.4.2 Dashboard Statistics Flow

```
1. Dashboard component mounts
   ↓
2. API call to GET /api/products/dashboard/stats
   ↓
3. Controller queries ProductTicket collection
   ↓
4. Aggregates tickets by status, priority, SBU
   ↓
5. Calculates average processing times from statusHistory
   ↓
6. Identifies aging tickets and urgent items
   ↓
7. Returns aggregated statistics
   ↓
8. Dashboard renders charts and metrics
```

#### 5.4.3 Form Configuration Flow

```
1. CreateTicket page loads
   ↓
2. useFormConfig hook checks localStorage cache
   ↓
3. If not cached, calls GET /api/form-config
   ↓
4. Controller retrieves FormConfiguration from database
   ↓
5. Returns configuration with sections and fields
   ↓
6. Hook caches config and returns to component
   ↓
7. DynamicFormRenderer builds form from config
   ↓
8. User interacts with dynamically generated form
```

---

## 6. Security Architecture

### 6.1 Multi-Layered Security Model

The NPDI application implements defense-in-depth security across multiple layers:

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: HTTP Security Headers (Helmet)                     │
│ - Content Security Policy, X-Frame-Options, etc.            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: CORS & Rate Limiting                               │
│ - Origin validation, Request throttling                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Authentication                                      │
│ - Profile-based (UI) or API Key (external)                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Authorization & Role-Based Access Control          │
│ - Permission checking, SBU filtering                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: Input Validation & Sanitization                    │
│ - express-validator, custom sanitization utilities          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 6: Schema Validation (Mongoose)                       │
│ - Type checking, enum validation, regex patterns            │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Authentication Mechanisms

#### 6.2.1 Profile-Based Authentication (Web UI)

**Mechanism:** Header-based profile selection for development/demo
**Implementation:** `server/middleware/auth.js`

**Process:**
1. User selects profile at login (stored in AuthContext)
2. React AuthContext injects headers into all requests:
   - `x-user-role` - User role
   - `x-user-firstname`, `x-user-lastname` - User name
   - `x-user-email` - User email
   - `x-user-sbu` - Business unit
3. Server middleware validates headers and creates `req.user` object
4. Downstream controllers use `req.user` for authorization

**Security Considerations:**
- Development mode only - not suitable for production
- Headers are not cryptographically signed
- Migration to JWT or session-based auth recommended

#### 6.2.2 API Key Authentication (External Access)

**Mechanism:** Database-backed API key validation
**Implementation:** `server/middleware/apiAuth.js`

**Process:**
1. External system includes API key in `X-API-Key` header
2. Middleware hashes the provided key (SHA-256)
3. Database lookup for matching `keyHash`
4. Validation checks:
   - Key exists in database
   - Key is active (`isActive: true`)
   - Key has not expired (`expiresAt > now`)
   - Client IP is whitelisted (if configured)
5. Record usage statistics (async, non-blocking)
6. Attach key metadata to `req.apiKey` for downstream use

**Security Features:**
- Keys are hashed before storage (original never stored)
- Automatic expiration enforcement
- IP whitelist support
- Usage tracking and auditing
- Granular permissions per key

### 6.3 Authorization & Access Control

#### 6.3.1 Role-Based Access Control (RBAC)

**Roles:**
- **PRODUCT_MANAGER** - Create and submit tickets for their SBU
- **PM_OPS** - View/edit all tickets, assign SKUs, manage workflow
- **ADMIN** - Full system access, manage users and configuration

**Permission Model:**
Each role has defined privileges for form sections:
```javascript
{
  "role": "PRODUCT_MANAGER",
  "privileges": {
    "basicInfo": { "view": true, "edit": true },
    "chemicalProperties": { "view": true, "edit": true },
    "skuVariants": { "view": true, "edit": false },  // Read-only
    "pricing": { "view": false, "edit": false }      // Hidden
  }
}
```

**Enforcement Points:**
- **Backend:** Middleware checks permissions before controller execution
- **Frontend:** UI elements hidden/disabled based on role
- **Database:** SBU filtering applied to queries for Product Managers

#### 6.3.2 SBU-Based Data Isolation

Product Managers can only access tickets from their assigned SBU:

```javascript
// server/middleware/auth.js
const checkSBUAccess = (req, res, next) => {
  if (req.user.role === 'PRODUCT_MANAGER') {
    req.sbuFilter = { sbu: req.user.sbu };  // Restricts queries
  } else {
    req.sbuFilter = {};  // PMOps and Admin see all
  }
  next();
};
```

Applied in controllers:
```javascript
const tickets = await ProductTicket.find({
  ...req.sbuFilter,  // Automatically filters by SBU
  status: 'SUBMITTED'
});
```

### 6.4 Input Validation & Sanitization

#### 6.4.1 Multi-Layer Validation

**Layer 1: Client-Side (React Hook Form)**
- Immediate user feedback
- Reduces unnecessary server requests
- Not trusted for security (can be bypassed)

**Layer 2: Route-Level (express-validator)**
```javascript
router.post('/', [
  body('chemicalProperties.casNumber').matches(/^\d{1,7}-\d{2}-\d$/),
  body('productLine').notEmpty().trim(),
  body('sbu').isIn(['775', 'P90', '440', 'P87', 'P89', 'P85'])
], productController.createTicket);
```

**Layer 3: Controller Sanitization**
```javascript
// server/utils/enumCleaner.js
const cleanTicketData = (ticketData) => {
  // Remove empty strings from enum fields
  // Convert textarea strings to arrays
  // Ensure required defaults exist
  return sanitizedData;
};
```

**Layer 4: Schema Validation (Mongoose)**
```javascript
casNumber: {
  type: String,
  required: true,
  match: /^\d{1,7}-\d{2}-\d$/  // Final validation before save
}
```

#### 6.4.2 XSS Prevention

**Automatic Escaping:**
- React automatically escapes all JSX content
- User input rendered as text, not HTML

**No Use of `dangerouslySetInnerHTML`:**
- Application never renders raw HTML from user input
- Markdown or rich text not supported (intentional security decision)

#### 6.4.3 NoSQL Injection Prevention

**Mongoose Query Builder:**
- All queries use parameterized format
- No string concatenation or eval
- User input treated as data, not code

**Example Safe Query:**
```javascript
// Safe - user input is parameter, not part of query structure
await ProductTicket.findOne({ ticketNumber: userInput });

// Unsafe (NOT used in application)
// await ProductTicket.find({ $where: `this.ticketNumber == '${userInput}'` });
```

### 6.5 HTTP Security Headers (Helmet)

Helmet middleware applies security headers to all responses:

```javascript
app.use(helmet());
```

**Headers Applied:**
- `X-DNS-Prefetch-Control: off` - Disable DNS prefetching
- `X-Frame-Options: SAMEORIGIN` - Prevent clickjacking
- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `X-XSS-Protection: 0` - Disable legacy XSS filter
- `Strict-Transport-Security` - Enforce HTTPS (production)
- `Content-Security-Policy` - Control resource loading

### 6.6 CORS Configuration

```javascript
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
  credentials: true
}));
```

**Purpose:**
- Restrict API access to authorized origins
- Prevent cross-site request forgery (CSRF)
- Allow cookies/credentials for same-origin requests

### 6.7 Rate Limiting

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minutes
  max: 100,                      // 100 requests per window
  message: 'Too many requests from this IP'
});
app.use('/api', limiter);
```

**Protection Against:**
- Brute force attacks
- API abuse
- Denial of Service (DoS)
- Automated scraping

### 6.8 Error Handling Security

**Production Error Responses:**
```javascript
app.use((error, req, res, next) => {
  console.error('Server error:', error);  // Log for debugging
  res.status(500).json({
    message: 'Internal server error',
    // error details only in development
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});
```

**Security Benefits:**
- No stack traces leaked to clients in production
- No database error details exposed
- Consistent error format prevents information disclosure

### 6.9 Environment Variable Protection

**Configuration:** `.env` file (not committed to repository)

```
MONGODB_URI=mongodb://localhost:27017/npdi
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Protection Mechanisms:**
- `.gitignore` excludes `.env` from version control
- `.env.example` provides template without secrets
- Environment variables never logged or exposed in responses

---

## 7. Integration Architecture

### 7.1 PubChem API Integration

#### 7.1.1 Purpose

The PubChem integration automatically enriches chemical product tickets with authoritative scientific data from the National Institutes of Health (NIH) PubChem database.

**Benefits:**
- Reduces manual data entry
- Ensures data accuracy and consistency
- Provides comprehensive chemical properties
- Accelerates ticket creation process

#### 7.1.2 Integration Architecture

**Service Layer:** `server/services/pubchemService.js`

**API Endpoints Used:**
1. **CID Lookup:** `/rest/pug/compound/name/{CAS}/cids/JSON`
   - Converts CAS number to PubChem Compound ID (CID)

2. **Properties Retrieval:** `/rest/pug/compound/cid/{CID}/property/.../JSON`
   - Fetches molecular formula, weight, SMILES, InChI, etc.

3. **Synonyms:** `/rest/pug/compound/cid/{CID}/synonyms/JSON`
   - Retrieves alternative chemical names

4. **GHS Classification:** `/rest/pug_view/data/compound/{CID}/JSON?heading=GHS+Classification`
   - Extracts hazard statements, signal words, precautionary statements

5. **Physical Properties:** `/rest/pug_view/data/compound/{CID}/JSON`
   - Parses melting point, boiling point, flash point, density, etc.

#### 7.1.3 Data Enrichment Flow

```
1. User enters CAS number in CreateTicket form
   ↓
2. Frontend makes POST /api/products with skipAutopopulate: false
   ↓
3. productController detects CAS number
   ↓
4. Calls pubchemService.enrichTicketData(casNumber)
   ↓
5. Service Flow:
   a) Lookup CID by CAS number
   b) Fetch compound properties (parallel)
   c) Fetch synonyms (parallel)
   d) Fetch GHS data (parallel)
   e) Fetch physical properties (parallel)
   f) Parse and structure data
   g) Generate AI product description
   ↓
6. Controller merges PubChem data with user input
   ↓
7. User input takes priority over PubChem data
   ↓
8. Ticket saved with enriched data
   ↓
9. Frontend displays auto-populated fields
```

#### 7.1.4 Rate Limiting & Error Handling

**Rate Limiting:**
```javascript
this.requestDelay = 200; // 200ms between requests = 5 req/sec
await this.delay(this.requestDelay);
```

**Compliance:** PubChem allows 5 requests per second without registration

**Error Handling Strategy:**
- Non-blocking: PubChem failure doesn't prevent ticket creation
- Graceful degradation: Returns minimal data structure on error
- User notification: Frontend displays which fields were auto-populated
- Logging: All PubChem errors logged for monitoring

**Example Error Handling:**
```javascript
try {
  const enrichedData = await pubchemService.enrichTicketData(casNumber);
  ticketData = { ...ticketData, ...enrichedData };
} catch (pubchemError) {
  console.warn('PubChem enrichment failed:', pubchemError.message);
  // Continue with user-provided data only
}
```

#### 7.1.5 Data Parsing & Transformation

**Physical Properties Parsing:**
- Prioritizes Celsius values for temperature properties
- Handles multiple data formats (StringWithMarkup, Number+Unit)
- Extracts UN numbers for hazardous materials
- Determines physical state (Solid, Liquid, Gas, Powder, Crystal)

**GHS Data Parsing:**
- Recursively searches nested JSON sections
- Extracts hazard statements, precautionary statements, signal words
- Handles varying data structures across different compounds

**Synonym Handling:**
- Limits to first 10 synonyms (prevents data bloat)
- Used for product naming suggestions
- Stored as array for search functionality

#### 7.1.6 Product Description Generation

The service generates marketing-friendly descriptions based on chemical properties:

```javascript
const generateAIProductDescription = (pubchemData, casNumber) => {
  // Analyzes LogP for solubility characteristics
  // Identifies hydrogen bonding capability
  // Suggests application areas
  // Generates feature lists and competitive advantages
  return {
    productDescription: "...",
    keyFeatures: [...],
    applications: [...],
    targetMarkets: [...],
    competitiveAdvantages: [...]
  };
};
```

**Usage:** Pre-populates CorpBase marketing content fields

### 7.2 Microsoft Teams Integration

#### 7.2.1 Purpose

The Teams integration provides real-time notifications for ticket events through Microsoft Teams channels using Incoming Webhooks.

**Benefits:**
- Immediate awareness of ticket status changes
- Centralized team communication
- Reduced email notification overhead
- Flexible event subscription model

#### 7.2.2 Integration Architecture

**Service Layer:** `server/services/teamsNotificationService.js`

**Webhook Configuration:**
- Configurable through Admin Dashboard → System Settings → Integrations
- Webhook URL stored in SystemSettings collection
- Event triggers configurable (status changes, comments, assignments, creation)

#### 7.2.3 Notification Flow

```
1. Ticket event occurs (status change, comment, etc.)
   ↓
2. productController detects event
   ↓
3. Checks SystemSettings for Teams integration enabled
   ↓
4. Calls teamsNotificationService.notifyStatusChange()
   ↓
5. Service formats Adaptive Card payload
   ↓
6. HTTP POST to Teams webhook URL
   ↓
7. Teams channel receives formatted notification
```

#### 7.2.4 Adaptive Card Format

**Card Structure:**
- Header with status icon and title
- Ticket information section:
  - Ticket Number
  - Product Name
  - SBU
  - Priority
  - Status transition (old → new)
  - Changed by user
- Action button: "View Ticket" (direct link to ticket details)

**Status-Based Styling:**
- Color-coded based on status (blue for submitted, green for completed, etc.)
- Signal words (📋, ✅, ⚠️) for visual identification

#### 7.2.5 Event Types Supported

**Current Implementation:**
- `notifyStatusChange()` - Ticket status updates
- `notifyTicketCreated()` - New ticket creation
- `notifyCommentAdded()` - Comment additions
- `notifyAssignmentChanged()` - Ticket assignments

**Configuration:**
Each event can be enabled/disabled independently in System Settings.

#### 7.2.6 Error Handling

- Non-blocking: Teams failures don't prevent ticket operations
- Graceful degradation: Logs webhook errors without user impact
- Configurable retry logic
- Automatic disable on persistent failures

### 7.3 Azure OpenAI Integration

#### 7.3.1 Purpose

The Azure OpenAI integration provides AI-powered content generation for product marketing materials using Merck's internal NLP API endpoint.

**Benefits:**
- Automated product descriptions generation
- Marketing content creation (website titles, meta descriptions, key features)
- Consistent content quality
- Reduced manual content creation time
- Leverages chemical properties for accurate descriptions

#### 7.3.2 Integration Architecture

**Service Layer:** `server/services/langdockService.js` (name retained for backward compatibility)

**API Endpoint:** `https://api.nlp.{environment}.uptimize.merckgroup.com/openai/deployments/{model}/chat/completions`

**Environments Supported:**
- `dev` - Development environment
- `test` - Testing environment
- `staging` - Staging environment
- `prod` - Production environment

**Models Available:**
- `gpt-4o-mini` - Recommended (fast, cost-effective)
- `gpt-4o` - Higher quality (higher cost)
- `gpt-5-mini` - Latest generation

#### 7.3.3 Configuration

**Admin Dashboard Configuration:**
- Enable/disable AI content generation
- API Key management
- Environment selection
- API version configuration
- Model/deployment name
- Max tokens per request
- Timeout settings
- Test connection functionality

**Configurable Content Types:**
1. Product Description (200 words, 0.7 temperature)
2. Website Title (70 chars, 0.5 temperature)
3. Meta Description (160 chars, 0.6 temperature)
4. Key Features & Benefits (5 bullets, 0.6 temperature)
5. Applications (4 items, 0.6 temperature)
6. Target Industries (4 items, 0.5 temperature)

Each content type has customizable:
- Prompt template with variable placeholders
- Length parameters (max words, max characters)
- Temperature (creativity level)
- Enable/disable toggle

#### 7.3.4 Content Generation Flow

```
1. User clicks "Generate with AI" in CorpBase form
   ↓
2. Frontend calls POST /api/products/generate-corpbase-content
   ↓
3. systemSettingsController retrieves AI configuration
   ↓
4. For each enabled content type:
   a) Replace template variables with ticket data
   b) Call langdockService.generateContent()
   c) Azure OpenAI processes request
   d) Return generated content
   ↓
5. Controller aggregates all generated content
   ↓
6. Frontend populates form fields sequentially
   ↓
7. User reviews and edits before saving
```

#### 7.3.5 Template Variables

Available placeholders for prompt templates:
- `{productName}` - Product name
- `{casNumber}` - CAS registry number
- `{molecularFormula}` - Molecular formula
- `{molecularWeight}` - Molecular weight
- `{iupacName}` - IUPAC name
- `{sbu}` - Strategic Business Unit
- `{maxWords}` - Maximum word count
- `{maxChars}` - Maximum characters
- `{bulletCount}` - Number of bullets
- `{wordsPerBullet}` - Words per bullet
- `{itemCount}` - Number of items

#### 7.3.6 Security & Authentication

**API Key Security:**
- Stored encrypted in SystemSettings collection
- Masked in admin interface (show last 8 characters only)
- Header format: `api-key: {API_KEY}`
- VPN requirement for Merck internal endpoint

**Rate Limiting:**
- Model-specific limits enforced by Azure
- Quota tracking in admin dashboard
- Default quotas: 1,000 calls/day (GPT-4), 10,000 calls/day (other models)

#### 7.3.7 Error Handling

**Connection Errors:**
- VPN connectivity checks
- Timeout handling (30 seconds default)
- Fallback to template-based generation

**API Errors:**
- 401: Invalid API key
- 404: Model/deployment not found
- 429: Rate limit exceeded
- Detailed error messages with troubleshooting hints

### 7.4 Data Export Services

#### 7.4.1 PDP Checklist Export Service

**Service Layer:** `server/services/pdpChecklistExportService.js`

**Purpose:** Generates Excel files populated with ticket data for Product Development Process (PDP) checklists.

**Implementation:**
- Uses ExcelJS library
- Reads template file: `PDP Checklist.xlsx`
- Populates Column O with ticket data
- Preserves all original formatting
- Maps 74 specific fields from ticket to checklist rows

**Key Mappings:**
- Row 3: CorpBase Product Number
- Row 4: CorpBase Brand
- Row 10: Primary name
- Row 11: Name suffix
- Row 15: Assay/Purity
- Row 25-26: InChI and InChI Key
- Row 28: Packaging (from SKU variants)
- Row 56-57: Product description and applications
- Row 69-71: Keywords, meta title, meta description

**Data Sources:**
- Chemical properties (CAS, formula, molecular weight)
- Quality specifications (MQ quality levels)
- SKU variants (package sizes)
- CorpBase data (product description, applications)
- Physical properties (boiling point, density, melting point)

#### 7.4.2 Data Export Service

**Service Layer:** `server/services/dataExportService.js`

**Purpose:** General data export functionality for various report formats.

**Export Formats:**
- Excel (XLSX) - Structured ticket data
- CSV - Bulk data export
- JSON - API data exchange

**Export Features:**
- Filtered exports (by status, SBU, date range)
- Custom column selection
- Data transformation and formatting
- Batch export capabilities

#### 7.4.3 Export Controller Integration

**Endpoint:** `POST /api/products/:id/export`

**Flow:**
```
1. User clicks "Export to Excel" button
   ↓
2. Frontend calls export endpoint with ticket ID
   ↓
3. productController retrieves ticket data
   ↓
4. Calls pdpChecklistExportService.generatePDPChecklist()
   ↓
5. Service generates Excel workbook
   ↓
6. Controller sets response headers for file download
   ↓
7. Browser downloads Excel file
```

**Response Headers:**
```javascript
res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
res.setHeader('Content-Disposition', `attachment; filename=PDP-Checklist-${ticketNumber}.xlsx`);
```

---

## 8. Deployment Architecture

### 8.1 Development Environment

**Architecture:**
```
┌────────────────────┐         ┌────────────────────┐
│   Vite Dev Server  │         │  Nodemon Server    │
│   Port 5173        │ ──API─→ │  Port 5000         │
│   - Hot reload     │ ←──────│  - Auto-restart    │
│   - API proxy      │         │  - Watch mode      │
└────────────────────┘         └────────────────────┘
                                        ↓
                               ┌────────────────────┐
                               │  MongoDB Local     │
                               │  Port 27017        │
                               └────────────────────┘
```

**Startup:**
```bash
npm run dev  # Concurrently starts both client and server
```

**Features:**
- Frontend hot module replacement (HMR)
- Backend auto-restart on file changes
- API proxy in Vite for CORS-free development
- Shared development profiles (no authentication overhead)

### 8.2 Production Deployment Model

**Recommended Architecture:**

```
                        Internet
                           ↓
                    ┌─────────────┐
                    │   Firewall  │
                    │  / Reverse  │
                    │    Proxy    │
                    │   (Nginx)   │
                    └─────────────┘
                     ↓           ↓
          ┌──────────────┐  ┌──────────────┐
          │  Static CDN  │  │ Load Balancer│
          │  (Frontend)  │  │   (API)      │
          └──────────────┘  └──────────────┘
                                    ↓
                     ┌──────────────────────────┐
                     │  API Server Instances    │
                     │  (PM2 Cluster Mode)      │
                     │  ┌────┐ ┌────┐ ┌────┐   │
                     │  │App1│ │App2│ │App3│   │
                     │  └────┘ └────┘ └────┘   │
                     └──────────────────────────┘
                                    ↓
                     ┌──────────────────────────┐
                     │  MongoDB Replica Set     │
                     │  ┌─────┐ ┌─────┐ ┌─────┐│
                     │  │Prim.│ │Sec. │ │Sec. ││
                     │  └─────┘ └─────┘ └─────┘│
                     └──────────────────────────┘
```

### 8.3 Build Process

**Frontend Build:**
```bash
cd client && npm run build
```

**Output:**
- Static files in `client/dist/`
- Minified JavaScript bundles
- Optimized CSS (Tailwind purged of unused classes)
- Hashed filenames for cache busting

**Backend Preparation:**
```bash
npm install --production  # Installs only production dependencies
```

**Deployment Package:**
- `server/` directory
- `package.json` and `package-lock.json`
- `.env` file (created on server, not deployed)
- `client/dist/` static files (served by Nginx or CDN)

### 8.4 Environment Configuration

**Development:**
```
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/npdi
PORT=5000
CLIENT_URL=http://localhost:5173
```

**Production:**
```
NODE_ENV=production
# Example only - Replace with your actual MongoDB Atlas credentials
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@your-cluster.mongodb.net/npdi?retryWrites=true
PORT=5000
CLIENT_URL=https://npdi.milliporesigma.com
```

**Critical Production Settings:**
- `NODE_ENV=production` - Disables verbose error messages, enables optimizations
- TLS-enabled MongoDB connection string
- HTTPS-only CLIENT_URL for CORS
- Strong API keys with expiration

### 8.5 Process Management

**Recommended: PM2**

```bash
pm2 start server/index.js --name npdi-api -i max
```

**Features:**
- Cluster mode (multi-core utilization)
- Automatic restart on crashes
- Log management
- Zero-downtime reloads
- Performance monitoring

**PM2 Ecosystem File:**
```javascript
module.exports = {
  apps: [{
    name: 'npdi-api',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
```

### 8.6 Reverse Proxy Configuration

**Nginx Configuration Example:**

```nginx
# Frontend (static files)
server {
  listen 80;
  server_name npdi.milliporesigma.com;
  root /var/www/npdi/client/dist;
  index index.html;

  # SPA routing
  location / {
    try_files $uri $uri/ /index.html;
  }

  # API proxy
  location /api {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### 8.7 Database Deployment

**Development:** Single MongoDB instance on localhost

**Production Recommendations:**
- **MongoDB Atlas** (managed cloud service) OR
- **Self-hosted Replica Set** (3+ nodes for high availability)

**Replica Set Benefits:**
- Automatic failover
- Data redundancy
- Read scaling with secondary nodes
- Zero-downtime maintenance

**Connection String Example (replace with your actual credentials):**
```
mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@your-cluster-name.mongodb.net/npdi?retryWrites=true&w=majority
```

**Backup Strategy:**
- Automated daily backups (Atlas built-in or mongodump cron)
- Point-in-time recovery capability
- Backup retention: 30 days minimum
- Test restoration quarterly

### 8.8 Monitoring & Logging

**Application Logs:**
- Console output captured by PM2
- Structured logging with timestamps
- Error logs separated from info logs

**Monitoring Metrics:**
- API response times
- Error rates (5xx responses)
- MongoDB connection pool status
- Memory usage and CPU utilization
- PubChem integration success rate
- API key usage statistics

**Recommended Tools:**
- **Application Performance:** New Relic, Datadog
- **Log Aggregation:** ELK Stack (Elasticsearch, Logstash, Kibana)
- **Uptime Monitoring:** Pingdom, UptimeRobot
- **Database Monitoring:** MongoDB Atlas monitoring or PMM

---

## 9. Maintainability & Scalability

### 9.1 Code Organization Best Practices

#### 9.1.1 Directory Structure

The application follows a clear, consistent directory structure:

```
npdi-app/
├── server/                    # Backend application
│   ├── config/               # Database and configuration
│   ├── controllers/          # Business logic
│   ├── middleware/           # Request processing
│   ├── models/               # Data schemas
│   ├── routes/               # API endpoints
│   ├── services/             # External integrations
│   ├── utils/                # Helper functions
│   ├── scripts/              # Maintenance scripts
│   └── index.js              # Application entry point
│
├── client/                   # Frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── admin/       # Admin-specific components
│   │   │   ├── forms/       # Form components
│   │   │   └── badges/      # Status/priority badges
│   │   ├── pages/           # Route components
│   │   ├── services/        # API client
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Helper functions
│   │   └── App.jsx          # Root component
│   ├── public/              # Static assets
│   └── dist/                # Build output
│
├── .env.example             # Environment template
├── package.json             # Dependencies
└── README.md                # Documentation
```

**Benefits:**
- New developers can locate files intuitively
- Related code grouped together
- Clear separation between client and server
- Easy to navigate with IDE folder trees

#### 9.1.2 Naming Conventions

**Files:**
- `PascalCase` for React components (`CreateTicket.jsx`)
- `camelCase` for utilities and services (`pubchemService.js`)
- `kebab-case` for configuration (`postcss.config.js`)

**Code:**
- `camelCase` for variables and functions (`createTicket`, `ticketData`)
- `PascalCase` for classes and React components (`ProductTicket`, `Dashboard`)
- `UPPER_SNAKE_CASE` for constants (`MAX_FILE_SIZE`, `DEFAULT_SBU`)

**Database:**
- `camelCase` for field names (`ticketNumber`, `chemicalProperties`)
- Lowercase for collection names (`producttickets`, `users`)

### 9.2 Modularity & Reusability

#### 9.2.1 Component Composition

React components follow single-responsibility principle:

**Bad - Monolithic Component:**
```jsx
function CreateTicketPage() {
  // 500+ lines of form fields, validation, submission logic, PubChem integration
}
```

**Good - Composed Components:**
```jsx
function CreateTicket() {
  return (
    <DynamicFormRenderer config={formConfig}>
      <DynamicBasicInfo />
      <ChemicalPropertiesForm />
      <SKUVariantsForm />
      <CorpBaseDataForm />
    </DynamicFormRenderer>
  );
}
```

**Benefits:**
- Each component has one responsibility
- Components can be tested independently
- Easy to add/remove sections
- Forms reusable in edit mode and templates

#### 9.2.2 Service Layer Pattern

Complex operations encapsulated in service modules:

```javascript
// Instead of duplicating PubChem logic across controllers
pubchemService.enrichTicketData(casNumber)  // Used in multiple places
```

**Service Responsibilities:**
- External API communication
- Data transformation
- Complex calculations
- Caching strategies

**Benefits:**
- Business logic centralized
- Easy to mock in tests
- Can be updated without changing controllers
- Promotes code reuse

#### 9.2.3 Utility Functions

Common operations extracted to utilities:

```javascript
// server/utils/enumCleaner.js
cleanTicketData(data)        // Used in create, update, saveDraft
ensureDefaultSBU(data, sbu)  // Used across controllers
ensureDefaultSKU(data)       // Used in ticket creation
```

**Benefits:**
- DRY (Don't Repeat Yourself) principle
- Consistent behavior across application
- Single location for bug fixes
- Easy to add unit tests

### 9.3 Configuration Management

#### 9.3.1 Environment Variables

All environment-specific values externalized:

```javascript
// Instead of hardcoding
const PORT = 5000;
const MONGODB_URI = 'mongodb://localhost:27017/npdi';

// Use environment variables
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
```

**Benefits:**
- Different settings per environment (dev, staging, prod)
- Secrets not committed to version control
- Easy to change without code modifications

#### 9.3.2 Database-Driven Configuration

FormConfiguration collection enables runtime changes:

```javascript
// No code changes needed to:
// - Add new form fields
// - Reorder sections
// - Change field visibility
// - Update validation rules
```

**Benefits:**
- Business users can modify forms
- No deployment required for configuration changes
- A/B testing different form layouts
- Rapid iteration on business processes

### 9.4 Error Handling & Debugging

#### 9.4.1 Consistent Error Responses

All API endpoints return consistent error format:

```javascript
res.status(400).json({
  message: 'User-friendly error message',
  errors: validationErrors,  // Detailed errors for debugging
  code: 'VALIDATION_ERROR'   // Error type for programmatic handling
});
```

**Benefits:**
- Frontend can handle errors uniformly
- Easy to display user-friendly messages
- Debugging information available in development

#### 9.4.2 Logging Strategy

Comprehensive logging throughout application:

```javascript
// Context-rich logging
console.log(`CAS lookup request for: ${casNumber}`);
console.error('Create ticket error:', error);
console.warn('PubChem enrichment failed, proceeding with user data');
```

**Benefits:**
- Trace request flow through application
- Identify performance bottlenecks
- Debug production issues
- Security audit trail

### 9.5 Testing Strategy

#### 9.5.1 Testable Architecture

MVC pattern enables testing at multiple levels:

**Unit Tests (Models):**
```javascript
describe('ProductTicket Model', () => {
  it('generates ticket number on save', async () => {
    const ticket = new ProductTicket({ productLine: 'Test' });
    await ticket.save();
    expect(ticket.ticketNumber).toMatch(/NPDI-\d{4}-\d{4}/);
  });
});
```

**Unit Tests (Controllers):**
```javascript
jest.mock('../models/ProductTicket');
describe('createTicket', () => {
  it('returns 400 for invalid CAS number', async () => {
    // Test business logic without database
  });
});
```

**Integration Tests (API):**
```javascript
describe('POST /api/products', () => {
  it('creates ticket with PubChem enrichment', async () => {
    // Test full request/response cycle
  });
});
```

**Component Tests (React):**
```javascript
describe('StatusBadge', () => {
  it('renders correct color for SUBMITTED status', () => {
    // Test UI rendering
  });
});
```

#### 9.5.2 Test Data Management

Utilities for consistent test data:

```javascript
// scripts/seedApiKey.js - Seeds development API keys
// data/devProfiles.json - Standard development profiles
```

**Benefits:**
- Reproducible test environments
- Quick setup for new developers
- Consistent demo data

### 9.6 Documentation

#### 9.6.1 Inline Documentation

Code includes explanatory comments:

```javascript
// Pre-save middleware for automatic ticket number generation
productTicketSchema.pre('save', async function(next) { ... });

// Prioritizes Celsius values for temperature properties
const getCelsiusPreferredValue = (valuesList) => { ... };
```

**Benefits:**
- Self-documenting code
- Faster onboarding for new developers
- Reduces knowledge silos

#### 9.6.2 API Documentation

Comprehensive API documentation in `API_DOCUMENTATION.md`:
- All endpoints with request/response examples
- Authentication requirements
- Error codes and messages
- Rate limits and quotas

#### 9.6.3 Architectural Documentation

This document provides:
- System overview for stakeholders
- Component descriptions for developers
- Deployment guide for DevOps
- Security model for auditors

### 9.7 Scalability Considerations

#### 9.7.1 Stateless Application Design

Backend is completely stateless:
- No session storage in memory
- All state in database or client
- Enables horizontal scaling

**Benefits:**
- Multiple server instances behind load balancer
- Zero-downtime deployments
- Auto-scaling based on traffic

#### 9.7.2 Database Indexing

Strategic indexes for performance:

```javascript
// Unique index for fast ticket lookups
ticketNumber: { type: String, unique: true }

// Compound index for dashboard queries
{ status: 1, sbu: 1, priority: 1 }

// Text index for search
{ productName: 'text', ticketNumber: 'text' }
```

**Benefits:**
- Fast query performance even with millions of tickets
- Efficient dashboard rendering
- Quick search results

#### 9.7.3 Caching Strategies

**Frontend Caching:**
```javascript
// Form configuration cached in localStorage
useFormConfig() // Reduces API calls
```

**Additional Caching:**
- CDN for static assets in production
- API response caching for GET endpoints

#### 9.7.4 Pagination

All list endpoints support pagination:

```javascript
GET /api/products?page=1&limit=20
```

**Benefits:**
- Reduces payload size
- Faster initial page load
- Supports infinite scroll or traditional pagination

#### 9.7.5 Asynchronous Processing

Non-critical operations run asynchronously:

```javascript
// API key usage tracking doesn't block response
apiKeyRecord.recordUsage().catch(err => {
  console.error('Error recording usage:', err);
});

// Teams notifications sent asynchronously
teamsNotificationService.notifyStatusChange(ticket, oldStatus, newStatus, user)
  .catch(err => console.error('Teams notification failed:', err));
```

### 9.8 Version Control & Collaboration

#### 9.8.1 Git Workflow

Recommended branching strategy:
- `main` - Production-ready code
- `dev` - Integration branch for features
- `feature/*` - Feature development branches
- `hotfix/*` - Emergency fixes

#### 9.8.2 Code Review Process

All changes reviewed before merging:
- Ensures code quality
- Shares knowledge across team
- Catches bugs early
- Maintains architectural consistency

### 9.9 Dependency Management

#### 9.9.1 Semantic Versioning

Dependencies use semver ranges:

```json
{
  "express": "^4.18.2",  // Allows 4.x updates, not 5.x
  "mongoose": "^7.5.0"   // Allows 7.x updates, not 8.x
}
```

**Benefits:**
- Automatic security patches
- Controlled major version upgrades
- Reproducible builds with package-lock.json

#### 9.9.2 Dependency Auditing

Regular security checks:

```bash
npm audit              # Check for vulnerabilities
npm audit fix          # Apply automated fixes
npm outdated           # Check for updates
```

**Process:**
- Weekly automated scans
- Monthly dependency updates
- Immediate action on critical vulnerabilities

---

## 10. Conclusion

The NPDI Application implements a robust, maintainable MVC architecture that supports the ticket initiation workflow for chemical product development at MilliporeSigma. The clear separation of concerns, comprehensive security model, and thoughtful integration architecture provide a solid foundation for capturing product data and facilitating collaboration between Product Managers and PMOps teams.

**Key Architectural Strengths:**
- **Maintainability:** MVC pattern enables isolated changes and testing
- **Security:** Multi-layered defense-in-depth approach
- **Scalability:** Stateless design supports horizontal scaling
- **Flexibility:** Database-driven configuration enables rapid business changes
- **Reliability:** Comprehensive error handling and validation
- **Performance:** Strategic indexing and caching

The architecture balances immediate business needs with long-term technical sustainability, positioning the application for continued evolution as MilliporeSigma's product management processes mature.

---

**Document Version:** 1.0
**Last Updated:** 2025-10-21
**Next Review:** Quarterly or after major architectural changes
**Maintainer:** Development Team
