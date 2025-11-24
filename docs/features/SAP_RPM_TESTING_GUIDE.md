# SAP RPM Integration - Testing Guide

> **⚠️ DEPRECATED** - Direct SAP RPM integration removed. Test scripts remain in `server/scripts/` for reference.

**Last Updated:** November 23, 2025
**For Project:** 100000000000000572302024
**SAP System:** sapprpap19.sial.com (RPM - Resource and Portfolio Management)

---

## Overview

This guide provides step-by-step instructions for testing the SAP RPM (Resource and Portfolio Management) integration with the NPDI Portal. Based on your actual SAP environment, we've updated the integration to work with SAP RPM instead of SAP Project System (PS).

---

## What Changed from Initial Plan

### Initial Plan (SAP Project System - PS)
- Target: SAP PS (Project System) with PROJ/PRPS tables
- OData API: `/sap/opu/odata4/sap/api_project/`
- URL Format: NWBC transaction CJ20N
- Host: sapprpap3.sial.com

### Updated Implementation (SAP RPM)
- **Target:** SAP RPM (Resource and Portfolio Management)
- **OData API:** `/sap/opu/odata/sap/RPM_ITEM_SRV/`
- **URL Format:** WebDynpro `rpm_item_details`
- **Host:** sapprpap19.sial.com
- **Project ID Format:** Long numeric (100000000000000572302024)
- **Identifiers:** GUIDs (object_guid, parent_guid, portfolio_guid)

### Your Real SAP URL
```
http://sapprpap19.sial.com:8083/sap/bc/webdynpro/sap/rpm_item_details?
  &sap-client=100
  &appl_type=RPM
  &object_guid=0517F09214541EEF97AFD2C8AD56CAA9
  &parent_guid=005056A554681ED5BDAF29EF2AE06D81
  &portfolio_guid=005056A554681ED5BDAE9EC36D5E2B90
  &object_type=RIH
  &parent_type=RPH
  &portal_role=RPM_ITEM
  &sap-wd-configid=RPM_ITEM_DETAILS_CFG
  &sap-language=EN
```

---

## Prerequisites

Before testing, ensure you have:

- [x] SAP RPM access credentials (username & password)
- [x] VPN connection to SAP network (required for API access)
- [x] SAP Project/Item ID: **100000000000000572302024**
- [x] SAP URL (provided above)
- [x] MongoDB running (`mongod` or MongoDB service)
- [x] Node.js environment set up
- [x] NPDI Portal application code

---

## Step 1: Configure SAP Credentials

### Option A: Using the Configuration Script (Recommended)

```bash
cd ~/npdi-app/server
node scripts/configureSAP.js
```

**Prompts and Suggested Values:**
```
SAP Host [sapprpap19.sial.com]: sapprpap19.sial.com
SAP Port [8083]: 8083
SAP Client [100]: 100
SAP Username []: M305853
SAP Password [***hidden***]: <enter your password>
Protocol (http/https) [http]: http
Application Type (RPM/PS) [RPM]: RPM
Enable SAP integration? (yes/no) [no]: yes
```

### Option B: Using MongoDB Shell

```bash
mongosh npdi-app

db.systemsettings.updateOne(
  {},
  {
    $set: {
      'integrations.sap.enabled': true,
      'integrations.sap.host': 'sapprpap19.sial.com',
      'integrations.sap.port': '8083',
      'integrations.sap.client': '100',
      'integrations.sap.username': 'M305853',
      'integrations.sap.password': '<YOUR_PASSWORD>',
      'integrations.sap.protocol': 'http',
      'integrations.sap.applicationType': 'RPM',
      'integrations.sap.timeout': 30
    }
  },
  { upsert: true }
)
```

**Note:** The password will be automatically encrypted when the application reads it.

### Option C: Using .env File (Development Only)

The `.env` file already has SAP configuration. Update the password:

```bash
nano ~/npdi-app/.env
```

```env
# SAP Connection (for OData services)
SAP_HOST=sapprpap19.sial.com
SAP_PORT=8083
SAP_CLIENT=100
SAP_USERNAME=M305853
SAP_PASSWORD=<YOUR_PASSWORD>
```

---

## Step 2: Test URL Parsing (No VPN Required)

This test verifies that the SAP RPM URL can be parsed correctly. **No VPN connection needed** for this test.

```bash
cd ~/npdi-app/server
node scripts/testSAPRPMUrlParser.js
```

