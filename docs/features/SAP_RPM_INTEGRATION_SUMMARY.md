# SAP RPM Integration - Implementation Summary

> **⚠️ DEPRECATED - INTEGRATION REMOVED**
>
> **Date Deprecated:** 2025-11-23
>
> This direct SAP RPM/PS integration has been removed from the application.
> SAP MARA data access is now handled exclusively through **Palantir Foundry**.
>
> See: [Palantir SQL Query API Integration Guide](../Palantir-SQL-Query-API-Integration-Guide.md)
>
> Test scripts remain available in `server/scripts/testSAP*.js` for reference.

**Date:** November 23, 2025
**Status:** ~~Ready for Testing~~ DEPRECATED
**Priority:** ~~High~~ N/A
**SAP System:** RPM (Resource and Portfolio Management)

---

## Executive Summary

I've successfully updated the SAP integration to work with **SAP RPM (Resource and Portfolio Management)** instead of the initially planned SAP Project System (PS). This change was made based on your actual SAP environment using:

- **SAP Host:** sapprpap19.sial.com
- **Project Number:** 100000000000000572302024
- **Application:** SAP RPM WebDynpro (`rpm_item_details`)

The integration now supports:
1. ✅ Parsing SAP RPM WebDynpro URLs to extract project information
2. ✅ Linking NPDI tickets to SAP RPM items
3. ✅ Storing SAP project metadata (GUIDs, URLs, status)
4. ✅ Deep linking from tickets to SAP RPM items
5. ✅ Future support for status synchronization (if OData API available)

---

## What Changed from Original Plan

### Original Plan: SAP Project System (PS)
Based on initial research, the integration was designed for:
- SAP PS (Project System) module
- OData API v4: `/sap/opu/odata4/sap/api_project/`
- NWBC transaction CJ20N
- Host: sapprpap3.sial.com

### Updated Implementation: SAP RPM
Based on your actual SAP URL, the integration now supports:
- **SAP RPM** (Resource and Portfolio Management)
- **WebDynpro** application: `rpm_item_details`
- **OData API:** `/sap/opu/odata/sap/RPM_ITEM_SRV/` (optional)
- **Host:** sapprpap19.sial.com
- **Identifiers:** GUIDs instead of simple Project IDs

---

## Files Created/Updated

### New Files Created (4 files)

#### 1. `server/scripts/configureSAP.js`
Interactive script to configure SAP credentials in SystemSettings.

**Usage:**
```bash
node scripts/configureSAP.js
```

**Features:**
- Shows current SAP configuration
- Prompts for new settings interactively
- Encrypts password automatically
- Validates configuration

#### 2. `server/scripts/testSAPRPMUrlParser.js`
Test script for SAP RPM URL parsing and project linking.

**Usage:**
```bash
node scripts/testSAPRPMUrlParser.js
node scripts/testSAPRPMUrlParser.js --url="<YOUR_SAP_URL>"
```

**Features:**
- Parses SAP RPM WebDynpro URLs
- Extracts GUIDs (object_guid, parent_guid, portfolio_guid)
- Tests project linking functionality
- Generates new SAP URLs from GUIDs
- **No VPN required** (URL parsing only)

**Test Results:**
```
✅ Test 1: URL Parsing - PASSED
✅ Test 2: Project Linking - PASSED
   Extracted Project Data:
   {
     "projectId": "100000000000000572302024",
     "objectGuid": "0517F09214541EEF97AFD2C8AD56CAA9",
     "parentGuid": "005056A554681ED5BDAF29EF2AE06D81",
     "portfolioGuid": "005056A554681ED5BDAE9EC36D5E2B90",
     "sapUrl": "http://sapprpap19.sial.com:8083/...",
     "applicationType": "RPM"
   }
```

#### 3. `docs/features/SAP_RPM_TESTING_GUIDE.md`
Comprehensive testing guide with step-by-step instructions.

**Contents:**
- Overview of SAP RPM vs. PS differences
- Configuration steps (3 methods)
- Testing procedures (URL parser, API connection)
- Troubleshooting guide
- Frontend implementation examples
- Testing checklist

#### 4. `docs/features/SAP_RPM_INTEGRATION_SUMMARY.md` (this file)
Summary of all changes and implementation details.

### Files Updated (4 files)

#### 1. `server/models/SystemSettings.js`
Added SAP configuration schema with encryption support.

**New Fields:**
```javascript
integrations: {
  sap: {
    enabled: Boolean,           // Enable/disable SAP integration
    host: String,              // SAP server hostname (sapprpap19.sial.com)
    port: String,              // SAP port (8083)
    client: String,            // SAP client (100)
    username: String,          // SAP username
    password: String,          // SAP password (encrypted)
    protocol: String,          // http or https
    timeout: Number,           // API timeout in seconds
    applicationType: String,   // RPM, PS, or NWBC
    lastConnectionTest: Date,  // Last connectivity test
    connectionStatus: String   // unknown, connected, or failed
  }
}
```

