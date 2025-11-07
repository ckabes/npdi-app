# Microsoft Entra Application Proxy Implementation Plan
## Replacing Profile-Based Authentication with Enterprise SSO

**Document Version:** 1.0
**Date:** 2025-11-06
**Status:** Planning Phase
**Estimated Timeline:** 1-2 weeks
**Approach:** Entra Application Proxy (Reverse Proxy Authentication)

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
10. [Timeline & Resources](#timeline--resources)

---

## Executive Summary

### Objective
Replace the current profile-based authentication system with **Microsoft Entra Application Proxy** to provide:
- Real user authentication with corporate credentials
- Single Sign-On (SSO) with Microsoft 365
- Centralized user management via Entra ID
- **Minimal code changes** to the application
- **Fastest time to production** (1-2 weeks)

### What is Application Proxy?
Application Proxy is a **reverse proxy service** that sits in front of your application and handles all authentication **before** users reach NPDI. Your application simply reads user information from HTTP headers - no OAuth code required.

### Current State
- Users select from pre-defined development profiles
- No real authentication - headers sent to backend
- User data stored in `localStorage`
- Profile management via JSON file

### Target State
- Application Proxy intercepts all requests
- Users authenticate at Microsoft's login page
- Proxy passes user info via HTTP headers
- NPDI reads headers and creates/updates user sessions
- Zero OAuth code in the application

### Key Benefits
- ✅ **Fast Implementation**: 1-2 weeks (vs 3-4 weeks for MSAL)
- ✅ **Minimal Code Changes**: Just read headers (no OAuth libraries)
- ✅ **Centralized Management**: IT controls all access via Entra ID
- ✅ **Automatic MFA**: Entra ID policies apply automatically
- ✅ **No Token Management**: Proxy handles all authentication
- ✅ **Perfect for Internal Apps**: Designed for on-premises/intranet scenarios

### Trade-offs
- ⚠️ **Requires Entra ID Premium** (P1 or P2 licensing)
- ⚠️ **Requires Connector Agent** (Windows Server component)
- ⚠️ **Limited Graph API Access**: Harder to call Microsoft Graph later
- ⚠️ **Network Dependency**: Connector must be online

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

### Files Involved (Minimal Changes Required)

#### Backend
| File | Current Purpose | Changes Required |
|------|-----------------|------------------|
| `server/middleware/auth.js` | Profile header authentication | Add App Proxy header reading |
| `server/models/User.js` | User schema | Add `azureObjectId` field |
| `server/index.js` | Server entry point | No changes |

#### Frontend
| File | Current Purpose | Changes Required |
|------|-----------------|------------------|
| `client/src/utils/AuthContext.jsx` | Auth state management | Minimal - just read from proxy |
| `client/src/pages/ProfileSelection.jsx` | Profile picker | Remove (proxy handles login) |
| `client/src/App.jsx` | Route protection | Minimal updates |

**Note:** Most frontend code requires NO changes! Application Proxy handles authentication before React even loads.

### Current Limitations
- ❌ No password/authentication required
- ❌ Anyone can impersonate any user
- ❌ No session expiration
- ❌ No audit trail of who actually used the system
- ❌ Manual user management (JSON file)

---

## Target Architecture

### Authentication Flow (Application Proxy)
```
User → Visits NPDI URL → Redirect to Microsoft Login → User authenticates
                                                              ↓
                                            Entra ID validates credentials
                                                              ↓
                                Application Proxy receives auth confirmation
                                                              ↓
                            Proxy adds headers and forwards request to NPDI
                                                              ↓
                            NPDI backend reads headers and creates session
                                                              ↓
                                    User accesses application normally
```

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                  Microsoft Entra ID Tenant                   │
│                                                              │
│  ┌────────────────────┐      ┌──────────────────────────┐  │
│  │  User Accounts     │      │   Azure AD Groups        │  │
│  │                    │      │                          │  │
│  │  john@company.com  │◄─────┤  NPDI-Admins            │  │
│  │  sarah@company.com │      │  NPDI-PMOps             │  │
│  │  mike@company.com  │      │  NPDI-ProductManagers   │  │
│  └────────────────────┘      └──────────────────────────┘  │
│           │                                                  │
│           │ (authenticates)                                  │
│           ▼                                                  │
│  ┌─────────────────────────────────────────────────┐       │
│  │    OAuth 2.0 Authorization Endpoint             │       │
│  │    https://login.microsoftonline.com/{tenant}   │       │
│  └─────────────────────────────────────────────────┘       │
│           │                                                  │
└───────────┼──────────────────────────────────────────────────┘
            │ (returns auth token to proxy)
            ▼
┌─────────────────────────────────────────────────────────────┐
│           Microsoft Entra Application Proxy                  │
│                    (Azure Cloud Service)                     │
│                                                              │
│  - Pre-authenticates all requests                           │
│  - Adds HTTP headers with user info                         │
│  - Forwards authenticated requests to connector             │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        │ (encrypted tunnel)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Application Proxy Connector                     │
│         (Installed on Windows Server in your network)        │
│                                                              │
│  - Maintains outbound HTTPS connection to Azure             │
│  - Receives authenticated requests from proxy               │
│  - Forwards to local NPDI application                       │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        │ (local network)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    NPDI Application                          │
│                (http://localhost:5000)                       │
│                                                              │
│  Backend Middleware reads headers:                          │
│  ┌──────────────────────────────────────────────────┐      │
│  │  X-MS-CLIENT-PRINCIPAL-NAME: user@company.com    │      │
│  │  X-MS-CLIENT-PRINCIPAL-ID: {azure-object-id}     │      │
│  │  X-MS-CLIENT-PRINCIPAL-IDP: aad                  │      │
│  │  X-MS-CLIENT-PRINCIPAL-GROUPS: {group-ids}       │      │
│  └──────────────────────────────────────────────────┘      │
│                         ↓                                    │
│  Maps groups to NPDI roles (Admin, PM-OPS, PM)             │
│  Creates/updates user record in MongoDB                     │
│  Continues with normal request processing                   │
└─────────────────────────────────────────────────────────────┘
```

### Header Structure

Application Proxy adds these headers to **every** request:

```http
X-MS-CLIENT-PRINCIPAL-NAME: sarah.chen@company.com
X-MS-CLIENT-PRINCIPAL-ID: 550e8400-e29b-41d4-a716-446655440000
X-MS-CLIENT-PRINCIPAL-IDP: aad
X-MS-CLIENT-PRINCIPAL-GROUPS: 12345678-1234-1234-1234-123456789012,87654321-4321-4321-4321-210987654321
```

**Header Descriptions:**
- `X-MS-CLIENT-PRINCIPAL-NAME`: User's email address (UPN)
- `X-MS-CLIENT-PRINCIPAL-ID`: Azure AD Object ID (unique identifier)
- `X-MS-CLIENT-PRINCIPAL-IDP`: Identity provider (always "aad" for Azure AD)
- `X-MS-CLIENT-PRINCIPAL-GROUPS`: Comma-separated list of group Object IDs

---

## Prerequisites

### Entra ID Requirements

#### 1. Licensing
**Required:** Microsoft Entra ID Premium P1 or P2

**Check your licensing:**
- Azure Portal → Entra ID → Licenses
- Look for "Azure Active Directory Premium P1" or "P2"

**If you don't have it:**
- Contact Microsoft licensing team
- Or consider MSAL approach instead (no licensing required)

#### 2. Windows Server for Connector
**Required:** Windows Server to host the connector agent

**Specifications:**
- Windows Server 2012 R2 or later (2019/2022 recommended)
- Can be virtual machine
- Minimal resources: 2 CPU cores, 4GB RAM
- Outbound HTTPS (443) to Azure required
- Can be installed on same server as NPDI (if Windows-based)

**Multiple connectors recommended for production:**
- Install 2+ connectors for high availability
- Automatic failover if one connector is down

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
- Group Object IDs documented for role mapping

#### 4. Network Requirements
**Outbound connectivity from connector server:**
- HTTPS (443) to `*.msappproxy.net`
- HTTPS (443) to `*.servicebus.windows.net`
- HTTPS (443) to `login.microsoftonline.com`
- HTTPS (443) to `login.windows.net`

**No inbound ports required!** (Connector initiates all connections)

### Application Requirements

#### Backend Dependencies
**No new dependencies required!** Application Proxy works with existing code.

Optional enhancement:
```json
{
  "jsonwebtoken": "^9.0.2"  // Only if you want to create custom tokens
}
```

#### Frontend Dependencies
**No new dependencies required!** Application Proxy handles authentication before frontend loads.

### Environment Variables

**Backend** (`.env`):
```bash
# Azure AD Configuration (for role mapping)
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Group Object ID to Role Mapping
AZURE_GROUP_ADMIN=12345678-1234-1234-1234-123456789012
AZURE_GROUP_PMOPS=87654321-4321-4321-4321-210987654321
AZURE_GROUP_PM_775=abcdef12-abcd-abcd-abcd-123456789012
AZURE_GROUP_PM_P90=fedcba98-fedc-fedc-fedc-210987654321
AZURE_GROUP_PM_440=11111111-1111-1111-1111-111111111111
AZURE_GROUP_PM_P87=22222222-2222-2222-2222-222222222222
AZURE_GROUP_PM_P89=33333333-3333-3333-3333-333333333333
AZURE_GROUP_PM_P85=44444444-4444-4444-4444-444444444444

# Feature Flags (for migration)
ENABLE_APP_PROXY_AUTH=true
ENABLE_PROFILE_AUTH=false  # Set to true during migration period

# Application URLs
CLIENT_URL=https://npdi.yourcompany.com  # External URL from App Proxy
INTERNAL_URL=http://localhost:5000      # Internal URL for connector
```

**Frontend** - No changes needed! Application Proxy handles authentication before frontend loads.

---

## Implementation Phases

### Phase 1: IT Setup (Days 1-2)
**Effort:** 1-2 days (mostly waiting for IT)
**Risk:** Low

**Tasks:**
1. ✅ Verify Entra ID Premium licensing
2. ✅ Provision Windows Server for connector (if needed)
3. ✅ Install Application Proxy Connector (30 minutes)
4. ✅ Publish NPDI application via Application Proxy (30 minutes)
5. ✅ Configure pre-authentication and SSO (15 minutes)
6. ✅ Create Azure AD groups for role mapping (20 minutes)
7. ✅ Assign test users to groups (15 minutes)
8. ✅ Document external URL and group Object IDs

**Deliverables:**
- Connector installed and registered
- NPDI published with external URL (e.g., `https://npdi-company.msappproxy.net`)
- Group Object IDs documented
- Test users assigned

**Success Criteria:**
- Connector shows as "Active" in Azure Portal
- External URL accessible and redirects to Microsoft login
- User can authenticate and reach NPDI (even if app doesn't work yet)

### Phase 2: Backend Implementation (Days 3-4)
**Effort:** 2-3 days
**Risk:** Low

**Tasks:**
1. Create App Proxy authentication middleware
2. Create group-to-role mapping service
3. Update User model for Azure AD fields
4. Update authentication middleware to support dual-auth
5. Test header reading and user provisioning
6. Maintain backward compatibility (dual auth mode)

**Deliverables:**
- `server/middleware/appProxyAuth.js` - Header-based authentication
- `server/config/roleMapping.js` - Group to role mapping
- Updated `server/models/User.js`
- Updated `server/middleware/auth.js` - Dual auth support

**Success Criteria:**
- Backend reads headers correctly
- Users auto-created on first login
- Roles mapped correctly from groups
- Existing profile auth still works (for migration)

### Phase 3: Frontend Updates (Day 5)
**Effort:** 1 day
**Risk:** Low

**Tasks:**
1. Update AuthContext to detect App Proxy authentication
2. Remove/hide profile selection page
3. Update logout to redirect to Microsoft logout URL
4. Test user info display
5. Update routing for authenticated state

**Deliverables:**
- Updated `client/src/utils/AuthContext.jsx`
- Updated `client/src/App.jsx`
- Profile selection page disabled/removed

**Success Criteria:**
- Users redirected to Microsoft login
- User info displayed correctly after login
- Logout works properly
- No profile selection shown

### Phase 4: Testing & Migration (Days 6-7)
**Effort:** 2-3 days
**Risk:** Medium

**Tasks:**
1. End-to-end testing with real users
2. Test all user roles (Admin, PM-OPS, Product Manager)
3. Test SBU access restrictions
4. Performance testing
5. Security review of header validation
6. Create migration documentation
7. Prepare rollback procedure

**Deliverables:**
- Test plan and results document
- User acceptance testing (UAT) report
- Migration runbook
- Rollback procedure document

**Success Criteria:**
- All user flows working with App Proxy
- No security vulnerabilities found
- Performance meets requirements
- UAT passed with stakeholders
- Rollback tested successfully

### Phase 5: Production Deployment (Day 8)
**Effort:** 1 day
**Risk:** Medium

**Tasks:**
1. Update production environment variables
2. Deploy backend changes
3. Deploy frontend changes
4. Switch DNS/URL to Application Proxy external URL
5. Monitor error logs
6. User communication
7. Support period (1 week)

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

### Step 1: IT - Install Application Proxy Connector

**Azure Portal Steps:**
1. Navigate to: `Azure Portal → Entra ID → Application Proxy`
2. Click **"Download connector service"**
3. Copy downloaded installer to Windows Server
4. Run installer as Administrator
5. **Sign in** when prompted (use Global Admin or Application Admin account)
6. Connector automatically registers with your tenant
7. Verify connector status shows **"Active"**

**PowerShell Installation (Alternative):**
```powershell
# Download connector
$url = "https://download.msappproxy.net/Subscription/d3c8b69d-6bf7-42be-a529-3fe9c2e70c90/Connector/Download"
$output = "C:\Temp\MicrosoftEntraApplicationProxyConnectorInstaller.exe"
Invoke-WebRequest -Uri $url -OutFile $output

# Install silently (requires admin credentials)
Start-Process -FilePath $output -ArgumentList "/quiet" -Wait
```

**Verification:**
```powershell
# Check connector service is running
Get-Service -Name WAPConnectorUpdater
# Status should be "Running"
```

**Multiple Connectors (Production):**
- Repeat on 2+ servers for high availability
- Connectors automatically load-balance
- No additional configuration needed

---

### Step 2: IT - Publish NPDI Application

**Azure Portal Steps:**
1. Navigate to: `Azure Portal → Entra ID → Application Proxy → Applications`
2. Click **"New application"**
3. Fill in details:

**Basic Settings:**
```
Name: NPDI Portal
Internal URL: http://localhost:5000
External URL: https://npdi-yourcompany.msappproxy.net
Pre-authentication: Azure Active Directory
Connector group: Default (or create custom group)
```

**Additional Settings:**
```
Backend application timeout: Long (for file uploads)
Use HTTP-Only Cookie: No
Use Secure Cookie: Yes
Translate URLs in headers: Yes
Translate URLs in application body: No
```

4. Click **"Add"**
5. Note the **External URL** - this is what users will access

**Custom Domain (Optional):**
- Add custom domain: `https://npdi.company.com`
- Configure DNS CNAME: `npdi.company.com → npdi-yourcompany.msappproxy.net`
- Upload SSL certificate to Application Proxy

---

### Step 3: IT - Configure Single Sign-On

**Azure Portal Steps:**
1. Go to the published application → **Single sign-on**
2. Select **"Header-based"**
3. Configure headers:

**Headers to Send:**
```
Header Name                    | Attribute Source
------------------------------|------------------
X-MS-CLIENT-PRINCIPAL-NAME     | user.userprincipalname
X-MS-CLIENT-PRINCIPAL-ID       | user.objectid
X-MS-CLIENT-PRINCIPAL-IDP      | aad (constant)
X-MS-CLIENT-PRINCIPAL-GROUPS   | user.groups (requires Premium P1/P2)
```

4. Click **"Save"**

**Enable Group Claims:**
1. Go to application → **Token configuration**
2. Click **"Add groups claim"**
3. Select **"Security groups"**
4. In "ID" section, check **"Group ID"**
5. Click **"Add"**

---

### Step 4: IT - Assign Users and Groups

**Azure Portal Steps:**
1. Go to the published application → **Users and groups**
2. Click **"Add user/group"**
3. Select users or groups:
   - **NPDI-Admins** (group)
   - **NPDI-PMOps** (group)
   - **NPDI-ProductManagers-\*** (groups)
   - Or individual users for testing

4. Click **"Assign"**

**Important:** Only assigned users/groups can access the application!

---

### Step 5: Backend Implementation

#### File: `server/config/roleMapping.js`
```javascript
// Group Object ID to Role mapping
// Replace with actual group Object IDs from Azure AD

module.exports = {
  groupToRoleMap: {
    // Admin group
    [process.env.AZURE_GROUP_ADMIN]: {
      role: 'ADMIN',
      sbu: null
    },

    // PM-OPS group
    [process.env.AZURE_GROUP_PMOPS]: {
      role: 'PM_OPS',
      sbu: null
    },

    // Product Manager groups (by SBU)
    [process.env.AZURE_GROUP_PM_775]: {
      role: 'PRODUCT_MANAGER',
      sbu: '775'
    },
    [process.env.AZURE_GROUP_PM_P90]: {
      role: 'PRODUCT_MANAGER',
      sbu: 'P90'
    },
    [process.env.AZURE_GROUP_PM_440]: {
      role: 'PRODUCT_MANAGER',
      sbu: '440'
    },
    [process.env.AZURE_GROUP_PM_P87]: {
      role: 'PRODUCT_MANAGER',
      sbu: 'P87'
    },
    [process.env.AZURE_GROUP_PM_P89]: {
      role: 'PRODUCT_MANAGER',
      sbu: 'P89'
    },
    [process.env.AZURE_GROUP_PM_P85]: {
      role: 'PRODUCT_MANAGER',
      sbu: 'P85'
    }
  },

  /**
   * Map Azure AD groups to NPDI role
   * @param {string[]} groups - Array of group Object IDs
   * @returns {Object} { role, sbu }
   */
  mapGroupsToRole(groups) {
    if (!groups || !Array.isArray(groups)) {
      console.warn('No groups provided for role mapping');
      return { role: 'PRODUCT_MANAGER', sbu: 'P90' }; // Default
    }

    // Check each group against our mapping
    for (const groupId of groups) {
      if (this.groupToRoleMap[groupId]) {
        return this.groupToRoleMap[groupId];
      }
    }

    // Default if no mapping found
    console.warn(`No role mapping found for groups: ${groups.join(', ')}`);
    return { role: 'PRODUCT_MANAGER', sbu: 'P90' };
  }
};
```

#### File: `server/middleware/appProxyAuth.js`
```javascript
const User = require('../models/User');
const { mapGroupsToRole } = require('../config/roleMapping');

/**
 * Middleware to authenticate requests from Entra Application Proxy
 * Reads user information from HTTP headers added by the proxy
 */
const authenticateAppProxy = async (req, res, next) => {
  try {
    // Read headers added by Application Proxy
    const email = req.headers['x-ms-client-principal-name'];
    const azureObjectId = req.headers['x-ms-client-principal-id'];
    const idp = req.headers['x-ms-client-principal-idp'];
    const groupsHeader = req.headers['x-ms-client-principal-groups'];

    // Validate required headers
    if (!email || !azureObjectId) {
      console.error('Missing required Application Proxy headers');

      // If App Proxy auth is enabled but profile auth is also enabled, try profile auth
      if (process.env.ENABLE_PROFILE_AUTH === 'true') {
        return next(); // Let profile auth middleware handle it
      }

      return res.status(401).json({
        message: 'Access denied. Not authenticated via Application Proxy.',
        hint: 'Please access the application through the Application Proxy URL'
      });
    }

    // Verify identity provider is Azure AD
    if (idp && idp !== 'aad') {
      console.warn(`Unexpected identity provider: ${idp}`);
    }

    // Parse groups (comma-separated string)
    const groups = groupsHeader ? groupsHeader.split(',').map(g => g.trim()) : [];

    // Map Azure AD groups to NPDI roles
    const roleInfo = mapGroupsToRole(groups);

    console.log(`Application Proxy authentication for: ${email}, Role: ${roleInfo.role}, SBU: ${roleInfo.sbu}`);

    // Find or create user in database
    let user = await User.findOne({ email });

    if (!user) {
      // Auto-provision user from Application Proxy headers
      console.log(`Auto-provisioning new user from Application Proxy: ${email}`);

      // Extract first/last name from email or use defaults
      const nameParts = email.split('@')[0].split('.');
      const firstName = nameParts[0] ? capitalize(nameParts[0]) : 'User';
      const lastName = nameParts[1] ? capitalize(nameParts[1]) : 'Name';

      user = new User({
        email,
        firstName,
        lastName,
        role: roleInfo.role,
        sbu: roleInfo.sbu,
        azureObjectId,
        azureTenantId: process.env.AZURE_TENANT_ID,
        isActive: true,
      });
      await user.save();
      console.log(`User auto-provisioned successfully: ${email}`);
    } else {
      // Update user info from headers (in case role/group changed)
      let updated = false;

      if (user.role !== roleInfo.role) {
        console.log(`Updating user role: ${user.role} → ${roleInfo.role}`);
        user.role = roleInfo.role;
        updated = true;
      }

      if (user.sbu !== roleInfo.sbu) {
        console.log(`Updating user SBU: ${user.sbu} → ${roleInfo.sbu}`);
        user.sbu = roleInfo.sbu;
        updated = true;
      }

      if (!user.azureObjectId) {
        user.azureObjectId = azureObjectId;
        updated = true;
      }

      user.lastLogin = new Date();
      updated = true;

      if (updated) {
        await user.save();
      }
    }

    // Attach user to request (same format as profile auth)
    req.user = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      sbu: user.sbu,
      isActive: user.isActive,
      azureObjectId: user.azureObjectId,
      authenticatedVia: 'app-proxy'
    };

    next();
  } catch (error) {
    console.error('Application Proxy authentication error:', error);
    res.status(500).json({
      message: 'Internal server error during authentication',
      error: error.message
    });
  }
};

/**
 * Helper function to capitalize first letter
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

module.exports = {
  authenticateAppProxy
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
  // Azure AD fields for Application Proxy
  azureObjectId: {
    type: String,
    unique: true,
    sparse: true, // Allow null values, unique only when present
    index: true
  },
  azureTenantId: {
    type: String
  },
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
const { authenticateAppProxy } = require('./appProxyAuth');
const Permission = require('../models/Permission');

// Profile-based authentication (LEGACY - for migration only)
const authenticateProfile = async (req, res, next) => {
  // Only allow if explicitly enabled
  if (process.env.ENABLE_PROFILE_AUTH !== 'true') {
    return res.status(401).json({
      message: 'Profile authentication is disabled. Please use Application Proxy URL.'
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
      authenticatedVia: 'profile' // Mark as legacy auth
    };

    next();
  } catch (error) {
    console.error('Profile authentication error:', error);
    res.status(401).json({ message: 'Invalid profile data.' });
  }
};

// Main authentication middleware (supports both methods during migration)
const authenticate = async (req, res, next) => {
  // Try Application Proxy first
  if (process.env.ENABLE_APP_PROXY_AUTH === 'true') {
    return authenticateAppProxy(req, res, (err) => {
      if (err) return next(err);

      // If App Proxy auth succeeded, continue
      if (req.user) {
        return next();
      }

      // If App Proxy auth didn't set user and profile auth is enabled, try profile auth
      if (process.env.ENABLE_PROFILE_AUTH === 'true') {
        return authenticateProfile(req, res, next);
      }

      // No auth method succeeded
      return res.status(401).json({ message: 'Authentication required' });
    });
  }

  // Fall back to profile auth if App Proxy is disabled
  return authenticateProfile(req, res, next);
};

// ... rest of existing middleware (authorize, checkSBUAccess, etc.) remains unchanged

module.exports = {
  authenticate, // NEW: Unified auth
  authenticateProfile, // LEGACY
  authenticateAppProxy, // NEW
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

### Step 6: Frontend Updates (Minimal)

#### Update: `client/src/utils/AuthContext.jsx`
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user info from backend (which reads App Proxy headers)
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      // Backend reads headers from Application Proxy and returns user info
      const response = await apiClient.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Redirect to Application Proxy logout URL
    // This signs the user out of both NPDI and Microsoft
    const tenantId = process.env.REACT_APP_AZURE_TENANT_ID;
    const appProxyLogoutUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout`;
    window.location.href = appProxyLogoutUrl;
  };

  const value = {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
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

#### Add Backend Endpoint: `server/routes/auth.js` (NEW)
```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

/**
 * GET /auth/me
 * Returns current user info (from Application Proxy headers)
 */
router.get('/me', authenticate, (req, res) => {
  res.json({
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    role: req.user.role,
    sbu: req.user.sbu,
    authenticatedVia: req.user.authenticatedVia || 'app-proxy'
  });
});

module.exports = router;
```

#### Register Auth Routes: `server/index.js`
```javascript
// Add this with other route imports
const authRoutes = require('./routes/auth');

// Add this with other route registrations
app.use('/api/auth', authRoutes);
```

#### Update: `client/src/App.jsx`
```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';
import Layout from './components/Layout';
// ... other imports

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

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

  if (!isAuthenticated) {
    // User not authenticated - Application Proxy should have prevented this
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Authentication Required</h2>
          <p className="mt-2 text-gray-600">
            Please access this application through the Application Proxy URL
          </p>
        </div>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* All routes are protected by Application Proxy */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tickets" element={<TicketList />} />
            {/* ... other routes */}
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

---

## Testing Strategy

### Unit Tests

#### Backend Header Reading
**File:** `server/tests/middleware/appProxyAuth.test.js`
```javascript
const { authenticateAppProxy } = require('../../middleware/appProxyAuth');

describe('Application Proxy Authentication', () => {
  it('should read headers and create user object', async () => {
    const req = {
      headers: {
        'x-ms-client-principal-name': 'test@company.com',
        'x-ms-client-principal-id': '12345',
        'x-ms-client-principal-idp': 'aad',
        'x-ms-client-principal-groups': 'group1,group2'
      }
    };
    const res = {};
    const next = jest.fn();

    await authenticateAppProxy(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.email).toBe('test@company.com');
    expect(next).toHaveBeenCalled();
  });

  it('should reject requests without headers', async () => {
    const req = { headers: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    await authenticateAppProxy(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
```

### Integration Tests

#### Test Through Application Proxy
1. **Access external URL** (e.g., `https://npdi-yourcompany.msappproxy.net`)
2. **Verify redirect** to Microsoft login
3. **Enter credentials** for test user
4. **Verify redirect** back to NPDI
5. **Verify user info** displayed correctly

#### Test Role Mapping
- Log in as user in **NPDI-Admins** group → Should have Admin role
- Log in as user in **NPDI-PMOps** group → Should have PM-OPS role
- Log in as user in **NPDI-ProductManagers-775** → Should have Product Manager role with SBU 775

#### Test Auto-Provisioning
- Log in with user **not in database** → Should auto-create user record
- Check MongoDB for new user with correct role and SBU

### End-to-End Tests

#### User Flows
1. **Login Flow:**
   - Visit Application Proxy URL
   - Redirected to Microsoft login
   - Enter credentials
   - Redirected back to NPDI dashboard
   - User info displayed correctly

2. **Create Ticket:**
   - Navigate to Create Ticket
   - Fill in form
   - Submit
   - Verify ticket created with correct user attribution

3. **Role-Based Access:**
   - Admin can access admin panel
   - Product Manager cannot access admin panel (403)
   - SBU restrictions enforced

4. **Logout:**
   - Click logout button
   - Redirected to Microsoft logout
   - Cannot access NPDI without re-authenticating

### Manual Testing Checklist

- [ ] Admin user can log in
- [ ] PM-OPS user can log in
- [ ] Product Manager user can log in
- [ ] Correct role displayed in UI
- [ ] SBU restrictions enforced
- [ ] Create ticket with App Proxy auth
- [ ] Update ticket with App Proxy auth
- [ ] View tickets with App Proxy auth
- [ ] Add comment with App Proxy auth
- [ ] Permissions system works
- [ ] Logout signs out of Microsoft
- [ ] Cannot access after logout
- [ ] Cannot bypass auth by accessing internal URL
- [ ] Multiple tabs/windows work correctly
- [ ] Session persists across browser restarts

---

## Migration Plan

### Pre-Migration (1 week before)

1. **Communication:**
   - Email all users about upcoming change
   - Explain new login process (Microsoft account)
   - Provide Application Proxy external URL
   - Provide support contact information

2. **User Preparation:**
   - Ensure all users assigned to Azure AD groups
   - Test with pilot users (2-3 people from each role)
   - Verify Application Proxy URL accessible

3. **Environment Setup:**
   - Deploy to staging environment
   - Complete all testing
   - Prepare rollback scripts

### Migration Day

#### Option 1: Direct Cutover (Recommended for small teams)
**Timeline:** Immediate switch

1. **Deploy code** with App Proxy auth enabled, profile auth disabled
```bash
ENABLE_APP_PROXY_AUTH=true
ENABLE_PROFILE_AUTH=false
```

2. **Update DNS** to point to Application Proxy URL (if using custom domain)

3. **Communicate** new URL to users

4. **Monitor** for 24-48 hours

**Benefits:**
- Clean break, no confusion
- Users forced to use new auth immediately

**Risks:**
- If issues occur, users blocked until fix deployed

#### Option 2: Dual-Auth Mode (Safer for larger teams)
**Timeline:** 2-week overlap

**Week 1-2: Both methods available**
```bash
ENABLE_APP_PROXY_AUTH=true
ENABLE_PROFILE_AUTH=true  # Keep legacy auth enabled
```

- Provide both URLs (App Proxy + direct)
- Users gradually migrate to App Proxy URL
- Monitor usage of each method
- Support users having issues

**Week 3+: Application Proxy only**
```bash
ENABLE_APP_PROXY_AUTH=true
ENABLE_PROFILE_AUTH=false  # Disable legacy auth
```

- Disable profile auth when >95% using App Proxy
- Block direct internal URL access

**Benefits:**
- Safe transition, rollback easy
- Users can fall back if issues

**Risks:**
- Users may continue using old method
- Longer migration period

### Post-Migration

**Day 1-7:**
- Monitor authentication metrics
- Track error rates
- Respond to support tickets quickly

**Week 2+:**
- Disable profile auth completely
- Remove direct URL access
- Archive old profile code

---

## Rollback Strategy

### Immediate Rollback (< 1 hour after deployment)

**If critical issues occur:**

1. **Revert environment variables:**
```bash
ENABLE_APP_PROXY_AUTH=false
ENABLE_PROFILE_AUTH=true
```

2. **Restart services:**
```bash
pm2 restart npdi-backend
pm2 restart npdi-frontend
```

3. **Redirect users** back to direct URL (not App Proxy)

4. **Verify:**
- Profile selection page appears
- Users can log in with profiles
- All functionality works

**No data loss** - database unchanged, users preserved

### Partial Rollback (After several hours)

**If some users have issues:**

1. **Enable dual auth:**
```bash
ENABLE_APP_PROXY_AUTH=true
ENABLE_PROFILE_AUTH=true
```

2. **Provide both URLs** to users

3. **Investigate issues** with Application Proxy

4. **Fix and re-deploy** when ready

### Full Rollback (After days/weeks)

**If fundamental issues found:**

1. **Revert code deployment**
```bash
git revert <app-proxy-commits>
npm run build
pm2 restart all
```

2. **Remove Application Proxy** configuration (or leave for future)

3. **Communicate to users**

4. **Post-mortem analysis**

**Application Proxy Advantage:** Can leave proxy configured in Azure and try again later without reconfiguration

---

## Security Considerations

### Header Security

**Validation:**
- ✅ Verify headers come from Application Proxy (not user-supplied)
- ✅ Application Proxy strips any user-supplied X-MS-* headers
- ✅ Validate email format
- ✅ Validate Azure Object ID format

**Best Practice:**
```javascript
// Don't trust headers if not from Application Proxy
if (!req.headers['x-ms-client-principal-name']) {
  // Request not from Application Proxy - reject
}
```

### Network Security

**Block Direct Access:**
- ✅ Configure firewall to block direct access to internal URL
- ✅ Only allow connections from Application Proxy Connector
- ✅ Users must go through Application Proxy

**Connector Security:**
- ✅ Connector server hardened (latest patches, antivirus, etc.)
- ✅ Connector service runs as limited service account
- ✅ Outbound-only connections (no inbound ports)

### User Provisioning

**Auto-Provisioning:**
- ✅ Create user record on first login
- ✅ Update user info from headers on each request
- ✅ Map roles from Azure AD groups
- ❌ Do not auto-grant admin privileges

**Deprovisioning:**
- ✅ Remove user from Azure AD groups → loses access immediately
- ✅ Disable user in NPDI when removed from Azure AD
- ✅ Maintain audit trail
- ✅ Transfer ownership of tickets

### Compliance

**Audit Logging:**
- ✅ All authentication logged in Azure AD sign-in logs
- ✅ Log all role changes in NPDI
- ✅ Log privileged actions
- ✅ Retain logs per policy (Azure AD retains 30 days default)

**Data Privacy:**
- ✅ Minimal user data collected (name, email, role)
- ✅ Comply with GDPR/privacy regulations
- ✅ Allow users to export their data
- ✅ Secure deletion of user data

### MFA Enforcement

**Conditional Access:**
- ✅ Enforce MFA for NPDI application
- ✅ Configure in Azure Portal → Entra ID → Conditional Access
- ✅ Target "NPDI Portal" application
- ✅ Require MFA for all users or specific groups

**Example Policy:**
```
Name: Require MFA for NPDI
Users: All users (or specific group)
Cloud apps: NPDI Portal
Conditions: Any location
Grant: Require multi-factor authentication
```

---

## Timeline & Resources

### Estimated Timeline

| Phase | Duration | Effort (days) | Dependencies |
|-------|----------|---------------|--------------|
| 1. IT Setup | 2 days | 1 | IT Admin, Azure access, Windows Server |
| 2. Backend Implementation | 3 days | 2-3 | Phase 1 complete, group Object IDs |
| 3. Frontend Updates | 1 day | 1 | Phase 2 complete |
| 4. Testing & UAT | 2 days | 2-3 | Phase 3 complete |
| 5. Production Deployment | 1 day | 1 | All testing passed |
| **Total** | **9 days** | **7-9 days** | |

**Calendar Time:** 1-2 weeks (accounting for wait times, testing, etc.)

### Resource Requirements

**Team:**
- 1 Backend Developer (50% time, 1 week)
- 1 Frontend Developer (25% time, 2 days)
- 1 Azure/IT Admin (25% time, ongoing)
- 1 QA Engineer (50% time, 2 days)
- 1 Product Owner (10% time, ongoing)

**Infrastructure:**
- Azure AD Premium P1 or P2 (existing subscription)
- Windows Server for Connector (can be VM, minimal resources)
- Application Proxy service (included with Premium license)

**Budget:**
- $0 for Application Proxy (included in Entra ID Premium)
- Development time: 7-9 days
- Testing time: 2-3 days
- Support time: 3 days (post-deployment)

**Estimated Cost Savings vs MSAL:**
- 50% less development time (1-2 weeks vs 3-4 weeks)
- Simpler ongoing maintenance
- Less code to maintain

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Connector server downtime | Medium | High | Install 2+ connectors for redundancy |
| Header parsing errors | Low | High | Extensive testing, validation |
| User adoption issues | Low | Medium | Training, documentation, dual-auth mode |
| Group mapping errors | Medium | Medium | Thorough testing, default role fallback |
| License unavailability | Low | Critical | Verify Premium licensing before starting |
| Performance issues | Low | Low | Connector handles load well, minimal latency |

---

## Comparison: Application Proxy vs MSAL

### Quick Reference

| Aspect | Application Proxy ✅ | MSAL (Original Plan) |
|--------|---------------------|----------------------|
| **Implementation time** | 1-2 weeks | 3-4 weeks |
| **Code complexity** | Low | Medium-High |
| **Code changes** | Minimal (read headers) | Significant (OAuth flow) |
| **Licensing required** | Entra ID Premium | None (free tier works) |
| **Infrastructure** | Connector agent needed | None (cloud-native) |
| **Maintenance** | Low | Medium |
| **Future extensibility** | Limited | High (Graph API, etc.) |
| **Best for** | **Internal apps, quick win** | Modern cloud apps, advanced features |

### When to Use Application Proxy (This Plan)
✅ You want fastest implementation (1-2 weeks)
✅ You have Entra ID Premium licensing
✅ NPDI is internal/on-premises
✅ You don't need Graph API features immediately
✅ You want IT to control all access centrally

### When to Use MSAL Instead
✅ You need Microsoft Graph API (Teams direct messages, etc.)
✅ You don't have Premium licensing
✅ NPDI is cloud-hosted
✅ You want modern, maintainable OAuth 2.0 architecture
✅ You can wait 3-4 weeks

### Can I Migrate from App Proxy to MSAL Later?
**Yes!** Application Proxy is a great Phase 1:
- Get authentication working quickly (1-2 weeks)
- Evaluate if Graph API features are needed
- Migrate to MSAL when requirements justify it
- User experience remains identical (Microsoft login either way)

---

## Next Steps

### Immediate Actions (This Week)

1. **Verify Prerequisites:**
   - [ ] Confirm Entra ID Premium P1 or P2 licensing
   - [ ] Identify Windows Server for connector (or provision VM)
   - [ ] Verify outbound HTTPS (443) connectivity available
   - [ ] Check if Azure AD groups exist or need creation

2. **Get Approvals:**
   - [ ] Technical review with development team
   - [ ] Security review with InfoSec (simpler than MSAL)
   - [ ] Budget approval (no additional licensing if Premium exists)
   - [ ] Timeline approval from stakeholders

3. **IT Coordination:**
   - [ ] Send IT requirements document (separate doc)
   - [ ] Schedule connector installation (30 minutes)
   - [ ] Schedule application publishing (30 minutes)
   - [ ] Request Azure AD group Object IDs

4. **Development Setup:**
   - [ ] Create feature branch: `feature/app-proxy-auth`
   - [ ] Set up local environment variables
   - [ ] Review this implementation plan
   - [ ] Prepare for backend code changes

### Week 1 Deliverables

- [ ] Connector installed and active
- [ ] NPDI published via Application Proxy
- [ ] External URL documented
- [ ] Test users can authenticate
- [ ] Group Object IDs documented
- [ ] Backend middleware coded and tested
- [ ] Role mapping configured

### Success Criteria

**Go-Live Criteria:**
- [ ] Connector status shows "Active" in Azure Portal
- [ ] Test users can authenticate via App Proxy URL
- [ ] Headers read correctly by backend
- [ ] Roles mapped correctly from groups
- [ ] Auto-provisioning works (new users created)
- [ ] All unit tests passing
- [ ] UAT completed successfully
- [ ] Security review passed
- [ ] Rollback procedure tested
- [ ] Documentation complete

---

## Appendix

### A. Environment Variables Reference

**Backend `.env`:**
```bash
# Azure AD Configuration
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Group Object ID to Role Mapping
AZURE_GROUP_ADMIN=12345678-1234-1234-1234-123456789012
AZURE_GROUP_PMOPS=87654321-4321-4321-4321-210987654321
AZURE_GROUP_PM_775=abcdef12-abcd-abcd-abcd-123456789012
AZURE_GROUP_PM_P90=fedcba98-fedc-fedc-fedc-210987654321
AZURE_GROUP_PM_440=11111111-1111-1111-1111-111111111111
AZURE_GROUP_PM_P87=22222222-2222-2222-2222-222222222222
AZURE_GROUP_PM_P89=33333333-3333-3333-3333-333333333333
AZURE_GROUP_PM_P85=44444444-4444-4444-4444-444444444444

# Feature Flags
ENABLE_APP_PROXY_AUTH=true
ENABLE_PROFILE_AUTH=false

# Application URLs
CLIENT_URL=https://npdi.yourcompany.com  # Application Proxy external URL
INTERNAL_URL=http://localhost:5000      # Internal URL (for connector)

# MongoDB
MONGODB_URI=mongodb://localhost:27017/npdi
```

**Frontend `.env`:**
```bash
# Application Proxy external URL
REACT_APP_API_BASE_URL=https://npdi.yourcompany.com/api

# Azure tenant ID (for logout URL)
REACT_APP_AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### B. Required npm Packages

**Backend:**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.6.0",
    "dotenv": "^16.3.1"
  }
}
```

**No new dependencies required!** Application Proxy works with existing code.

**Frontend:**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0"
  }
}
```

**No new dependencies required!** Application Proxy handles authentication before React loads.

### C. Application Proxy Headers Reference

| Header Name | Description | Example Value |
|-------------|-------------|---------------|
| `X-MS-CLIENT-PRINCIPAL-NAME` | User's email/UPN | `sarah.chen@company.com` |
| `X-MS-CLIENT-PRINCIPAL-ID` | Azure AD Object ID | `550e8400-e29b-41d4-a716-446655440000` |
| `X-MS-CLIENT-PRINCIPAL-IDP` | Identity provider | `aad` |
| `X-MS-CLIENT-PRINCIPAL-GROUPS` | Group Object IDs (comma-separated) | `12345...,87654...` |

**Note:** Group header requires Entra ID Premium P1/P2 and group claims configuration.

### D. Useful Resources

- [Application Proxy Documentation](https://learn.microsoft.com/en-us/entra/identity/app-proxy/)
- [Install Application Proxy Connector](https://learn.microsoft.com/en-us/entra/identity/app-proxy/application-proxy-add-on-premises-application)
- [Header-Based SSO](https://learn.microsoft.com/en-us/entra/identity/app-proxy/application-proxy-configure-single-sign-on-with-headers)
- [Entra ID Premium Licensing](https://www.microsoft.com/en-us/security/business/microsoft-entra-pricing)
- [Conditional Access](https://learn.microsoft.com/en-us/entra/identity/conditional-access/)

### E. Support Contacts

**During Implementation:**
- Development Team Lead: [Name/Email]
- Azure AD Administrator: [Name/Email]
- InfoSec Contact: [Name/Email]

**Post-Deployment:**
- Help Desk: [Email/Phone]
- On-Call Developer: [Contact Info]
- Escalation: [Manager Contact]

---

## FAQ

**Q: Do we need to write OAuth code?**
**A:** No! Application Proxy handles all OAuth. You just read HTTP headers.

**Q: What if the connector server goes down?**
**A:** Install 2+ connectors for redundancy. Azure automatically fails over.

**Q: Can users bypass Application Proxy?**
**A:** Configure firewall to block direct access to internal URL. Force all traffic through proxy.

**Q: How does logout work?**
**A:** Redirect user to Microsoft logout URL. Signs out of both NPDI and Microsoft.

**Q: Can we use Application Proxy and MSAL together?**
**A:** Not recommended. Choose one approach. Application Proxy is faster/simpler. MSAL is more flexible.

**Q: What if we don't have Entra ID Premium?**
**A:** Use the MSAL approach instead (see alternate documentation). MSAL works with free Entra ID tier.

**Q: How much does Application Proxy cost?**
**A:** $0 additional cost if you have Entra ID Premium P1/P2. License cost varies by agreement.

**Q: Can Application Proxy work with cloud-hosted NPDI?**
**A:** Yes, but MSAL is better for cloud. Application Proxy designed for on-premises apps.

**Q: Do we need to open inbound firewall ports?**
**A:** No! Connector makes outbound-only connections. Very secure.

**Q: Can we test without affecting production?**
**A:** Yes! Publish a separate "NPDI-Staging" application in Application Proxy first.

---

**Document End**

*This implementation plan provides a streamlined path to enterprise authentication using Microsoft Entra Application Proxy. For questions or assistance, contact the NPDI development team.*

**Last Updated:** 2025-11-06
**Version:** 1.0 (Application Proxy Approach)
**Author:** NPDI Development Team
