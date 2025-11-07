# Microsoft Entra ID Implementation Plan
## Replacing Profile-Based Authentication with Real Identity Management

**Document Version:** 1.0
**Date:** 2025-11-06
**Status:** Planning Phase
**Estimated Timeline:** 3-4 weeks

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Target Architecture](#target-architecture)
4. [Prerequisites](#prerequisites)
5. [Implementation Phases](#implementation-phases)
6. [Detailed Technical Steps](#detailed-technical-steps)
7. [Testing Strategy](#testing-strategy)
8. [Migration Plan](#migration-plan)
9. [Rollback Strategy](#rollback-strategy)
10. [Security Considerations](#security-considerations)
11. [Timeline & Resources](#timeline--resources)

---

## Executive Summary

### Objective
Replace the current profile-based authentication system with Microsoft Entra ID (Azure AD) integration to provide:
- Real user authentication with corporate credentials
- Single Sign-On (SSO) with Microsoft 365
- Centralized user management via Entra ID
- Foundation for future Microsoft Graph API integration (Teams direct messages)

### Current State
- Users select from pre-defined development profiles
- No real authentication - headers sent to backend
- User data stored in `localStorage`
- Profile management via JSON file

### Target State
- Users authenticate via Microsoft Entra ID
- OAuth 2.0 / OpenID Connect flow
- JWT tokens for API authorization
- User roles mapped from Azure AD groups
- Real session management

### Key Benefits
- ✅ **Security**: Real authentication, not simulated
- ✅ **User Experience**: Single Sign-On with Microsoft 365
- ✅ **Management**: IT controls user access centrally
- ✅ **Compliance**: Audit trails, MFA support
- ✅ **Scalability**: Foundation for Graph API features

---

## Current State Analysis

### Authentication Flow (Current)
```
User → Profile Selection Page → Select Profile → Store in localStorage
                                                         ↓
                                    API Requests include x-user-* headers
                                                         ↓
                                    Backend reads headers (no validation)
```

### Files Involved

#### Backend
| File | Purpose | Changes Required |
|------|---------|------------------|
| `server/middleware/auth.js` | Profile header authentication | Replace with JWT validation |
| `server/controllers/devProfileController.js` | Profile API endpoints | Remove (no longer needed) |
| `server/routes/users.js` | Profile routes | Update to use Entra ID |
| `server/data/devProfiles.json` | Development profiles | Remove after migration |
| `server/models/User.js` | User schema | Add Entra ID fields |

#### Frontend
| File | Purpose | Changes Required |
|------|---------|------------------|
| `client/src/utils/AuthContext.jsx` | Auth state management | Add MSAL integration |
| `client/src/pages/ProfileSelection.jsx` | Profile picker | Replace with login redirect |
| `client/src/services/api.js` | API client (headers) | Send JWT tokens instead |
| `client/src/App.jsx` | Route protection | Update auth checks |
| `client/src/components/Layout.jsx` | User display | Update user info source |

### Current User Flow
1. User visits NPDI app
2. Sees profile selection page
3. Clicks a profile (e.g., "Sarah Chen - Product Manager")
4. Profile stored in `localStorage`
5. All API requests include:
   - `x-user-role: PRODUCT_MANAGER`
   - `x-user-firstname: Sarah`
   - `x-user-lastname: Chen`
   - `x-user-email: sarah.chen@company.com`
   - `x-user-sbu: 775`

### Limitations of Current System
- ❌ No password/authentication required
- ❌ Anyone can impersonate any user
- ❌ No session expiration
- ❌ No audit trail of who actually used the system
- ❌ Manual user management (JSON file)
- ❌ Cannot integrate with Microsoft services

---

## Target Architecture

### Authentication Flow (Entra ID)
```
User → NPDI App → Redirect to Microsoft Login → User enters credentials
                                                         ↓
                                        Microsoft validates & returns tokens
                                                         ↓
                        NPDI receives: ID Token + Access Token
                                                         ↓
                        Frontend stores tokens, extracts user info
                                                         ↓
                        API requests include: Bearer {access_token}
                                                         ↓
                        Backend validates JWT signature & claims
                                                         ↓
                        Request proceeds with authenticated user
```

### Architecture Diagram
```
┌──────────────────────────────────────────────────────────────────┐
│                    Microsoft Entra ID Tenant                      │
│                                                                   │
│  ┌─────────────────┐         ┌──────────────────────────┐       │
│  │   User Accounts │         │   Azure AD Groups        │       │
│  │                 │         │                          │       │
│  │ john@company    │◄────────┤  NPDI-Admins            │       │
│  │ sarah@company   │         │  NPDI-PMOps             │       │
│  │ mike@company    │         │  NPDI-ProductManagers   │       │
│  └─────────────────┘         └──────────────────────────┘       │
│           │                                                      │
│           │ (authenticates)                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────┐        │
│  │          OAuth 2.0 Authorization Endpoint            │        │
│  │  https://login.microsoftonline.com/{tenant}/oauth2  │        │
│  └─────────────────────────────────────────────────────┘        │
│           │                                                      │
└───────────┼──────────────────────────────────────────────────────┘
            │ (returns tokens)
            ▼
┌──────────────────────────────────────────────────────────────────┐
│                        NPDI Application                           │
│                                                                   │
│  ┌────────────────────────────────────────────────────┐          │
│  │               Frontend (React)                      │          │
│  │                                                     │          │
│  │  ┌──────────────────────────────────────────┐     │          │
│  │  │  MSAL.js (Microsoft Auth Library)        │     │          │
│  │  │  - Handles OAuth flow                    │     │          │
│  │  │  - Manages token acquisition             │     │          │
│  │  │  - Silent token refresh                  │     │          │
│  │  └──────────────────────────────────────────┘     │          │
│  │                                                     │          │
│  │  ┌──────────────────────────────────────────┐     │          │
│  │  │  AuthContext (Enhanced)                  │     │          │
│  │  │  - Wraps MSAL                            │     │          │
│  │  │  - Provides user state                   │     │          │
│  │  │  - Manages login/logout                  │     │          │
│  │  └──────────────────────────────────────────┘     │          │
│  └────────────────────────────────────────────────────┘          │
│           │                                                       │
│           │ (API requests with Bearer token)                     │
│           ▼                                                       │
│  ┌────────────────────────────────────────────────────┐          │
│  │               Backend (Node/Express)                │          │
│  │                                                     │          │
│  │  ┌──────────────────────────────────────────┐     │          │
│  │  │  JWT Validation Middleware               │     │          │
│  │  │  - Validates token signature             │     │          │
│  │  │  - Checks expiration                     │     │          │
│  │  │  - Extracts claims (email, roles, etc)   │     │          │
│  │  └──────────────────────────────────────────┘     │          │
│  │                     ↓                              │          │
│  │  ┌──────────────────────────────────────────┐     │          │
│  │  │  Role Mapping Service                    │     │          │
│  │  │  - Maps AD groups to NPDI roles          │     │          │
│  │  │  - Determines permissions                │     │          │
│  │  └──────────────────────────────────────────┘     │          │
│  │                     ↓                              │          │
│  │           Authorized API request                   │          │
│  └────────────────────────────────────────────────────┘          │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Token Structure

**ID Token** (user identity):
```json
{
  "aud": "client-id-from-azure",
  "iss": "https://login.microsoftonline.com/{tenant}/v2.0",
  "iat": 1699310400,
  "exp": 1699314000,
  "name": "Sarah Chen",
  "preferred_username": "sarah.chen@company.com",
  "oid": "user-object-id",
  "tid": "tenant-id",
  "roles": ["NPDI-ProductManagers"]
}
```

**Access Token** (API authorization):
- Used for backend API calls
- Validated by backend middleware
- Contains user claims and roles

---

## Prerequisites

### Azure/Entra ID Requirements

#### 1. App Registration
**What:** Register NPDI as an application in Entra ID
**Who:** Azure AD Administrator or Application Administrator
**Where:** Azure Portal → Entra ID → App Registrations

**Configuration needed:**
- Application Name: `NPDI Portal`
- Supported Account Types: `Accounts in this organizational directory only`
- Redirect URIs:
  - Development: `http://localhost:3000/auth/callback`
  - Production: `https://npdi.yourcompany.com/auth/callback`

**Outputs:**
- ✅ Application (client) ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- ✅ Directory (tenant) ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- ✅ Client Secret (if needed): Generated and securely stored

#### 2. API Permissions
**Required permissions:**
- `User.Read` - Read signed-in user's profile (Delegated)
- `User.ReadBasic.All` - Read basic profiles of all users (Delegated)
- `openid` - OpenID Connect sign-in (Delegated)
- `profile` - View users' basic profile (Delegated)
- `email` - View users' email address (Delegated)

**Admin consent:** Required for organization-wide access

#### 3. Azure AD Groups (for role mapping)
**Required groups:**
- `NPDI-Admins` - Maps to ADMIN role
- `NPDI-PMOps` - Maps to PM_OPS role
- `NPDI-ProductManagers-775` - Maps to PRODUCT_MANAGER (SBU 775)
- `NPDI-ProductManagers-P90` - Maps to PRODUCT_MANAGER (SBU P90)
- `NPDI-ProductManagers-440` - Maps to PRODUCT_MANAGER (SBU 440)
- `NPDI-ProductManagers-P87` - Maps to PRODUCT_MANAGER (SBU P87)
- `NPDI-ProductManagers-P89` - Maps to PRODUCT_MANAGER (SBU P89)
- `NPDI-ProductManagers-P85` - Maps to PRODUCT_MANAGER (SBU P85)

**Configuration:**
- Groups should be security-enabled
- Users assigned to appropriate groups
- Group object IDs noted for role mapping

#### 4. App Roles (Alternative to Groups)
**Option:** Define roles in App Registration instead of groups
**Benefit:** Cleaner, app-specific role management
**Configuration:** Manifest editing in App Registration

### Development Environment

#### Backend Dependencies
```json
{
  "jsonwebtoken": "^9.0.2",
  "jwks-rsa": "^3.1.0",
  "passport": "^0.7.0",
  "passport-azure-ad": "^4.3.5",
  "dotenv": "^16.3.1"
}
```

#### Frontend Dependencies
```json
{
  "@azure/msal-browser": "^3.5.0",
  "@azure/msal-react": "^2.0.0"
}
```

### Environment Variables

**Backend** (`.env`):
```bash
# Entra ID Configuration
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=your-client-secret-here  # If using confidential client
AZURE_CLOUD_INSTANCE=https://login.microsoftonline.com/
AZURE_AUTHORITY=https://login.microsoftonline.com/{tenant-id}

# JWT Configuration
JWT_ISSUER=https://login.microsoftonline.com/{tenant-id}/v2.0
JWT_AUDIENCE=${AZURE_CLIENT_ID}

# Application URLs
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000

# Feature Flags (for migration)
ENABLE_ENTRA_AUTH=true
ENABLE_PROFILE_AUTH=false  # Set to true during migration period
```

**Frontend** (`.env`):
```bash
REACT_APP_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
REACT_APP_AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
REACT_APP_AZURE_AUTHORITY=https://login.microsoftonline.com/{tenant-id}
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_REDIRECT_URI=http://localhost:3000/auth/callback
```

---

## Implementation Phases

### Phase 1: Preparation & Setup (Week 1)
**Effort:** 3-5 days
**Risk:** Low

**Tasks:**
1. ✅ Create Azure App Registration (IT Admin)
2. ✅ Configure API permissions and admin consent (IT Admin)
3. ✅ Create Azure AD groups for role mapping (IT Admin)
4. ✅ Document Client ID, Tenant ID, and secrets
5. ✅ Install required npm packages
6. ✅ Create environment configuration files
7. ✅ Set up development branch: `feature/entra-id-auth`

**Deliverables:**
- App Registration details document
- Environment variable templates
- Updated `package.json` with new dependencies

**Success Criteria:**
- App Registration exists and is configured
- All required permissions granted
- Dev environment ready for coding

### Phase 2: Backend Implementation (Week 2)
**Effort:** 5-7 days
**Risk:** Medium

**Tasks:**
1. Create JWT validation middleware
2. Update User model for Entra ID fields
3. Create role mapping service (AD groups → NPDI roles)
4. Update authentication middleware
5. Create user sync service
6. Update API routes to use new auth
7. Add token validation tests
8. Maintain backward compatibility (dual auth mode)

**Deliverables:**
- `server/middleware/jwtAuth.js` - JWT validation
- `server/services/roleMapping.js` - Role mapping logic
- `server/services/userSync.js` - Sync users from Entra ID
- Updated `server/models/User.js`
- Unit tests for authentication

**Success Criteria:**
- Backend accepts and validates JWT tokens
- Roles correctly mapped from AD groups
- API endpoints protected with JWT auth
- Existing profile auth still works (for migration)

### Phase 3: Frontend Implementation (Week 2-3)
**Effort:** 5-7 days
**Risk:** Medium

**Tasks:**
1. Install and configure MSAL
2. Create MSAL configuration
3. Update AuthContext with MSAL integration
4. Replace ProfileSelection with login redirect
5. Update API client to send Bearer tokens
6. Create auth callback handler
7. Update UI to show real user info
8. Add token refresh logic
9. Add logout functionality

**Deliverables:**
- `client/src/config/msalConfig.js` - MSAL setup
- Updated `client/src/utils/AuthContext.jsx`
- `client/src/pages/AuthCallback.jsx` - Handle redirects
- Updated `client/src/services/api.js`
- Login/logout components

**Success Criteria:**
- Users redirected to Microsoft login
- Successful authentication returns tokens
- API calls include valid Bearer tokens
- User info displayed correctly
- Token refresh works automatically

### Phase 4: Testing & Migration (Week 3-4)
**Effort:** 3-5 days
**Risk:** High

**Tasks:**
1. End-to-end testing with real users
2. Test all user roles (Admin, PM-OPS, Product Manager)
3. Test SBU access restrictions
4. Load testing with concurrent users
5. Security audit of token handling
6. Create migration documentation
7. Plan production rollout
8. Prepare rollback procedure

**Deliverables:**
- Test plan and results document
- User acceptance testing (UAT) report
- Migration runbook
- Rollback procedure document

**Success Criteria:**
- All user flows working with Entra ID
- No security vulnerabilities found
- Performance meets requirements
- UAT passed with stakeholders
- Rollback tested successfully

### Phase 5: Production Deployment (Week 4)
**Effort:** 2-3 days
**Risk:** High

**Tasks:**
1. Create production App Registration
2. Configure production redirect URIs
3. Deploy backend changes
4. Deploy frontend changes
5. Update environment variables
6. Monitor error logs
7. User communication and training
8. Support period (1 week)

**Deliverables:**
- Production deployment checklist
- User communication email
- Support documentation
- Incident response plan

**Success Criteria:**
- Production deployment successful
- Users can authenticate
- No P1/P2 incidents
- Support tickets resolved

---

## Detailed Technical Steps

### Step 1: Azure App Registration (IT Admin Task)

**Azure Portal Steps:**
1. Navigate to: `Azure Portal → Entra ID → App registrations → New registration`
2. Fill in:
   - **Name:** NPDI Portal
   - **Supported account types:** Accounts in this organizational directory only
   - **Redirect URI:**
     - Type: Single-page application (SPA)
     - URI: `http://localhost:3000` (dev), `https://npdi.yourcompany.com` (prod)
3. Click **Register**
4. Note the **Application (client) ID** and **Directory (tenant) ID**

**Configure Authentication:**
1. Go to **Authentication** section
2. Under **Implicit grant and hybrid flows:**
   - ☑️ Access tokens (used for implicit flows)
   - ☑️ ID tokens (used for implicit and hybrid flows)
3. Under **Advanced settings:**
   - Allow public client flows: No
4. Click **Save**

**Configure API Permissions:**
1. Go to **API permissions** section
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add:
   - `User.Read`
   - `User.ReadBasic.All`
   - `openid`
   - `profile`
   - `email`
6. Click **Grant admin consent** (requires admin)

**Configure App Roles (Optional but Recommended):**
1. Go to **App roles** section
2. Click **Create app role** for each:

**Admin Role:**
```json
{
  "allowedMemberTypes": ["User"],
  "description": "Administrators have full access to all NPDI features",
  "displayName": "NPDI Administrator",
  "id": "generate-new-guid",
  "isEnabled": true,
  "value": "ADMIN"
}
```

**PM-OPS Role:**
```json
{
  "allowedMemberTypes": ["User"],
  "description": "PM-OPS team manages ticket processing",
  "displayName": "PM Operations",
  "id": "generate-new-guid",
  "isEnabled": true,
  "value": "PM_OPS"
}
```

**Product Manager Role:**
```json
{
  "allowedMemberTypes": ["User"],
  "description": "Product Managers create and manage tickets",
  "displayName": "Product Manager",
  "id": "generate-new-guid",
  "isEnabled": true,
  "value": "PRODUCT_MANAGER"
}
```

**Create Client Secret (if needed):**
1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Description: `NPDI Backend Secret`
4. Expires: 24 months (or per your policy)
5. Click **Add**
6. **IMMEDIATELY COPY THE SECRET VALUE** (shown only once)
7. Store securely in password manager

---

### Step 2: Install Dependencies

**Backend:**
```bash
cd server
npm install jsonwebtoken jwks-rsa passport passport-azure-ad axios
```

**Frontend:**
```bash
cd client
npm install @azure/msal-browser @azure/msal-react
```

---

### Step 3: Backend Implementation

#### File: `server/config/azureConfig.js`
```javascript
module.exports = {
  credentials: {
    tenantID: process.env.AZURE_TENANT_ID,
    clientID: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  },
  metadata: {
    authority: 'login.microsoftonline.com',
    discovery: '.well-known/openid-configuration',
    version: 'v2.0',
  },
  settings: {
    validateIssuer: true,
    passReqToCallback: false,
    loggingLevel: 'info',
    loggingNoPII: true,
  },
  roleMapping: {
    // Map Azure AD group Object IDs to NPDI roles
    'group-id-for-admins': { role: 'ADMIN', sbu: null },
    'group-id-for-pmops': { role: 'PM_OPS', sbu: null },
    'group-id-for-pm-775': { role: 'PRODUCT_MANAGER', sbu: '775' },
    'group-id-for-pm-p90': { role: 'PRODUCT_MANAGER', sbu: 'P90' },
    // Add more group mappings...
  }
};
```

#### File: `server/middleware/jwtAuth.js`
```javascript
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const User = require('../models/User');
const { roleMapping } = require('../config/azureConfig');

// Create JWKS client to fetch public keys
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

// Get signing key from JWKS
const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
    } else {
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    }
  });
};

// JWT verification options
const jwtOptions = {
  audience: process.env.AZURE_CLIENT_ID,
  issuer: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`,
  algorithms: ['RS256'],
};

/**
 * Middleware to authenticate JWT tokens from Entra ID
 */
const authenticateJWT = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // If Entra auth is enabled and profile auth is disabled, reject
      if (process.env.ENABLE_ENTRA_AUTH === 'true' &&
          process.env.ENABLE_PROFILE_AUTH !== 'true') {
        return res.status(401).json({
          message: 'Access denied. No token provided.'
        });
      }
      // Otherwise, let profile auth middleware handle it
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    jwt.verify(token, getKey, jwtOptions, async (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err.message);
        return res.status(403).json({
          message: 'Invalid or expired token.',
          error: err.message
        });
      }

      try {
        // Extract user information from token
        const email = decoded.preferred_username || decoded.email || decoded.upn;
        const firstName = decoded.given_name || '';
        const lastName = decoded.family_name || '';
        const objectId = decoded.oid; // Entra ID user object ID

        // Map Azure AD groups/roles to NPDI roles
        const roleInfo = mapUserRole(decoded);

        // Find or create user in database
        let user = await User.findOne({ email });

        if (!user) {
          // Auto-provision user from Entra ID
          user = new User({
            email,
            firstName,
            lastName,
            role: roleInfo.role,
            sbu: roleInfo.sbu,
            azureObjectId: objectId,
            isActive: true,
          });
          await user.save();
          console.log(`Auto-provisioned new user: ${email}`);
        } else {
          // Update user info from token (in case it changed in AD)
          user.firstName = firstName;
          user.lastName = lastName;
          user.role = roleInfo.role;
          user.sbu = roleInfo.sbu;
          user.lastLogin = new Date();
          await user.save();
        }

        // Attach user to request
        req.user = {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          sbu: user.sbu,
          isActive: user.isActive,
          azureObjectId: objectId,
        };

        next();
      } catch (dbError) {
        console.error('Database error during authentication:', dbError);
        return res.status(500).json({
          message: 'Authentication error',
          error: dbError.message
        });
      }
    });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Map Azure AD groups/roles to NPDI roles
 */
function mapUserRole(decodedToken) {
  // Check for app roles (if configured in App Registration)
  if (decodedToken.roles && Array.isArray(decodedToken.roles)) {
    if (decodedToken.roles.includes('ADMIN')) {
      return { role: 'ADMIN', sbu: null };
    }
    if (decodedToken.roles.includes('PM_OPS')) {
      return { role: 'PM_OPS', sbu: null };
    }
    if (decodedToken.roles.includes('PRODUCT_MANAGER')) {
      // Default SBU - could be enhanced to get from group membership
      return { role: 'PRODUCT_MANAGER', sbu: 'P90' };
    }
  }

  // Check for groups (if using Azure AD groups)
  if (decodedToken.groups && Array.isArray(decodedToken.groups)) {
    for (const groupId of decodedToken.groups) {
      if (roleMapping[groupId]) {
        return roleMapping[groupId];
      }
    }
  }

  // Default role if no mapping found
  console.warn(`No role mapping found for user: ${decodedToken.preferred_username}`);
  return { role: 'PRODUCT_MANAGER', sbu: 'P90' };
}

module.exports = {
  authenticateJWT,
  mapUserRole,
};
```

#### Update: `server/models/User.js`
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\S+@\S+\.\S+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['PRODUCT_MANAGER', 'PM_OPS', 'ADMIN'],
    required: true
  },
  sbu: {
    type: String,
    enum: ['775', 'P90', '440', 'P87', 'P89', 'P85'],
    required: function() {
      return this.role === 'PRODUCT_MANAGER';
    }
  },
  // NEW: Entra ID fields
  azureObjectId: {
    type: String,
    unique: true,
    sparse: true, // Allow null values, unique only when present
    index: true
  },
  azureTenantId: {
    type: String
  },
  // END NEW
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
```

#### Update: `server/middleware/auth.js`
```javascript
const { authenticateJWT } = require('./jwtAuth');
const Permission = require('../models/Permission');

// Profile-based authentication (LEGACY - for migration only)
const authenticateProfile = async (req, res, next) => {
  // Only allow if explicitly enabled
  if (process.env.ENABLE_PROFILE_AUTH !== 'true') {
    return res.status(401).json({
      message: 'Profile authentication is disabled. Please use Microsoft login.'
    });
  }

  try {
    const role = req.header('x-user-role');
    const firstName = req.header('x-user-firstname');
    const lastName = req.header('x-user-lastname');
    const email = req.header('x-user-email');
    const sbu = req.header('x-user-sbu');

    if (!role || !email) {
      return res.status(401).json({ message: 'Access denied. No profile selected.' });
    }

    req.user = {
      role,
      firstName,
      lastName,
      email,
      sbu,
      isActive: true,
      legacy: true // Mark as legacy auth
    };

    next();
  } catch (error) {
    console.error('Profile authentication error:', error);
    res.status(401).json({ message: 'Invalid profile data.' });
  }
};

// Main authentication middleware (supports both methods during migration)
const authenticate = async (req, res, next) => {
  // Try JWT first
  if (process.env.ENABLE_ENTRA_AUTH === 'true') {
    return authenticateJWT(req, res, (err) => {
      if (err) return next(err);

      // If JWT auth succeeded, continue
      if (req.user) {
        return next();
      }

      // If JWT auth didn't set user and profile auth is enabled, try profile auth
      if (process.env.ENABLE_PROFILE_AUTH === 'true') {
        return authenticateProfile(req, res, next);
      }

      // No auth method succeeded
      return res.status(401).json({ message: 'Authentication required' });
    });
  }

  // Fall back to profile auth if Entra is disabled
  return authenticateProfile(req, res, next);
};

// ... rest of existing middleware (authorize, checkSBUAccess, etc.)

module.exports = {
  authenticate, // NEW: Unified auth
  authenticateProfile, // LEGACY
  authenticateJWT, // NEW
  authorize,
  checkSBUAccess,
  requireAdmin,
  checkPermission,
  attachPermissions,
  hasPermission,
  protect: authenticate, // Updated alias
  adminOnly: requireAdmin
};
```

---

### Step 4: Frontend Implementation

#### File: `client/src/config/msalConfig.js`
```javascript
import { LogLevel, PublicClientApplication } from '@azure/msal-browser';

// MSAL configuration
export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID}`,
    redirectUri: process.env.REACT_APP_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'localStorage', // 'localStorage' or 'sessionStorage'
    storeAuthStateInCookie: false, // Set to true for IE11/Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      },
      logLevel: LogLevel.Warning,
      piiLoggingEnabled: false,
    },
  },
};

// Scopes for login request
export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

// Scopes for token request (API calls)
export const tokenRequest = {
  scopes: [`api://${process.env.REACT_APP_AZURE_CLIENT_ID}/user_impersonation`],
  forceRefresh: false, // Set to true to skip cached token
};

// Create MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
msalInstance.initialize().then(() => {
  // Handle redirect promise
  msalInstance.handleRedirectPromise().catch((error) => {
    console.error('Redirect error:', error);
  });
});
```

#### Update: `client/src/utils/AuthContext.jsx`
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { loginRequest, tokenRequest } from '../config/msalConfig';
import { apiClient } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    if (isAuthenticated && accounts.length > 0 && inProgress === InteractionStatus.None) {
      // Get user info from account
      const account = accounts[0];

      // Acquire access token
      acquireAccessToken(account);

      // Set user info from ID token
      const userInfo = {
        email: account.username,
        firstName: account.idTokenClaims?.given_name || '',
        lastName: account.idTokenClaims?.family_name || '',
        role: extractRole(account.idTokenClaims),
        sbu: extractSBU(account.idTokenClaims),
        name: account.name,
      };

      setUser(userInfo);
      setLoading(false);
    } else if (!isAuthenticated && inProgress === InteractionStatus.None) {
      setUser(null);
      setAccessToken(null);
      setLoading(false);
    }
  }, [isAuthenticated, accounts, inProgress]);

  const acquireAccessToken = async (account) => {
    try {
      const request = {
        ...tokenRequest,
        account: account,
      };

      const response = await instance.acquireTokenSilent(request);
      setAccessToken(response.accessToken);

      // Set token in API client
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.accessToken}`;
    } catch (error) {
      console.error('Token acquisition error:', error);

      // If silent acquisition fails, try interactive
      if (error.name === 'InteractionRequiredAuthError') {
        try {
          const response = await instance.acquireTokenPopup(request);
          setAccessToken(response.accessToken);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.accessToken}`;
        } catch (popupError) {
          console.error('Interactive token acquisition error:', popupError);
        }
      }
    }
  };

  const extractRole = (claims) => {
    // Extract role from token claims
    if (claims?.roles && Array.isArray(claims.roles)) {
      if (claims.roles.includes('ADMIN')) return 'ADMIN';
      if (claims.roles.includes('PM_OPS')) return 'PM_OPS';
      if (claims.roles.includes('PRODUCT_MANAGER')) return 'PRODUCT_MANAGER';
    }

    // Default role
    return 'PRODUCT_MANAGER';
  };

  const extractSBU = (claims) => {
    // Extract SBU from token claims or groups
    // This is simplified - implement based on your group mapping
    if (claims?.groups && Array.isArray(claims.groups)) {
      // Map group IDs to SBUs
      // Example: if (claims.groups.includes('group-id-for-775')) return '775';
    }

    // Default SBU
    return 'P90';
  };

  const login = async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      // Clear API client token
      delete apiClient.defaults.headers.common['Authorization'];

      // Logout from Entra ID
      await instance.logoutRedirect({
        account: accounts[0],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    accessToken,
    loading,
    login,
    logout,
    isAuthenticated,
    isProductManager: user?.role === 'PRODUCT_MANAGER',
    isPMOPS: user?.role === 'PM_OPS',
    isAdmin: user?.role === 'ADMIN',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### Update: `client/src/App.jsx`
```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { msalInstance } from './config/msalConfig';
import { AuthProvider } from './utils/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
// ... other imports

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route element={
              <AuthenticatedTemplate>
                <Layout />
              </AuthenticatedTemplate>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tickets" element={<TicketList />} />
              {/* ... other routes */}
            </Route>

            {/* Redirect unauthenticated users */}
            <Route path="*" element={
              <UnauthenticatedTemplate>
                <Navigate to="/login" replace />
              </UnauthenticatedTemplate>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </MsalProvider>
  );
}

export default App;
```

#### New File: `client/src/pages/Login.jsx`
```javascript
import React from 'react';
import { useAuth } from '../utils/AuthContext';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">NPDI Portal</h1>
          <p className="mt-2 text-sm text-gray-600">
            New Product Development & Introduction System
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <p className="text-sm text-gray-700 mb-6">
              Sign in with your Microsoft account to access the NPDI application
            </p>

            <button
              onClick={login}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21" fill="none">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              Sign in with Microsoft
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Secure authentication powered by Microsoft Entra ID
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
```

#### Update: `client/src/services/api.js`
Remove custom header logic - MSAL handles token automatically:

```javascript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token is set in AuthContext via:
// apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      // Redirect to login or refresh token
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## Testing Strategy

### Unit Tests

#### Backend JWT Validation
**File:** `server/tests/middleware/jwtAuth.test.js`
```javascript
const { authenticateJWT } = require('../../middleware/jwtAuth');
const jwt = require('jsonwebtoken');

describe('JWT Authentication Middleware', () => {
  it('should reject requests without token', async () => {
    const req = { headers: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await authenticateJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should reject invalid tokens', async () => {
    const req = {
      headers: { authorization: 'Bearer invalid-token' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await authenticateJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  // Add more tests...
});
```

### Integration Tests

#### Test Login Flow
```javascript
describe('Authentication Flow', () => {
  it('should redirect unauthenticated users to login', () => {
    // Visit protected page
    // Expect redirect to /login
  });

  it('should allow authenticated users to access protected pages', () => {
    // Mock MSAL authentication
    // Visit protected page
    // Expect successful access
  });

  it('should include Bearer token in API requests', () => {
    // Mock MSAL authentication
    // Make API request
    // Verify Authorization header
  });
});
```

### End-to-End Tests

#### User Flows
1. **Login Flow:**
   - Navigate to app
   - Click "Sign in with Microsoft"
   - Redirect to Microsoft login
   - Enter credentials
   - Redirect back to app
   - Verify user info displayed

2. **Protected Route Access:**
   - Attempt to access `/admin` as Product Manager
   - Verify 403 Forbidden

3. **Token Refresh:**
   - Wait for token to expire
   - Make API request
   - Verify automatic token refresh

4. **Logout Flow:**
   - Click logout button
   - Verify redirect to login page
   - Verify tokens cleared
   - Verify cannot access protected routes

### Manual Testing Checklist

- [ ] Admin user can log in
- [ ] PM-OPS user can log in
- [ ] Product Manager user can log in
- [ ] Correct role displayed in UI
- [ ] SBU restrictions enforced
- [ ] Create ticket with Entra auth
- [ ] Update ticket with Entra auth
- [ ] View tickets with Entra auth
- [ ] Add comment with Entra auth
- [ ] Permissions system works
- [ ] Token refresh works automatically
- [ ] Logout clears session
- [ ] Cannot access app after logout
- [ ] Cannot impersonate other users
- [ ] API requests authenticated correctly

---

## Migration Plan

### Pre-Migration (1 week before)

1. **Communication:**
   - Email all users about upcoming change
   - Explain new login process (Microsoft account)
   - Provide support contact information

2. **User Preparation:**
   - Ensure all users have Microsoft accounts
   - Assign users to correct Azure AD groups
   - Test with pilot users (2-3 people from each role)

3. **Environment Setup:**
   - Deploy to staging environment
   - Complete all testing
   - Prepare rollback scripts

### Migration Day

#### Phase 1: Dual Authentication (First 2 weeks)
**Configuration:**
```bash
ENABLE_ENTRA_AUTH=true
ENABLE_PROFILE_AUTH=true  # Keep legacy auth enabled
```

**Benefits:**
- Users can choose either method
- Fallback if issues occur
- Gradual transition

**Monitoring:**
- Track authentication method usage
- Monitor error rates
- Support tickets

#### Phase 2: Entra-Only (After 2 weeks)
**Configuration:**
```bash
ENABLE_ENTRA_AUTH=true
ENABLE_PROFILE_AUTH=false  # Disable legacy auth
```

**Before disabling:**
- [ ] All users successfully logged in with Entra ID
- [ ] No critical issues reported
- [ ] Usage of profile auth < 5%

### Data Migration

**User Records:**
```javascript
// Script: server/scripts/migrateUsersToEntraID.js
const User = require('../models/User');

async function migrateUsers() {
  const users = await User.find({});

  for (const user of users) {
    // Match user by email to get Azure Object ID
    // (requires Microsoft Graph API call or manual mapping)

    user.azureObjectId = 'lookup-from-azure';
    user.azureTenantId = process.env.AZURE_TENANT_ID;
    await user.save();

    console.log(`Migrated user: ${user.email}`);
  }
}
```

**Ticket History:**
- No migration needed
- Existing tickets remain unchanged
- New tickets use Entra ID authenticated users

---

## Rollback Strategy

### Immediate Rollback (< 1 hour after deployment)

**If critical issues occur:**

1. **Revert environment variables:**
```bash
ENABLE_ENTRA_AUTH=false
ENABLE_PROFILE_AUTH=true
```

2. **Restart services:**
```bash
pm2 restart npdi-backend
pm2 restart npdi-frontend
```

3. **Verify:**
- Profile selection page appears
- Users can log in with profiles
- All functionality works

**No data loss** - database unchanged

### Partial Rollback (After several hours)

**If some users have issues:**

1. **Enable dual auth:**
```bash
ENABLE_ENTRA_AUTH=true
ENABLE_PROFILE_AUTH=true
```

2. **Allow users to choose method**

3. **Investigate issues** with specific users/roles

### Full Rollback (After days/weeks)

**If fundamental issues found:**

1. **Revert code deployment**
```bash
git revert <entra-id-commits>
npm run build
pm2 restart all
```

2. **Remove Entra-specific code**

3. **Communicate to users**

4. **Post-mortem analysis**

---

## Security Considerations

### Token Security

**Storage:**
- ✅ Access tokens in memory only
- ✅ Refresh tokens in httpOnly cookies (if using)
- ✅ Never store tokens in localStorage (XSS risk)
- ✅ Use sessionStorage for short-term storage

**Transmission:**
- ✅ Always use HTTPS in production
- ✅ Tokens sent via Authorization header
- ✅ No tokens in URL parameters

**Expiration:**
- ✅ Short-lived access tokens (1 hour)
- ✅ Automatic token refresh
- ✅ Re-authentication after extended inactivity

### API Security

**Validation:**
- ✅ Verify token signature with JWKS
- ✅ Check token expiration
- ✅ Validate issuer and audience
- ✅ Verify required claims present

**Rate Limiting:**
- ✅ Limit login attempts
- ✅ Throttle API requests
- ✅ Monitor for suspicious activity

### User Provisioning

**Auto-Provisioning:**
- ✅ Create user record on first login
- ✅ Update user info from Entra ID
- ✅ Map roles from Azure AD groups
- ❌ Do not auto-grant admin privileges

**Deprovisioning:**
- ✅ Disable user when removed from Azure AD
- ✅ Maintain audit trail
- ✅ Transfer ownership of tickets

### Compliance

**Audit Logging:**
- ✅ Log all authentication attempts
- ✅ Log role changes
- ✅ Log privileged actions
- ✅ Retain logs per policy

**Data Privacy:**
- ✅ Minimal user data collected
- ✅ Comply with GDPR/privacy regulations
- ✅ Allow users to export their data
- ✅ Secure deletion of user data

---

## Timeline & Resources

### Estimated Timeline

| Phase | Duration | Effort (days) | Dependencies |
|-------|----------|---------------|--------------|
| 1. Preparation & Setup | 1 week | 3-5 | IT Admin, Azure access |
| 2. Backend Implementation | 1 week | 5-7 | Phase 1 complete |
| 3. Frontend Implementation | 1 week | 5-7 | Phase 2 complete |
| 4. Testing & UAT | 1 week | 3-5 | Phase 3 complete |
| 5. Production Deployment | 2-3 days | 2-3 | All testing passed |
| **Total** | **4 weeks** | **18-27 days** | |

### Resource Requirements

**Team:**
- 1 Backend Developer (80% time, 3 weeks)
- 1 Frontend Developer (80% time, 2 weeks)
- 1 Azure/IT Admin (20% time, ongoing)
- 1 QA Engineer (50% time, 1 week)
- 1 Product Owner (10% time, ongoing)

**Infrastructure:**
- Azure AD tenant (existing)
- App Registration in Azure (new)
- Dev/staging environments (existing)
- Production environment (existing)

**Budget:**
- $0 for Azure AD (included in Microsoft 365)
- Development time: 18-27 days
- Testing time: 3-5 days
- Support time: 5 days (post-deployment)

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Azure AD misconfiguration | Medium | High | Thorough testing, IT review |
| User adoption issues | Low | Medium | Training, documentation |
| Token refresh failures | Low | High | Extensive testing, monitoring |
| Performance degradation | Low | Medium | Load testing, caching |
| Rollback needed | Low | High | Dual auth mode, tested rollback |

---

## Next Steps

### Immediate Actions (This Week)

1. **Get Approvals:**
   - [ ] Technical review with development team
   - [ ] Security review with InfoSec
   - [ ] Budget approval (if needed)
   - [ ] Timeline approval from stakeholders

2. **IT Coordination:**
   - [ ] Schedule meeting with Azure/IT admin
   - [ ] Request App Registration creation
   - [ ] Request Azure AD group creation
   - [ ] Document access requirements

3. **Development Setup:**
   - [ ] Create feature branch: `feature/entra-id-auth`
   - [ ] Install development dependencies
   - [ ] Set up local environment variables
   - [ ] Review MSAL documentation

### Week 1 Deliverables

- [ ] Azure App Registration created
- [ ] Client ID and Tenant ID documented
- [ ] Azure AD groups created and populated
- [ ] Development environment configured
- [ ] Initial backend middleware coded
- [ ] Initial frontend MSAL integration coded

### Success Criteria

**Go-Live Criteria:**
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] UAT completed successfully
- [ ] Security review passed
- [ ] Performance tests passed
- [ ] Rollback procedure tested
- [ ] Documentation complete
- [ ] Support team trained

---

## Appendix

### A. Environment Variables Reference

**Backend `.env`:**
```bash
# Azure AD Configuration
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=xxx~xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AZURE_AUTHORITY=https://login.microsoftonline.com/{tenant-id}

# Feature Flags
ENABLE_ENTRA_AUTH=true
ENABLE_PROFILE_AUTH=false

# Application URLs
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/npdi

# Session
SESSION_SECRET=your-session-secret-here
```

**Frontend `.env`:**
```bash
REACT_APP_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
REACT_APP_AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
REACT_APP_AZURE_AUTHORITY=https://login.microsoftonline.com/{tenant-id}
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_REDIRECT_URI=http://localhost:3000
```

### B. Required npm Packages

**Backend:**
```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.2",
    "jwks-rsa": "^3.1.0",
    "passport": "^0.7.0",
    "passport-azure-ad": "^4.3.5",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "@types/jest": "^29.5.8"
  }
}
```

**Frontend:**
```json
{
  "dependencies": {
    "@azure/msal-browser": "^3.5.0",
    "@azure/msal-react": "^2.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0"
  }
}
```

### C. Useful Resources

- [Microsoft Entra ID Documentation](https://learn.microsoft.com/en-us/entra/identity/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Azure AD OAuth 2.0 Flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow)
- [JWT.io - Token Decoder](https://jwt.io/)
- [Microsoft Identity Platform Best Practices](https://learn.microsoft.com/en-us/entra/identity-platform/identity-platform-integration-checklist)

### D. Support Contacts

**During Implementation:**
- Development Team Lead: [Name/Email]
- Azure AD Admin: [Name/Email]
- InfoSec Contact: [Name/Email]

**Post-Deployment:**
- Help Desk: [Email/Phone]
- On-Call Developer: [Contact Info]
- Escalation: [Manager Contact]

---

**Document End**

*This implementation plan is a living document and will be updated as the project progresses.*