**New Methods:**
- `getDecryptedSAPPassword()` - Decrypts SAP password for API calls
- Pre-save hook to auto-encrypt SAP password

#### 2. `server/services/sapProjectService.js`
Updated to support SAP RPM in addition to PS.

**New Methods:**
- `parseSAPRPMUrl(url)` - Parses SAP RPM WebDynpro URLs
- `linkProjectByUrl(projectId, sapUrl)` - Links project using URL
- `buildSAPLink(projectId, options)` - Updated to support RPM GUIDs

**Updated Methods:**
- `searchProjects()` - Now supports both RPM and PS OData APIs
- `buildSAPLink()` - Now generates WebDynpro URLs for RPM

**Example Usage:**
```javascript
const sapProjectService = require('./services/sapProjectService');

// Parse SAP RPM URL
const parsed = sapProjectService.parseSAPRPMUrl(sapUrl);
// Returns: { objectGuid, parentGuid, portfolioGuid, host, port, ... }

// Link project by URL
const result = await sapProjectService.linkProjectByUrl(projectId, sapUrl);
// Returns: { success: true, data: { projectId, objectGuid, ... } }

// Build SAP link
const url = sapProjectService.buildSAPLink(projectId, {
  objectGuid: '0517F09214541EEF97AFD2C8AD56CAA9',
  parentGuid: '005056A554681ED5BDAF29EF2AE06D81',
  portfolioGuid: '005056A554681ED5BDAE9EC36D5E2B90'
});
```

#### 3. `server/migrations/add-sap-project-fields.js`
Added SAP RPM specific fields to migration.

**New Fields:**
```javascript
sapProject: {
  // ... existing PS fields
  objectGuid: String,        // SAP RPM object GUID
  parentGuid: String,        // SAP RPM parent GUID
  portfolioGuid: String,     // SAP RPM portfolio GUID
  applicationType: String    // 'RPM', 'PS', or 'NWBC'
}
```

#### 4. `server/scripts/testSAPProjectAPI.js`
Updated to support SAP RPM application type (existing file, minor updates).

### Existing Files (Unchanged)

These files from the original implementation remain valid:
- `docs/features/SAP_NPDI_STATUS_INTEGRATION.md` - Still valid for PS reference
- `docs/features/SAP_NPDI_QUICK_START.md` - Still valid for PS reference
- `docs/features/SAP_NPDI_IMPLEMENTATION_SUMMARY.md` - Original PS plan

---

## Key Technical Concepts

### SAP RPM vs. SAP Project System (PS)

| Aspect | SAP PS | SAP RPM |
|--------|--------|---------|
| **Module** | Project System | Resource & Portfolio Management |
| **Use Case** | Traditional project management | Portfolio and resource management |
| **Tables** | PROJ, PRPS | Different (portfolio-specific) |
| **Identifiers** | Project ID (text) | GUIDs (hex strings) |
| **UI** | NWBC Transaction CJ20N | WebDynpro apps |
| **OData API** | `/sap/opu/odata4/sap/api_project/` | `/sap/opu/odata/sap/RPM_ITEM_SRV/` |
| **URL Format** | Transaction-based | WebDynpro-based |

### SAP RPM URL Structure

**Full URL Example:**
```
http://sapprpap19.sial.com:8083/sap/bc/webdynpro/sap/rpm_item_details?
  &sap-client=100
  &appl_type=RPM
  &object_guid=0517F09214541EEF97AFD2C8AD56CAA9      ← Unique item identifier
  &parent_guid=005056A554681ED5BDAF29EF2AE06D81      ← Parent portfolio
  &portfolio_guid=005056A554681ED5BDAE9EC36D5E2B90   ← Portfolio
  &object_type=RIH
  &parent_type=RPH
  &portal_role=RPM_ITEM
  &sap-wd-configid=RPM_ITEM_DETAILS_CFG
  &sap-language=EN
```

**Key Parameters:**
- `object_guid` - The unique GUID for the RPM item
- `parent_guid` - The parent portfolio/project GUID
- `portfolio_guid` - The portfolio this item belongs to
- `appl_type` - Application type (RPM)
- `object_type` - Object type (RIH = RPM Item Header)
- `parent_type` - Parent type (RPH = RPM Portfolio Header)

### GUIDs (Globally Unique Identifiers)