**Expected Output:**
```
═══════════════════════════════════════════════════════════════
SAP RPM URL PARSER TEST
═══════════════════════════════════════════════════════════════

🔍 Test 1: Parsing SAP RPM URL...

✅ URL parsed successfully!

Extracted Information:
─────────────────────────────────────────────────────────────
Host:            sapprpap19.sial.com
Port:            8083
Protocol:        http
SAP Client:      100
Application:     RPM
Object Type:     RIH
Parent Type:     RPH

GUIDs:
Object GUID:     0517F09214541EEF97AFD2C8AD56CAA9
Parent GUID:     005056A554681ED5BDAF29EF2AE06D81
Portfolio GUID:  005056A554681ED5BDAE9EC36D5E2B90

🔗 Test 2: Linking Project by URL...

✅ Project linked successfully!

Project Data for ProductTicket:
─────────────────────────────────────────────────────────────
{
  "projectId": "100000000000000572302024",
  "projectName": "SAP RPM Item 100000000000000572302024",
  "objectGuid": "0517F09214541EEF97AFD2C8AD56CAA9",
  "parentGuid": "005056A554681ED5BDAF29EF2AE06D81",
  "portfolioGuid": "005056A554681ED5BDAE9EC36D5E2B90",
  "sapUrl": "http://sapprpap19.sial.com:8083/...",
  "lastSyncDate": "2025-11-23T21:09:14.513Z",
  "applicationType": "RPM"
}
─────────────────────────────────────────────────────────────

✅ TEST SUMMARY
   All tests completed successfully!
```

### Test with Your Own URL

```bash
node scripts/testSAPRPMUrlParser.js --project=100000000000000572302024 --url="<YOUR_SAP_URL>"
```

---

## Step 3: Test SAP API Connection (VPN Required)

**⚠️ Important:** You must be connected to the SAP VPN for this test to work.

### 3.1 Connect to SAP VPN

Connect to your corporate VPN that provides access to `sapprpap19.sial.com`.

### 3.2 Verify Network Connectivity

```bash
ping sapprpap19.sial.com
```

**Expected:** Should respond with ping times.

### 3.3 Test HTTP Connectivity

```bash
curl -I http://sapprpap19.sial.com:8083/
```

**Expected:** HTTP response (might be 401, 404, or 200 - any response means connectivity works).

### 3.4 Run SAP API Test Script

```bash
cd ~/npdi-app/server
node scripts/testSAPProjectAPI.js
```

**What This Tests:**
1. ✅ SAP integration enabled in settings
2. ✅ Connection to SAP OData metadata endpoint
3. ✅ Authentication with SAP credentials
4. ✅ Search for projects (if API available)

**Expected Successful Output:**
```
═══════════════════════════════════════════════════════════════
SAP PROJECT API TEST
═══════════════════════════════════════════════════════════════

📋 Test 1: Checking SAP Project Integration Status...

   Integration Enabled: ✅ Yes

📡 Test 2: Testing Connection to SAP Project API...

   ✅ Connected to SAP Project API at sapprpap19.sial.com:8083
   Response time: 1234ms
   API Version: OData v4

🔎 Test 4: Searching Projects for "NPDI"...

   ✅ Found 3 project(s) in 2345ms

✅ TEST SUMMARY
   All tests completed successfully!
```

### 3.5 Test with Specific Project

```bash
node scripts/testSAPProjectAPI.js --project=100000000000000572302024
```

---

## Step 4: Update Database Schema

Run the migration to add SAP project fields to ProductTicket documents:

```bash
cd ~/npdi-app/server
node migrations/add-sap-project-fields.js
```

**Expected Output:**
```
═══════════════════════════════════════════════════════════════
MIGRATION: Add SAP Project Fields to ProductTicket
═══════════════════════════════════════════════════════════════

✓ Connected to MongoDB

Found 45 ProductTicket documents

Adding SAP project fields to documents...

✓ Migration complete!
  Matched: 45 documents
  Modified: 45 documents

📋 Sample document after migration:
{
  "ticketNumber": "NPDI-2024-001",
  "sapProject": {
    "projectId": null,
    "wbsElement": null,
    "projectName": null,
    "systemStatus": null,
    "systemStatusText": null,
    "userStatus": null,
    "responsible": null,
    "startDate": null,
    "endDate": null,
    "lastSyncDate": null,
    "sapUrl": null,
    "autoSync": false,
    "objectGuid": null,
    "parentGuid": null,
    "portfolioGuid": null,
    "applicationType": "RPM"
  }
}

✅ Migration successful!
```

---

## Step 5: Verify Integration Components

### 5.1 Check Updated Files

```bash
# Check SystemSettings model has SAP config
grep -A 20 "sap:" ~/npdi-app/server/models/SystemSettings.js

# Check sapProjectService supports RPM
grep -A 10 "SAP RPM" ~/npdi-app/server/services/sapProjectService.js
```

