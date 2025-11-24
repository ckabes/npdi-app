# SAP NPDI Integration - Quick Start Guide

> **⚠️ DEPRECATED** - Direct SAP integration removed. Use Palantir Foundry for SAP MARA access.

**Last Updated:** November 23, 2025

---

## Overview

This guide will help you quickly set up and test the SAP Project System integration to retrieve NPDI project status.

---

## Prerequisites

Before starting, ensure you have:

- [ ] SAP NetWeaver access credentials (username & password)
- [ ] SAP system details (host, port, client number)
- [ ] User authorization for OData services in SAP
- [ ] Network access to SAP server (no firewall blocking)
- [ ] SAP Project ID or WBS Element for testing

---

## Step 1: Configure SAP Settings

### Option A: Via System Settings UI (Recommended)

1. Log into NPDI Portal as Admin
2. Navigate to **Admin Dashboard → System Settings**
3. Scroll to **Integrations** section
4. Find **SAP Project System** section
5. Fill in the following:
   - **Enabled:** ✅ Check this box
   - **SAP Host:** `sapprpap3.sial.com` (or your SAP server)
   - **SAP Port:** `8083` (default)
   - **SAP Client:** `100` (or your client number)
   - **SAP Username:** Your SAP username
   - **SAP Password:** Your SAP password
   - **Protocol:** `http` or `https`
   - **Timeout:** `30` seconds
6. Click **Save Settings**

### Option B: Via Database (Advanced)

```javascript
// In MongoDB shell
use npdi-portal;

db.systemsettings.updateOne(
  {},
  {
    $set: {
      'integrations.sap.enabled': true,
      'integrations.sap.host': 'sapprpap3.sial.com',
      'integrations.sap.port': '8083',
      'integrations.sap.client': '100',
      'integrations.sap.username': 'YOUR_USERNAME',
      'integrations.sap.password': 'YOUR_ENCRYPTED_PASSWORD', // Use SystemSettings.encryptPassword()
      'integrations.sap.protocol': 'http',
      'integrations.sap.timeout': 30
    }
  },
  { upsert: true }
);
```

---

## Step 2: Test SAP Connectivity

### Run the Test Script

```bash
cd ~/npdi-app/server
node scripts/testSAPProjectAPI.js
```

**Expected Output:**
```
═══════════════════════════════════════════════════════════════
SAP PROJECT API TEST
═══════════════════════════════════════════════════════════════

📋 Test 1: Checking SAP Project Integration Status...

   Integration Enabled: ✅ Yes

📡 Test 2: Testing Connection to SAP Project API...

   ✅ Connected to SAP Project API at sapprpap3.sial.com:8083
   Response time: 1234ms
   API Version: OData v4

🔎 Test 4: Searching Projects for "NPDI"...

   ✅ Found 3 project(s) in 2345ms

   Search Results:
   ═══════════════════════════════════════════════════════════════

   1. PROJECT001 - NPDI New Chemical Product
      Status:      REL (Released)
      Dates:       2024-01-15 to 2024-06-30
      Responsible: John Smith
      SAP Link:    https://sapprpap3.sial.com:8083/sap/bc/gui/sap/its/webgui...

✅ TEST SUMMARY
   All tests completed successfully!
```

### Test with Specific Project

```bash
node scripts/testSAPProjectAPI.js --project=PROJECT001
```

### Test with Custom Search

```bash
node scripts/testSAPProjectAPI.js --search="New Product"
```

---

## Step 3: Common Issues & Solutions

### Issue 1: "SAP Project integration is not enabled"

**Solution:**
- Check System Settings → SAP Project System → Enabled checkbox
- Verify all required fields are filled
- Restart the application

### Issue 2: "Authentication failed" (HTTP 401)

**Solution:**
- Verify username and password are correct
- Test credentials in SAP GUI or NWBC first
- Check if password has expired
- Ensure password is properly encrypted in database

### Issue 3: "Service not found" (HTTP 404)

**Solution:**
- SAP OData service may not be activated
- Contact SAP Basis team
- Ask them to activate service in transaction **SICF**
- Path: `/sap/opu/odata4/sap/api_project`

### Issue 4: "Access forbidden" (HTTP 403)

**Solution:**
- User lacks OData authorization
- Contact SAP Basis team
- Request authorization object: `S_PROJECT`, `S_SERVICE`
- May need role with OData Gateway access

### Issue 5: "Connection refused" (ECONNREFUSED)

**Solution:**
- Check SAP server is running
- Verify SAP host and port are correct
- Check firewall allows traffic to SAP server
- Test with: `curl http://sapprpap3.sial.com:8083`

---

## Step 4: Understanding SAP Project Statuses

### Common System Statuses

