# SAP NWBC NPDI Status Integration

> **⚠️ DEPRECATED** - Direct SAP integration removed. Use Palantir Foundry for SAP data access.

**Document Version:** 1.0
**Date:** November 23, 2025
**Purpose:** ~~Connect to SAP NetWeaver Business Client (NWBC) to retrieve NPDI project status~~ DEPRECATED

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [SAP Project System Architecture](#sap-project-system-architecture)
3. [Available SAP APIs](#available-sap-apis)
4. [Implementation Approaches](#implementation-approaches)
5. [Recommended Approach](#recommended-approach)
6. [Implementation Plan](#implementation-plan)
7. [Database Tables Reference](#database-tables-reference)
8. [Code Examples](#code-examples)
9. [Testing & Validation](#testing--validation)
10. [Troubleshooting](#troubleshooting)

---

## Executive Summary

### Goal
Integrate SAP NPDI project status into the NPDI Portal to:
- Display real-time NPDI project status from SAP
- Link ProductTickets to SAP Projects/WBS elements
- Sync status updates bidirectionally
- Provide "View in SAP" deep links to NWBC

### Current State
- ✅ SAP MARA data accessible via Palantir Foundry SQL API
- ✅ Authentication infrastructure in place
- ✅ Material import (MARA) working
- ❌ No NPDI project status integration
- ❌ No link to SAP Project System (PS)

### Target State
- ✅ Real-time NPDI project status from SAP
- ✅ Bidirectional sync of key fields
- ✅ Deep links to SAP NWBC for project details
- ✅ Status change notifications from SAP

---

## SAP Project System Architecture

### NPDI Project Structure in SAP

```
SAP Project System (PS)
│
├── Project Definition (PROJ table)
│   ├── Project ID (PSPNR)
│   ├── Project Name
│   ├── Status (via JEST/TJ02)
│   └── Dates
│
├── WBS Elements (PRPS table)
│   ├── WBS Element ID (PSPNR)
│   ├── Description
│   ├── Milestone
│   ├── Status (via JEST)
│   └── Responsible Person
│
└── Status Management
    ├── System Status (JEST table)
    ├── User Status (TJ30 status profile)
    └── Status Changes (JCDS table - audit trail)
```

### Key SAP Tables for NPDI

| Table | Description | Key Fields |
|-------|-------------|------------|
| **PROJ** | Standard Project Definition | PSPNR (Project ID), POST1 (Project Name), OBJNR (Object Number for status) |
| **PRPS** | WBS Element Master Data | PSPNR (WBS Element ID), POSID (WBS Element External ID), POST1 (Description), OBJNR |
| **JEST** | Individual Object Status | OBJNR, STAT (Status Code), INACT (Active/Inactive) |
| **JCDS** | Change Documents for Status | OBJNR, STAT, UDATE (Change Date), UNAME (User) |
| **TJ02** | System Status Texts | ISTAT (Status Code), TXT04 (Status Text) |
| **TJ30** | User Status Profile | STSMA (Status Profile), TXT30 (Description) |

### NPDI Project Workflow in SAP

```
1. Project Created → Status: CRTD (Created)
2. Planning Phase → Status: PCNF (Planning Confirmed)
3. Released → Status: REL (Released)
4. Processing → Status: PROC (In Process)
5. Completed → Status: TECO (Technically Complete)
6. Closed → Status: CLSD (Closed)
```

### Object Number (OBJNR) Structure

Format: `PR` + Project Number
Example: `PR00012345` (for Project 12345)

WBS Format: `PRXXXXXXXXXX` (where X is numeric)

---

## Available SAP APIs

### 1. SAP OData Services (Recommended)

**Project API v3** (`OP_API_PROJECT_V3_0001`)

**Base URL:** `https://<sap-host>:<port>/sap/opu/odata4/sap/api_project/srvd_a2x/sap/project/0001/`

**Capabilities:**
- ✅ Read project definitions
- ✅ Read WBS elements
- ✅ Read milestones
- ✅ Read status information
- ✅ Create/Update/Delete (if authorized)

**Entities:**
- `/Project` - Project definitions
- `/ProjectWBSElement` - WBS elements
- `/ProjectWBSElementMilestone` - Milestones
- `/ProjectStatus` - Project statuses

**Example Query:**
```
GET /sap/opu/odata4/sap/api_project/srvd_a2x/sap/project/0001/Project('PROJECT123')

Response:
{
  "ProjectID": "PROJECT123",
  "ProjectDescription": "NPDI-2024-001 - New Chemical Product",
  "ProjectStartDate": "2024-01-15",
  "ProjectEndDate": "2024-06-30",
  "SystemStatus": "REL",
  "UserStatus": "IN_PROGRESS"
}
```

### 2. SAP WBS Element OData Service

**Service:** `PS_WBSELEMENT_OVW_SRV`

**Note:** ⚠️ This is a Fiori service - SAP doesn't guarantee stability for reuse

**Entities:**
- `WBSElements` - WBS element data
- `WBSElementStatus` - Status information

### 3. Alternative: BAPI/RFC Calls

If OData is not available, use BAPI function modules:

| BAPI | Purpose |
|------|---------|
| `BAPI_PROJECT_GETINFO` | Get project master data |
| `BAPI_PS_INITIALIZATION` | Initialize PS session |
| `BAPI_BUS2001_GET_DETAIL` | Get WBS element details |
| `BAPI_BUS2054_GET_DETAIL` | Get project definition details |
| `STATUS_READ` | Read object status |

**Node.js RFC Library:** `node-rfc` (SAP NetWeaver RFC SDK wrapper)

### 4. Palantir SQL Query (Current Approach)

If NPDI project data is available in Palantir, query via SQL:

```sql
SELECT
  PROJECT_ID,
  PROJECT_NAME,
  WBS_ELEMENT,
  STATUS,
  RESPONSIBLE,
  START_DATE,
  END_DATE,
  MILESTONE
FROM `<palantir-dataset-rid>`
WHERE PROJECT_ID = 'PROJECT123'
```

---

## Implementation Approaches

### Approach 1: OData API v4 (Recommended) ⭐

**Pros:**
- ✅ Standard RESTful API
- ✅ JSON response format
- ✅ Well-documented
- ✅ No additional libraries needed
- ✅ Works over HTTP/HTTPS

**Cons:**
- ❌ Requires SAP Gateway activation
- ❌ Requires user permissions (OData access)
- ❌ May have rate limits

**Best For:** New integrations, cloud-first approach

### Approach 2: RFC/BAPI Calls

**Pros:**
- ✅ Direct SAP function module calls
- ✅ More control over data retrieval
- ✅ Can access complex transactions

**Cons:**
- ❌ Requires SAP NetWeaver RFC SDK
- ❌ More complex setup (sapnwrfc library)
- ❌ Firewall configuration for RFC ports
- ❌ License considerations

**Best For:** High-volume integrations, complex data needs

### Approach 3: Palantir SQL Query (Extend Current)

**Pros:**
- ✅ Already implemented for MARA
- ✅ Familiar authentication
- ✅ SQL query interface

**Cons:**
- ❌ Requires NPDI data to be synced to Palantir
- ❌ Not real-time (depends on Palantir refresh)
- ❌ Limited to read-only

**Best For:** Read-only status display, if data already in Palantir

### Approach 4: Web Scraping / Screen Scraping

**Pros:**
- ✅ Works if APIs unavailable

**Cons:**
- ❌ Fragile (breaks with UI changes)
- ❌ Not recommended
- ❌ Performance issues

**Best For:** Last resort only

---

## Recommended Approach

### Primary: OData API v4 + Fallback to Palantir

**Strategy:**
1. Use SAP Project OData API v4 for real-time project status
2. Fall back to Palantir SQL if OData unavailable
3. Build NWBC deep links regardless of data source

**Implementation Steps:**
1. Create `sapProjectService.js` (similar to `palantirService.js`)
2. Test connectivity to SAP OData Project API
3. Implement project status retrieval
4. Add ProductTicket schema fields for SAP project linking
5. Build UI components to display SAP status
6. Create "View in SAP" deep link button
7. (Optional) Implement status sync webhook

---

## Implementation Plan

### Phase 1: Discovery & Testing (Week 1)

**Tasks:**
1. ✅ Identify SAP Project System version (ECC vs S/4HANA)
2. ✅ Test OData API availability
3. ✅ Document sample project IDs for testing
4. ✅ Verify user permissions for OData access

**Deliverables:**
- SAP connectivity test results
- Sample project data
- API documentation

**Script:**
```bash
cd ~/npdi-app/server/scripts
node testSAPProjectAPI.js
```

### Phase 2: Backend Integration (Week 2)

**Tasks:**
1. Create `sapProjectService.js`
2. Implement authentication
3. Build query methods:
   - `getProjectById(projectId)`
   - `getProjectStatus(projectId)`
   - `searchProjects(query)`
4. Add error handling
5. Write unit tests

**Files to Create:**
- `server/services/sapProjectService.js`
- `server/scripts/testSAPProjectAPI.js`
- `server/controllers/sapProjectController.js`
- `server/routes/sapProjects.js`

### Phase 3: Database Schema Updates (Week 2)

**Tasks:**
1. Add SAP project fields to ProductTicket model
2. Create migration script
3. Update API responses

**Schema Changes:**
```javascript
// Add to ProductTicket model
sapProject: {
  projectId: String,              // SAP Project ID (e.g., "PROJECT123")
  wbsElement: String,             // WBS Element ID
  projectName: String,            // Project description from SAP
  systemStatus: String,           // SAP system status (REL, TECO, etc.)
  userStatus: String,             // SAP user status
  responsible: String,            // Project manager in SAP
  startDate: Date,                // Project start date
  endDate: Date,                  // Project end date
  lastSyncDate: Date,             // Last time synced from SAP
  sapUrl: String                  // Deep link to SAP NWBC
}
```

### Phase 4: Frontend Components (Week 3)

**Tasks:**
1. Create SAP status badge component
2. Add "Link to SAP Project" UI in ticket form
3. Build SAP project search popup
4. Display SAP status in ticket details
5. Add "View in SAP" button with deep link

**Components:**
- `SAPProjectBadge.jsx` - Display SAP status with color coding
- `SAPProjectLinkPopup.jsx` - Search and link SAP projects
- `SAPStatusSync.jsx` - Manual/auto sync button

### Phase 5: Deep Links to NWBC (Week 3)

**Tasks:**
1. Generate NWBC URLs
2. Test deep link navigation
3. Add "View in SAP" button

**NWBC URL Patterns:**

**For Projects:**
```
https://<sap-host>:<port>/sap/bc/gui/sap/its/webgui?~transaction=CJ20N&~OKCode=/00&P_PSP_PNR=<PROJECT_ID>
```

**For WBS Elements:**
```
https://<sap-host>:<port>/sap/bc/gui/sap/its/webgui?~transaction=CJ20N&~OKCode=/00&P_PSP_PNR=<WBS_ELEMENT>
```

**Example:**
```javascript
const buildSAPLink = (projectId) => {
  const sapHost = 'sapprpap3.sial.com';
  const sapPort = '8083';
  return `https://${sapHost}:${sapPort}/sap/bc/gui/sap/its/webgui?~transaction=CJ20N&~OKCode=/00&P_PSP_PNR=${projectId}`;
};
```

### Phase 6: Testing & Validation (Week 4)

**Tasks:**
1. End-to-end testing
2. Performance testing
3. Error scenario testing
4. User acceptance testing

**Test Scenarios:**
- Link ticket to SAP project
- Display SAP status
- Deep link navigation
- Sync status from SAP
- Handle SAP API errors

### Phase 7: Documentation & Training (Week 4)

**Tasks:**
1. Update maintenance guide
2. Create user documentation
3. Train PM and PM Ops teams

---

## Database Tables Reference

### How to Find NPDI Project Status

**Step 1: Find Project Object Number**
```sql
SELECT PSPNR, POST1, OBJNR
FROM PROJ
WHERE PSPNR LIKE '%NPDI%'
  OR POST1 LIKE '%New Product%'
```

**Step 2: Get Status from JEST**
```sql
SELECT J.OBJNR, J.STAT, T.TXT04 as STATUS_TEXT, J.INACT
FROM JEST J
INNER JOIN TJ02 T ON J.STAT = T.ISTAT
WHERE J.OBJNR = 'PR00012345'
  AND J.INACT = '' -- Active statuses only
```

**Step 3: Get WBS Elements**
```sql
SELECT PSPNR, POSID, POST1, OBJNR
FROM PRPS
WHERE PSPHI = '00012345' -- Parent project number
ORDER BY POSID
```

**Step 4: Get Status Change History**
```sql
SELECT OBJNR, STAT, UDATE, UTIME, UNAME, CHIND
FROM JCDS
WHERE OBJNR = 'PR00012345'
ORDER BY UDATE DESC, UTIME DESC
```

### Palantir SQL Query (if data available)

```sql
-- Assuming NPDI project data is synced to Palantir
SELECT
  P.PROJECT_ID,
  P.PROJECT_NAME,
  P.SYSTEM_STATUS,
  P.USER_STATUS,
  W.WBS_ELEMENT,
  W.WBS_DESCRIPTION,
  W.RESPONSIBLE
FROM `<project-dataset-rid>` P
LEFT JOIN `<wbs-dataset-rid>` W ON P.PROJECT_ID = W.PROJECT_ID
WHERE P.PROJECT_ID = 'PROJECT123'
```

---

## Code Examples

### 1. SAP Project Service

**File:** `server/services/sapProjectService.js`

```javascript
const axios = require('axios');
const SystemSettings = require('../models/SystemSettings');

class SAPProjectService {
  constructor() {
    this.settings = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async loadSettings() {
    this.settings = await SystemSettings.getSettings();
    return this.settings;
  }

  async isEnabled() {
    const settings = await this.loadSettings();
    return (
      settings?.integrations?.sap?.enabled === true &&
      settings?.integrations?.sap?.username?.length > 0 &&
      settings?.integrations?.sap?.password?.length > 0
    );
  }

  async getConfig() {
    const settings = await this.loadSettings();
    const sapConfig = settings?.integrations?.sap;

    if (!sapConfig) {
      throw new Error('SAP configuration not found');
    }

    return {
      host: sapConfig.host || 'sapprpap3.sial.com',
      port: sapConfig.port || '8083',
      client: sapConfig.client || '100',
      username: sapConfig.username,
      password: settings.getDecryptedSAPPassword(),
      protocol: sapConfig.protocol || 'http'
    };
  }

  /**
   * Get Project by ID using OData API v4
   */
  async getProjectById(projectId) {
    try {
      const config = await this.getConfig();

      const url = `${config.protocol}://${config.host}:${config.port}/sap/opu/odata4/sap/api_project/srvd_a2x/sap/project/0001/Project('${projectId}')`;

      console.log(`[SAP Project Service] Fetching project: ${projectId}`);
      console.log(`[SAP Project Service] URL: ${url}`);

      const response = await axios.get(url, {
        auth: {
          username: config.username,
          password: config.password
        },
        params: {
          'sap-client': config.client
        },
        headers: {
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      return {
        success: true,
        project: this.transformProjectData(response.data)
      };

    } catch (error) {
      console.error('[SAP Project Service] Error:', error.message);

      if (error.response?.status === 404) {
        return {
          success: false,
          error: `Project ${projectId} not found in SAP`
        };
      }

      throw error;
    }
  }

  /**
   * Get Project Status
   */
  async getProjectStatus(projectId) {
    try {
      const projectData = await this.getProjectById(projectId);

      if (!projectData.success) {
        return projectData;
      }

      return {
        success: true,
        status: {
          systemStatus: projectData.project.systemStatus,
          userStatus: projectData.project.userStatus,
          statusText: this.getStatusText(projectData.project.systemStatus)
        }
      };

    } catch (error) {
      console.error('[SAP Project Service] Status fetch error:', error);
      throw error;
    }
  }

  /**
   * Search Projects by Name or ID
   */
  async searchProjects(query, maxResults = 10) {
    try {
      const config = await this.getConfig();

      const url = `${config.protocol}://${config.host}:${config.port}/sap/opu/odata4/sap/api_project/srvd_a2x/sap/project/0001/Project`;

      const response = await axios.get(url, {
        auth: {
          username: config.username,
          password: config.password
        },
        params: {
          'sap-client': config.client,
          '$filter': `contains(ProjectDescription,'${query}') or contains(ProjectID,'${query}')`,
          '$top': maxResults,
          '$select': 'ProjectID,ProjectDescription,SystemStatus,ProjectStartDate,ProjectEndDate'
        },
        headers: {
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      return {
        success: true,
        projects: response.data.value.map(p => this.transformProjectData(p))
      };

    } catch (error) {
      console.error('[SAP Project Service] Search error:', error);
      throw error;
    }
  }

  /**
   * Transform SAP API response to application format
   */
  transformProjectData(sapData) {
    return {
      projectId: sapData.ProjectID,
      projectName: sapData.ProjectDescription,
      systemStatus: sapData.SystemStatus,
      userStatus: sapData.UserStatus,
      startDate: sapData.ProjectStartDate,
      endDate: sapData.ProjectEndDate,
      responsible: sapData.ResponsiblePerson,
      sapUrl: this.buildSAPLink(sapData.ProjectID)
    };
  }

  /**
   * Build deep link to SAP NWBC
   */
  buildSAPLink(projectId) {
    const config = this.settings?.integrations?.sap || {};
    const host = config.host || 'sapprpap3.sial.com';
    const port = config.port || '8083';

    return `https://${host}:${port}/sap/bc/gui/sap/its/webgui?~transaction=CJ20N&~OKCode=/00&P_PSP_PNR=${projectId}`;
  }

  /**
   * Get human-readable status text
   */
  getStatusText(systemStatus) {
    const statusMap = {
      'CRTD': 'Created',
      'REL': 'Released',
      'PCNF': 'Planning Confirmed',
      'PROC': 'In Process',
      'TECO': 'Technically Complete',
      'CLSD': 'Closed',
      'DLT': 'Deleted',
      'LKD': 'Locked'
    };

    return statusMap[systemStatus] || systemStatus;
  }
}

module.exports = new SAPProjectService();
```

### 2. Test Script

**File:** `server/scripts/testSAPProjectAPI.js`

```javascript
require('dotenv').config();
const sapProjectService = require('../services/sapProjectService');

async function testSAPProjectAPI() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('SAP PROJECT API TEST');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Test 1: Check if enabled
    const enabled = await sapProjectService.isEnabled();
    console.log(`✓ SAP integration enabled: ${enabled}\n`);

    if (!enabled) {
      console.log('⚠️  SAP integration is disabled. Enable in System Settings.');
      return;
    }

    // Test 2: Get project by ID (use real project ID from your SAP system)
    const testProjectId = 'PROJECT123'; // Replace with real ID
    console.log(`Testing getProjectById('${testProjectId}')...`);

    const projectResult = await sapProjectService.getProjectById(testProjectId);

    if (projectResult.success) {
      console.log('✓ Project retrieved successfully!');
      console.log('Project Data:', JSON.stringify(projectResult.project, null, 2));
    } else {
      console.log('✗ Failed:', projectResult.error);
    }

    // Test 3: Search projects
    console.log('\nTesting searchProjects("NPDI")...');
    const searchResult = await sapProjectService.searchProjects('NPDI', 5);

    if (searchResult.success) {
      console.log(`✓ Found ${searchResult.projects.length} projects`);
      searchResult.projects.forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.projectId} - ${p.projectName}`);
        console.log(`   Status: ${p.systemStatus} (${sapProjectService.getStatusText(p.systemStatus)})`);
        console.log(`   SAP Link: ${p.sapUrl}`);
      });
    }

  } catch (error) {
    console.error('\n✗ Test failed:', error.message);

    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Error Details:', error.response.data);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
}

testSAPProjectAPI();
```

### 3. API Route

**File:** `server/routes/sapProjects.js`

```javascript
const express = require('express');
const router = express.Router();
const sapProjectService = require('../services/sapProjectService');

/**
 * GET /api/sap-projects/:projectId
 * Get SAP project by ID
 */
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await sapProjectService.getProjectById(projectId);

    if (result.success) {
      res.json(result.project);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error fetching SAP project:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sap-projects/:projectId/status
 * Get project status only
 */
router.get('/:projectId/status', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await sapProjectService.getProjectStatus(projectId);

    if (result.success) {
      res.json(result.status);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error fetching SAP project status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sap-projects/search?q=query
 * Search projects
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const result = await sapProjectService.searchProjects(q, parseInt(limit));

    if (result.success) {
      res.json(result.projects);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error searching SAP projects:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 4. Frontend Component

**File:** `client/src/components/admin/SAPProjectLinkPopup.jsx`

```jsx
import React, { useState } from 'react';
import { MagnifyingGlassIcon, LinkIcon, ExternalLinkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const SAPProjectLinkPopup = ({ onClose, onSelect, currentProjectId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/sap-projects/search`, {
        params: { q: searchQuery, limit: 10 }
      });

      setProjects(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to search SAP projects');
      console.error('SAP search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (project) => {
    onSelect(project);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center">
              <LinkIcon className="w-6 h-6 mr-2" />
              Link to SAP Project
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by Project ID or Name (e.g., NPDI, PROJECT123)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
            >
              <MagnifyingGlassIcon className="w-5 h-5 mr-1" />
              Search
            </button>
          </div>

          {currentProjectId && (
            <p className="mt-2 text-sm text-gray-600">
              Currently linked: <strong>{currentProjectId}</strong>
            </p>
          )}
        </div>

        {/* Results */}
        <div className="p-6 overflow-y-auto max-h-96">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Searching SAP...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && projects.length === 0 && searchQuery && (
            <div className="text-center py-8 text-gray-500">
              No projects found matching "{searchQuery}"
            </div>
          )}

          {!loading && projects.length > 0 && (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.projectId}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                  onClick={() => handleSelect(project)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {project.projectId}
                      </h3>
                      <p className="text-gray-700 mt-1">{project.projectName}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span>Status: <strong>{project.systemStatus}</strong></span>
                        {project.startDate && (
                          <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                        )}
                        {project.responsible && (
                          <span>PM: {project.responsible}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={project.sapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLinkIcon className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SAPProjectLinkPopup;
```

---

## Testing & Validation

### Testing Checklist

- [ ] SAP OData API connectivity test passes
- [ ] Can retrieve project by ID
- [ ] Can search projects by name
- [ ] Can retrieve project status
- [ ] Deep link opens correct project in NWBC
- [ ] Error handling works (404, 401, timeout)
- [ ] Performance acceptable (<2 seconds for project lookup)
- [ ] Data transformation correct
- [ ] Frontend displays SAP status correctly
- [ ] Link/unlink project works
- [ ] Status sync button works

### Test Data

**Sample Project IDs** (update with real data from your SAP):
- `PROJECT001` - Test project 1
- `NPDI-2024-001` - NPDI project example
- `WBS-123456` - WBS element example

---

## Troubleshooting

### Common Issues

**1. 401 Unauthorized**
- Verify SAP username/password in System Settings
- Check if password expired in SAP
- Verify user has OData access permissions

**2. 404 Not Found - Service**
- OData service not activated in transaction SICF
- Contact SAP Basis to activate `/sap/opu/odata4/sap/api_project`

**3. 404 Not Found - Project**
- Project ID doesn't exist
- User doesn't have authorization to view project
- Try different project ID format (with/without leading zeros)

**4. 403 Forbidden**
- User lacks authorization for OData service
- Request authorization role from SAP Basis
- Check authorization object: `S_PROJECT`, `S_DEVELOP`

**5. Connection Timeout**
- Check network connectivity to SAP server
- Verify firewall allows HTTP/HTTPS on port 8083
- Increase timeout setting

**6. CORS Errors**
- Add SAP host to CORS whitelist in `server/index.js`
- Configure SAP ICF service to allow CORS

---

## Next Steps

1. **Immediate:** Run `testSAPConnectivity.js` to check current SAP access
2. **Week 1:** Work with SAP Basis to activate OData services
3. **Week 2:** Implement `sapProjectService.js` and test
4. **Week 3:** Build frontend components
5. **Week 4:** Deploy and train users

---

## Additional Resources

- [SAP API Business Hub - Project API](https://api.sap.com/api/OP_API_PROJECT_V3_0001/overview)
- [SAP Project System (PS) Tables](https://www.sap-ps.net/sap-ps-tables)
- [SAP OData v4 Documentation](https://help.sap.com/docs/SAP_NETWEAVER_750/68bf513362174d54b58cddec28794093/5de7d6b21d53414da84e75fc65c1a1df.html)
- [SAP NetWeaver Gateway Documentation](https://help.sap.com/docs/SAP_NETWEAVER_750/e7c12de77eb94b97becd0e6d0f2c9c09/7e4b3b12e22946868b3e0f96ea7b75ab.html)

---

**Document Prepared By:** Claude AI Assistant
**For:** NPDI Application - SAP Integration
**Version:** 1.0
**Last Updated:** November 23, 2025