SAP RPM uses GUIDs instead of simple IDs:
- **Format:** 32 hexadecimal characters (e.g., `0517F09214541EEF97AFD2C8AD56CAA9`)
- **Purpose:** Uniquely identify objects across SAP system
- **Usage:** Required for deep linking to specific items

---

## Integration Architecture

### Data Flow

```
NPDI Portal Ticket
       │
       ├─── User clicks "Link to SAP"
       │
       ├─── User pastes SAP RPM URL
       │         │
       │         └─── sapProjectService.parseSAPRPMUrl()
       │                    │
       │                    └─── Extract: objectGuid, parentGuid, portfolioGuid
       │
       ├─── sapProjectService.linkProjectByUrl()
       │         │
       │         └─── Returns structured data
       │
       ├─── Save to ProductTicket.sapProject
       │         {
       │           projectId: "100000000000000572302024",
       │           objectGuid: "0517F09214541EEF97AFD2C8AD56CAA9",
       │           sapUrl: "http://sapprpap19...",
       │           applicationType: "RPM"
       │         }
       │
       └─── User clicks "View in SAP"
                 │
                 └─── Opens sapUrl in new tab → SAP RPM item details
```

### Database Schema

**ProductTicket Model:**
```javascript
{
  ticketNumber: "NPDI-2024-001",
  productName: "New Chemical Product",

  // SAP RPM Integration
  sapProject: {
    projectId: "100000000000000572302024",
    projectName: "SAP RPM Item 100000000000000572302024",
    objectGuid: "0517F09214541EEF97AFD2C8AD56CAA9",
    parentGuid: "005056A554681ED5BDAF29EF2AE06D81",
    portfolioGuid: "005056A554681ED5BDAE9EC36D5E2B90",
    sapUrl: "http://sapprpap19.sial.com:8083/...",
    lastSyncDate: "2025-11-23T21:09:14.513Z",
    applicationType: "RPM",

    // Optional fields (if OData API available)
    systemStatus: "REL",
    systemStatusText: "Released",
    responsible: "John Smith",
    startDate: "2024-01-15",
    endDate: "2024-06-30"
  }
}
```

---

## Testing Status

### ✅ Completed Tests

1. **URL Parser Test** (testSAPRPMUrlParser.js)
   - ✅ Parse SAP RPM WebDynpro URL
   - ✅ Extract all GUIDs correctly
   - ✅ Link project by URL
   - ✅ Generate new SAP URL from GUIDs
   - **Result:** All tests passed

### ⏳ Pending Tests (Require VPN)

2. **SAP API Connection Test** (testSAPProjectAPI.js)
   - ⏳ Connect to SAP OData metadata endpoint
   - ⏳ Authenticate with SAP credentials
   - ⏳ Search for RPM items (if API available)
   - ⏳ Retrieve project status
   - **Requires:** VPN connection to SAP network

3. **End-to-End Integration Test**
   - ⏳ Link ticket to SAP project via UI
   - ⏳ Verify "View in SAP" button works
   - ⏳ Test with multiple projects
   - **Requires:** Frontend implementation + VPN

---

## Next Steps for You

### Immediate (This Week)

#### Step 1: Configure SAP Credentials
```bash
cd ~/npdi-app/server
node scripts/configureSAP.js
```

Fill in when prompted:
- Host: `sapprpap19.sial.com`
- Port: `8083`
- Client: `100`
- Username: `M305853` (from your .env)
- Password: `<your SAP password>`
- Application Type: `RPM`
- Enable: `yes`

#### Step 2: Test URL Parser (No VPN needed)
```bash
node scripts/testSAPRPMUrlParser.js
```

Expected: ✅ All tests pass (already verified locally)

#### Step 3: Connect to SAP VPN
Connect to your corporate VPN to access sapprpap19.sial.com

#### Step 4: Test SAP API Connection (VPN required)
```bash
# Verify connectivity
ping sapprpap19.sial.com
curl -I http://sapprpap19.sial.com:8083/

# Run test
node scripts/testSAPProjectAPI.js
```

#### Step 5: Run Database Migration
```bash
node migrations/add-sap-project-fields.js
```

Expected: Adds `sapProject` fields to all ProductTicket documents

### Short-term (Next 1-2 Weeks)

#### Step 6: Update ProductTicket Model
Add sapProject schema to `server/models/ProductTicket.js` (see testing guide for full schema)

#### Step 7: Create API Routes
Create `server/routes/sapProjects.js` with:
- `POST /api/sap-projects/link` - Link ticket to SAP project
- `GET /api/sap-projects/search` - Search SAP projects (if API available)
- `POST /api/sap-projects/test-connection` - Test SAP connectivity

Add to `server/index.js`:
```javascript
const sapProjectRoutes = require('./routes/sapProjects');
app.use('/api/sap-projects', sapProjectRoutes);
```

