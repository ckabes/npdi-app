# SAP OData Service Activation Request

> **⚠️ DEPRECATED** - Direct SAP OData integration not implemented. This document is kept for reference only.

**Date:** November 23, 2025
**Requestor:** NPDI Portal Development Team
**SAP User:** M305853

---

## Request Summary

We need OData services activated on SAP server `sapprpap8.sial.com:8083` to enable programmatic integration between the NPDI Portal and SAP RPM (Resource and Portfolio Management).

---

## Current Status

### ✅ What Works
- Network connectivity to SAP server (sapprpap8.sial.com:8083)
- User authentication via basic auth
- NWBC endpoint: `http://sapprpap8.sial.com:8083/nwbc/` (200 OK)
- WebGUI endpoint: `http://sapprpap8.sial.com:8083/sap/bc/gui/sap/its/webgui` (200 OK)

### ❌ What Doesn't Work
- OData service catalog: `http://sapprpap8.sial.com:8083/sap/opu/odata/sap/` (404 Not Found)
- RPM OData services not accessible

---

## Services Requested

Please activate the following OData services on `sapprpap8.sial.com` (Client 100):

### 1. **RPM_ITEM_SRV** (RPM Item Service)
- **Purpose:** Retrieve RPM item details by ID
- **Path:** `/sap/opu/odata/sap/RPM_ITEM_SRV/`
- **Required for:** Linking NPDI tickets to SAP RPM items

### 2. **RPM_PROJECT_SRV** (RPM Project Service)
- **Purpose:** Search and retrieve RPM projects
- **Path:** `/sap/opu/odata/sap/RPM_PROJECT_SRV/`
- **Required for:** Project search functionality

### 3. **RPM_PORTFOLIO_SRV** (RPM Portfolio Service) - Optional
- **Purpose:** Access portfolio information
- **Path:** `/sap/opu/odata/sap/RPM_PORTFOLIO_SRV/`
- **Required for:** Portfolio-level reporting

### 4. **OData Service Catalog**
- **Purpose:** Browse available OData services
- **Path:** `/sap/opu/odata/sap/`
- **Required for:** Service discovery

---

## SAP Basis Tasks Required

### Step 1: Activate OData Gateway Services

**Transaction:** `/IWFND/MAINT_SERVICE`

1. Choose "Add Service"
2. Search for RPM services:
   - `RPM_ITEM_SRV`
   - `RPM_PROJECT_SRV`
   - `RPM_PORTFOLIO_SRV`
3. Select system alias for backend
4. Register services to activate them

### Step 2: Activate ICF Nodes

**Transaction:** `SICF`

Navigate to and activate:
```
/default_host/sap/opu/odata/sap/
  ├── RPM_ITEM_SRV
  ├── RPM_PROJECT_SRV
  └── RPM_PORTFOLIO_SRV
```

Verify traffic lights are green for all nodes.

### Step 3: Verify Service Catalog

Test URL: `http://sapprpap8.sial.com:8083/sap/opu/odata/sap/`
- Should return XML service catalog
- Should list all activated services

---

## Authorization Requirements

User **M305853** needs the following authorizations:

### SAP Authorizations Objects
- `S_SERVICE` - OData service access
- `S_RFC` - Remote function call execution
- Authorization to read RPM objects

### SAP Roles
- Role with SAP NetWeaver Gateway access
- Role with SAP RPM read permissions

Please verify user M305853 has these authorizations or assign appropriate role.

---

## Use Case

### NPDI Portal Integration with SAP RPM

**Objective:** Link New Product Development & Introduction (NPDI) tickets to SAP RPM project items.

**Current Workflow (Manual):**
1. PM Ops creates NPDI ticket in portal
2. PM Ops manually opens SAP RPM in separate browser
3. PM Ops manually cross-references between systems
4. No automated status synchronization

**Desired Workflow (Automated):**
1. PM Ops creates NPDI ticket in portal
2. Portal searches SAP RPM via OData API
3. PM Ops selects RPM item from dropdown (or enters ID)
4. Portal automatically links ticket to SAP RPM item
5. "View in SAP" button opens RPM item directly
6. Status can be synchronized automatically (future)

**Benefits:**
- ✅ Reduced manual effort
- ✅ Fewer data entry errors
- ✅ Single source of truth
- ✅ Real-time status visibility
- ✅ Better project tracking

---

## Test Plan

Once services are activated, we will test:

### 1. Service Catalog Access
```bash
curl -u M305853:password \
  "http://sapprpap8.sial.com:8083/sap/opu/odata/sap/?sap-client=100"
```

**Expected:** XML catalog listing all services

### 2. RPM Item Retrieval
```bash
curl -u M305853:password \
  "http://sapprpap8.sial.com:8083/sap/opu/odata/sap/RPM_ITEM_SRV/Items('100000000000000572302024')?sap-client=100"
```

**Expected:** JSON response with RPM item details

### 3. Search Projects
```bash
curl -u M305853:password \
  "http://sapprpap8.sial.com:8083/sap/opu/odata/sap/RPM_PROJECT_SRV/Projects?\$filter=contains(ProjectName,'NPDI')&sap-client=100"
```

**Expected:** JSON array of matching projects

---

## Timeline

- **Development Ready:** Immediately (code is ready to test)
- **Estimated Activation Time:** 1-2 hours (Basis team task)
- **Testing Time:** 1-2 days
- **Go-Live:** 1 week after successful testing

---

## Technical Contact

**NPDI Portal Team:**
- Developer: [Your Name]
- SAP User: M305853
- Email: [Your Email]

**Questions about:**
- OData service activation → Contact SAP Basis team
- User authorization → Contact SAP Security team
- Integration requirements → Contact NPDI Portal team

---

## References

### SAP Documentation
- SAP NetWeaver Gateway OData Service Activation
- Transaction `/IWFND/MAINT_SERVICE` - Activate and Maintain Services
- Transaction `SICF` - HTTP Service Tree
- SAP Knowledge Base Article 2658433 - Mass Activate ICF Nodes

### Testing Scripts
Location: `/home/ckabes/npdi-app/server/scripts/`
- `testSAPConnection.js` - Connection and auth test
- `testSAPNWBC.js` - NWBC endpoint test
- `testSAPProjectAPI.js` - OData API test (will work after activation)

---

## Success Criteria

Integration is successful when:

- ✅ OData service catalog returns 200 OK
- ✅ Can retrieve RPM item by ID
- ✅ Can search RPM projects by name
- ✅ Response time < 3 seconds
- ✅ Authentication works with basic auth
- ✅ No authorization errors (403)

---

**Please activate these services at your earliest convenience. The NPDI Portal team is ready to test immediately upon activation.**

Thank you!