| Code | Meaning | Color | Description |
|------|---------|-------|-------------|
| `CRTD` | Created | Gray | Project created but not released |
| `PCNF` | Planning Confirmed | Blue | Planning phase complete |
| `REL` | Released | Green | Project approved and active |
| `PROC` | In Process | Yellow | Currently being worked on |
| `TECO` | Technically Complete | Purple | Work complete, pending admin closure |
| `CLSD` | Closed | Gray | Project finished and archived |
| `LKD` | Locked | Red | Project locked, no changes allowed |

### Status Flow

```
Created (CRTD)
    ↓
Planning Confirmed (PCNF)
    ↓
Released (REL)
    ↓
In Process (PROC)
    ↓
Technically Complete (TECO)
    ↓
Closed (CLSD)
```

---

## Step 5: Find Your Project IDs

### Method 1: SAP GUI

1. Open SAP GUI
2. Run transaction **CJ20N** (Project Builder)
3. Search for your projects
4. Note the Project ID (e.g., `PROJECT001`)

### Method 2: NWBC

1. Open SAP NetWeaver Business Client
2. Navigate to Project System
3. Search for NPDI projects
4. Copy Project ID

### Method 3: Ask SAP Project Manager

Contact your SAP Project Manager and ask for:
- NPDI project IDs
- WBS element IDs
- Project naming convention

---

## Step 6: Deep Links to SAP

### How Deep Links Work

The integration generates URLs that open SAP directly to the project:

**URL Pattern:**
```
https://<sap-host>:<port>/sap/bc/gui/sap/its/webgui?~transaction=CJ20N&~OKCode=/00&P_PSP_PNR=<PROJECT_ID>
```

**Example:**
```
https://sapprpap3.sial.com:8083/sap/bc/gui/sap/its/webgui?~transaction=CJ20N&~OKCode=/00&P_PSP_PNR=PROJECT001
```

### Test Deep Link

1. Get a deep link from the test script output
2. Copy the URL
3. Paste in browser
4. You should be redirected to SAP login
5. After login, SAP opens directly to the project

---

## Step 7: Next Implementation Steps

Once connectivity is working:

### 1. Update ProductTicket Model

Add SAP project fields to the schema:

```bash
cd ~/npdi-app/server
node migrations/add-sap-project-fields.js
```

### 2. Create API Routes

Create `server/routes/sapProjects.js` (already documented in main guide)

### 3. Build Frontend Components

Components needed:
- `SAPProjectBadge.jsx` - Display SAP status
- `SAPProjectLinkPopup.jsx` - Search and link projects
- `SAPStatusSync.jsx` - Sync button

### 4. Add "View in SAP" Button

Add button to ticket detail page that opens SAP deep link

### 5. Status Sync

Implement manual or automatic status sync from SAP

---

## Step 8: Testing Checklist

- [ ] SAP connectivity test passes
- [ ] Can search projects by name
- [ ] Can retrieve project by ID
- [ ] Can get project status
- [ ] Deep link opens SAP correctly
- [ ] Status text displays correctly
- [ ] Error handling works (404, 401, timeout)
- [ ] Performance acceptable (<3 seconds)

---

## Support & Resources

### Documentation

- **Main Integration Guide:** `docs/features/SAP_NPDI_STATUS_INTEGRATION.md`
- **API Reference:** `docs/api/SAP_PROJECT_API.md`
- **Troubleshooting:** See Section 10 in main guide

### SAP Resources

- [SAP API Business Hub - Project API](https://api.sap.com/api/OP_API_PROJECT_V3_0001/overview)
- [OData Protocol Specification](http://www.odata.org/documentation/)
- [SAP Project System Tables](https://www.sap-ps.net/sap-ps-tables)

### Getting Help

1. **Internal:** Contact NPDI Portal development team
2. **SAP Issues:** Contact SAP Basis team
3. **Authentication:** Contact SAP Security team
4. **API Activation:** Contact SAP Basis for SICF configuration

---

## Frequently Asked Questions

**Q: Can I use this with SAP S/4HANA?**
A: Yes! The OData API v4 is designed for S/4HANA. Older ECC systems may need the v2 API.

**Q: Will this work for on-premise SAP only?**
A: Yes, this guide covers on-premise SAP. For SAP Cloud, use SAP Business Technology Platform (BTP) APIs.

**Q: How often should we sync status from SAP?**
A: Recommended: Manual sync on-demand, or automated sync every 24 hours.

**Q: Can we write data back to SAP?**
A: Yes, if your user has authorization. The OData API supports Create/Update/Delete operations.

**Q: What if our SAP uses custom fields or tables?**
A: You may need to create a custom OData service or use RFC/BAPI calls instead.

**Q: Is the password stored securely?**
A: Yes, passwords are encrypted in the database using the SystemSettings encryption methods.

---

## Success!

If you've completed all steps successfully:

✅ SAP integration is working
✅ You can search and retrieve projects
✅ Deep links open SAP correctly
✅ Ready to build UI components

**Next:** Proceed with Phase 3 of the implementation plan (database schema updates) and Phase 4 (frontend components).

---

**Questions?** See the main integration guide or contact the development team.