#### Step 8: Build Frontend Components
Create these components (see testing guide for full code):
- `SAPProjectLinkButton.jsx` - Button to link ticket to SAP
- `SAPProjectBadge.jsx` - Display SAP project info on ticket
- `SAPStatusSync.jsx` - Sync button (optional)

#### Step 9: Integration Testing
- Test linking a ticket to SAP project 100000000000000572302024
- Verify "View in SAP" button opens correct URL
- Test with multiple tickets

### Long-term (Future)

#### Step 10: OData API Integration (Optional)
If SAP RPM OData API is available:
- Discover API endpoint: `/sap/opu/odata/sap/RPM_ITEM_SRV/`
- Test with: `node scripts/testSAPProjectAPI.js --search="NPDI"`
- Implement automatic status sync

#### Step 11: Advanced Features
- Automatic status synchronization (daily cron job)
- Push notifications when SAP status changes
- Bulk linking of tickets to SAP projects
- SAP project status dashboard

---

## Documentation Reference

### For Testing
- **Primary:** `docs/features/SAP_RPM_TESTING_GUIDE.md`
- Step-by-step testing instructions
- Troubleshooting guide
- Frontend implementation examples

### For Background (SAP PS - Original Plan)
- `docs/features/SAP_NPDI_STATUS_INTEGRATION.md` - Complete PS integration guide
- `docs/features/SAP_NPDI_QUICK_START.md` - PS quick start
- `docs/features/SAP_NPDI_IMPLEMENTATION_SUMMARY.md` - Original implementation plan

**Note:** The PS documentation is still valuable for understanding SAP integration concepts, but the RPM implementation differs in URL format and identifiers.

---

## Success Criteria

You'll know the integration is working when:

- ✅ Configuration script completes without errors
- ✅ URL parser test passes (all 3 tests)
- ✅ SAP API connection test passes (with VPN)
- ✅ Database migration completes successfully
- ✅ Can link a ticket to SAP project via API
- ✅ "View in SAP" button opens correct URL in SAP
- ✅ SAP project info displays correctly on ticket
- ✅ Multiple tickets can be linked to different SAP projects

---

## Key Differences from Original Plan

| Aspect | Original Plan (PS) | Current Implementation (RPM) |
|--------|-------------------|------------------------------|
| **SAP Module** | Project System | Resource & Portfolio Management |
| **Host** | sapprpap3.sial.com | sapprpap19.sial.com |
| **URL Type** | NWBC Transaction | WebDynpro Application |
| **Identifier** | Project ID (text) | GUIDs (hex) |
| **OData API** | `/sap/opu/odata4/sap/api_project/` | `/sap/opu/odata/sap/RPM_ITEM_SRV/` |
| **Primary Method** | API-first | URL-first (manual linking) |
| **Status Sync** | Automatic | Optional (if API available) |

---

## Support & Troubleshooting

### Common Issues

#### Issue: "Cannot connect to SAP"
**Solution:** Ensure you're connected to SAP VPN

#### Issue: "Authentication failed"
**Solution:** Verify credentials in configureSAP.js

#### Issue: "SAP integration not enabled"
**Solution:** Run `node scripts/configureSAP.js` and set enabled=yes

#### Issue: "URL parsing failed"
**Solution:** Ensure URL is from SAP RPM WebDynpro app (rpm_item_details)

### Getting Help

1. **Configuration:** See `SAP_RPM_TESTING_GUIDE.md`
2. **SAP Basis Team:** For OData service activation
3. **SAP Security:** For user authorizations
4. **Network Team:** For VPN/firewall issues

---

## Summary

✨ **Accomplishments:**
- ✅ Updated integration to support SAP RPM (not PS)
- ✅ Created SAP configuration helper script
- ✅ Created URL parser and test scripts
- ✅ Updated SystemSettings model with SAP config
- ✅ Updated sapProjectService to support RPM
- ✅ Created comprehensive testing guide
- ✅ Verified URL parsing works correctly

🚀 **Ready to Test:**
1. Configure SAP credentials
2. Test URL parser (no VPN)
3. Connect to VPN
4. Test SAP API connection
5. Run database migration
6. Implement API routes and frontend

📖 **Documentation:**
- Testing Guide: `docs/features/SAP_RPM_TESTING_GUIDE.md`
- This Summary: `docs/features/SAP_RPM_INTEGRATION_SUMMARY.md`
- Original PS Docs: `docs/features/SAP_NPDI_*.md`

---

**You're all set to begin testing!** 🎉

Follow the **SAP_RPM_TESTING_GUIDE.md** for step-by-step instructions.

**Questions?** Refer to the testing guide or contact the development team.