### 5.2 List All SAP-Related Files

```bash
find ~/npdi-app -name "*sap*" -o -name "*SAP*" | grep -v node_modules
```

**Expected Files:**
```
server/services/sapProjectService.js
server/scripts/testSAPProjectAPI.js
server/scripts/testSAPRPMUrlParser.js
server/scripts/configureSAP.js
server/migrations/add-sap-project-fields.js
docs/features/SAP_NPDI_STATUS_INTEGRATION.md
docs/features/SAP_NPDI_QUICK_START.md
docs/features/SAP_NPDI_IMPLEMENTATION_SUMMARY.md
docs/features/SAP_RPM_TESTING_GUIDE.md (this file)
```

---

## Troubleshooting

### Issue: "SAP Project integration is not enabled"

**Solution:**
- Run configuration script: `node scripts/configureSAP.js`
- Verify settings in MongoDB: `db.systemsettings.findOne()`
- Ensure `integrations.sap.enabled` is `true`

### Issue: "Authentication failed" (HTTP 401)

**Solution:**
- Verify username/password are correct in System Settings
- Test credentials in SAP GUI first
- Check if password has expired
- Ensure password is not encrypted twice (shouldn't be, but verify)

### Issue: "Connection refused" (ECONNREFUSED)

**Solution:**
- **Connect to SAP VPN** (most common cause)
- Verify SAP server hostname: `ping sapprpap19.sial.com`
- Check firewall allows port 8083
- Test with curl: `curl http://sapprpap19.sial.com:8083/`

### Issue: "Service not found" (HTTP 404)

**Solution:**
- SAP RPM OData service may not be activated
- Contact SAP Basis team to activate `/sap/opu/odata/sap/RPM_ITEM_SRV`
- Verify service path in SAP transaction `SICF`
- Alternative: Use manual URL linking (doesn't require OData API)

### Issue: "Access forbidden" (HTTP 403)

**Solution:**
- User lacks authorization for OData services
- Contact SAP Security team
- Request authorization objects: `S_SERVICE`, `S_RFC`
- May need SAP role with RPM access

### Issue: MongoDB connection timeout

**Solution:**
- Ensure MongoDB is running: `systemctl status mongod`
- Start MongoDB: `sudo systemctl start mongod`
- Check connection string in `.env`: `MONGODB_URI=mongodb://localhost:27017/npdi-app`

---

## Next Steps After Successful Testing

Once all tests pass:

### 1. Update ProductTicket Model (server/models/ProductTicket.js)

Add to the schema:

```javascript
const productTicketSchema = new mongoose.Schema({
  // ... existing fields

  // SAP RPM Integration
  sapProject: {
    projectId: { type: String, default: null },
    wbsElement: { type: String, default: null },
    projectName: { type: String, default: null },
    systemStatus: { type: String, default: null },
    systemStatusText: { type: String, default: null },
    userStatus: { type: String, default: null },
    responsible: { type: String, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    lastSyncDate: { type: Date, default: null },
    sapUrl: { type: String, default: null },
    autoSync: { type: Boolean, default: false },
    // SAP RPM specific fields
    objectGuid: { type: String, default: null },
    parentGuid: { type: String, default: null },
    portfolioGuid: { type: String, default: null },
    applicationType: { type: String, enum: ['RPM', 'PS', 'NWBC'], default: 'RPM' }
  },

  // ... rest of schema
});
```

### 2. Create API Routes (server/routes/sapProjects.js)

```javascript
const express = require('express');
const router = express.Router();
const sapProjectService = require('../services/sapProjectService');
const ProductTicket = require('../models/ProductTicket');
const { authenticateJWT } = require('../middleware/auth');

// Link ticket to SAP project by URL
router.post('/link', authenticateJWT, async (req, res) => {
  try {
    const { ticketId, projectId, sapUrl } = req.body;

    // Parse URL and extract data
    const linkResult = await sapProjectService.linkProjectByUrl(projectId, sapUrl);

    if (!linkResult.success) {
      return res.status(400).json({ error: linkResult.error });
    }

    // Update ticket
    const ticket = await ProductTicket.findById(ticketId);
    ticket.sapProject = linkResult.data;
    await ticket.save();

    res.json({ success: true, sapProject: ticket.sapProject });
  } catch (error) {
    console.error('Error linking SAP project:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search SAP projects
router.get('/search', authenticateJWT, async (req, res) => {
  try {
    const { q } = req.query;
    const result = await sapProjectService.searchProjects(q, 10);
    res.json(result);
  } catch (error) {
    console.error('Error searching SAP projects:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test SAP connection
router.post('/test-connection', authenticateJWT, async (req, res) => {
  try {
    const result = await sapProjectService.testConnection();
    res.json(result);
  } catch (error) {
    console.error('Error testing SAP connection:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

Add to `server/index.js`:

```javascript
const sapProjectRoutes = require('./routes/sapProjects');
app.use('/api/sap-projects', sapProjectRoutes);
```

### 3. Frontend Components

Create these components:

#### `client/src/components/sap/SAPProjectLinkButton.jsx`

Button to link ticket to SAP project:

```jsx
import { useState } from 'react';
import { LinkIcon } from '@heroicons/react/24/outline';

function SAPProjectLinkButton({ ticketId, onLinked }) {
  const [showDialog, setShowDialog] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [sapUrl, setSapUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLink = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sap-projects/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, projectId, sapUrl })
      });

      const data = await response.json();

      if (data.success) {
        onLinked(data.sapProject);
        setShowDialog(false);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error linking SAP project: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowDialog(true)} className="btn-secondary">
        <LinkIcon className="w-5 h-5 mr-2" />
        Link to SAP
      </button>

      {showDialog && (
        <div className="modal">
          <h3>Link to SAP RPM Project</h3>
          <input
            type="text"
            placeholder="Project ID (e.g., 100000000000000572302024)"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          />
          <textarea
            placeholder="Paste SAP URL from browser..."
            value={sapUrl}
            onChange={(e) => setSapUrl(e.target.value)}
            rows={5}
          />
          <button onClick={handleLink} disabled={loading}>
            {loading ? 'Linking...' : 'Link Project'}
          </button>
        </div>
      )}
    </>
  );
}

export default SAPProjectLinkButton;
```

#### `client/src/components/sap/SAPProjectBadge.jsx`

Display SAP project link in ticket:

```jsx
import { ExternalLinkIcon } from '@heroicons/react/24/outline';

function SAPProjectBadge({ sapProject }) {
  if (!sapProject?.projectId) return null;

  return (
    <div className="sap-project-badge">
      <span className="text-sm font-medium">SAP RPM:</span>
      <a
        href={sapProject.sapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center text-blue-600 hover:text-blue-800"
      >
        {sapProject.projectId}
        <ExternalLinkIcon className="w-4 h-4 ml-1" />
      </a>
      {sapProject.systemStatus && (
        <span className="status-badge">{sapProject.systemStatusText}</span>
      )}
    </div>
  );
}

export default SAPProjectBadge;
```

### 4. Testing Frontend

1. Add `<SAPProjectLinkButton>` to ticket creation/edit forms
2. Add `<SAPProjectBadge>` to ticket details view
3. Test linking a ticket to your SAP project
4. Verify "View in SAP" button opens correct URL
5. Test with multiple tickets

---

## Summary Checklist

Use this checklist to track your testing progress:

### Configuration
- [ ] SAP credentials configured (via script or MongoDB)
- [ ] Settings verified: host, port, client, username, password
- [ ] Application type set to "RPM"
- [ ] Integration enabled

### Testing
- [ ] URL parser test passed (no VPN)
- [ ] VPN connected to SAP network
- [ ] Network connectivity verified (ping, curl)
- [ ] SAP API connection test passed
- [ ] Database migration completed

### Implementation
- [ ] ProductTicket model updated with sapProject schema
- [ ] API routes created (server/routes/sapProjects.js)
- [ ] Routes added to server/index.js
- [ ] Frontend components created
- [ ] End-to-end testing completed

### Deployment
- [ ] Tested with real SAP project (100000000000000572302024)
- [ ] Verified SAP URL opens correctly
- [ ] User acceptance testing
- [ ] Production deployment

---

## Support Resources

### Documentation
- **Main Integration Guide:** `docs/features/SAP_NPDI_STATUS_INTEGRATION.md`
- **Quick Start:** `docs/features/SAP_NPDI_QUICK_START.md`
- **Implementation Summary:** `docs/features/SAP_NPDI_IMPLEMENTATION_SUMMARY.md`
- **This Testing Guide:** `docs/features/SAP_RPM_TESTING_GUIDE.md`

### SAP Resources
- [SAP RPM Documentation](https://help.sap.com/docs/SAP_PROJECT_AND_PORTFOLIO_MANAGEMENT)
- [OData Protocol](http://www.odata.org/documentation/)
- [SAP API Business Hub](https://api.sap.com/)

### Getting Help
1. **SAP Basis Team:** For OData service activation (SICF)
2. **SAP Security Team:** For user authorizations
3. **Network Team:** For VPN/firewall issues
4. **Development Team:** For application integration issues

---

**Good luck with your testing!** 🎉

If you encounter any issues not covered in this guide, please document them for future reference.
