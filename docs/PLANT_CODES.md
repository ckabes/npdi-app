# Plant Codes Management

## Overview

The NPDI application manages manufacturing plant codes through **Palantir Foundry integration**. Plant codes are extracted directly from live SAP MARA data via SQL queries and stored in MongoDB for fast access throughout the application.

## Architecture

```
Palantir Foundry (SAP MARA Dataset)
         ↓
    SQL Query (SELECT DISTINCT ORG_PPL...)
         ↓
  Backend Controller (rebuildPlantCodes)
         ↓
    MongoDB (PlantCode Collection)
         ↓
   Frontend (Dropdowns & Forms)
```

## How It Works

### 1. Data Source
- **Source:** Palantir Foundry SAP MARA dataset
- **Columns:** `ORG_PPL` (plant code), `ORG_PPL_TEXT` (plant description)
- **Updates:** Real-time query of live SAP data

### 2. Extraction Process

**Admin UI Path:**
Admin Dashboard → System Settings → Plant Codes → "Rebuild from Palantir"

**What Happens:**
1. System connects to Palantir Foundry
2. Executes SQL query:
   ```sql
   SELECT DISTINCT ORG_PPL, ORG_PPL_TEXT
   FROM `{datasetRID}`
   WHERE ORG_PPL IS NOT NULL
     AND TRIM(ORG_PPL) != ''
   ORDER BY ORG_PPL
   ```
3. Processes ALL records in the SAP dataset
4. Extracts unique plant codes
5. Clears existing plant codes from MongoDB
6. Inserts fresh plant codes with metadata
7. Displays statistics (query time, records processed, etc.)

### 3. Storage

Plant codes are stored in MongoDB with this schema:

```javascript
{
  code: "US01",                    // Plant code (uppercase)
  description: "Milwaukee Manufacturing",  // Plant description
  active: true,                    // Status flag
  metadata: {
    extractedFrom: "Palantir Foundry (ri.foundry...)",
    lastExtracted: "2025-11-24T20:00:00.000Z",
    extractedBy: ObjectId("...")   // Admin who ran rebuild
  },
  createdAt: "2025-11-24T20:00:00.000Z",
  updatedAt: "2025-11-24T20:00:00.000Z"
}
```

## Usage in Application

### API Endpoints

#### Get All Plant Codes (Admin)
```http
GET /api/plant-codes
Authorization: Admin only
```

#### Get Active Plant Codes (Authenticated)
```http
GET /api/plant-codes/active
Authorization: Any authenticated user
```

#### Rebuild from Palantir (Admin)
```http
POST /api/plant-codes/rebuild
Authorization: Admin only
```

### Frontend Integration

```javascript
import { plantCodeAPI } from '../services/api';

// Fetch active plant codes for dropdown
const response = await plantCodeAPI.getActive();
const plantCodes = response.data.data;

// Render in dropdown
<select>
  {plantCodes.map(plant => (
    <option key={plant.code} value={plant.code}>
      {plant.code} - {plant.description}
    </option>
  ))}
</select>
```

## Admin Interface Features

### View & Edit Table
- View all plant codes in sortable table
- Inline editing of code/description
- Toggle active/inactive status
- Delete individual plant codes
- Add new plant codes manually

### Rebuild from Palantir
- **Button:** "Rebuild from Palantir"
- **Confirmation Modal:** Warns about data loss
- **Loading Overlay:** Shows progress during rebuild:
  1. Connecting to Palantir Foundry...
  2. Querying SAP MARA dataset...
  3. Extracting unique plant codes...
  4. Updating database...
- **Success Message:** Shows statistics
  - Query time (seconds)
  - Total records processed
  - Unique plant codes extracted

### Metadata Display
- Total plant codes count
- Active codes count
- Last extraction date/time
- Extracted by (user name)
- Source (Palantir dataset RID)

## Configuration Requirements

### System Settings (Palantir Integration)

Navigate to: **Admin Dashboard → System Settings → Integrations → Palantir Foundry**

Required fields:
- ✅ **Enable:** Palantir Foundry integration must be enabled
- ✅ **Personal Token:** Valid Palantir API token
- ✅ **Dataset RID:** Resource ID for SAP MARA dataset (e.g., `ri.foundry.main.dataset.xxx`)
- Optional **Hostname:** Default is `merckgroup.palantirfoundry.com`
- Optional **Timeout:** Default is 30 seconds

### Testing Connection

Before rebuilding plant codes, test the Palantir connection:
1. Go to System Settings → Integrations → Palantir Foundry
2. Click "Test Connection"
3. Verify successful connection to dataset

## Benefits Over CSV Approach

| Aspect | Palantir Integration | CSV Files |
|--------|---------------------|-----------|
| **Data Freshness** | Always current (live query) | Requires manual export |
| **Scalability** | Handles millions of records | Limited by file size |
| **Automation** | One-click rebuild | Multi-step manual process |
| **Accuracy** | Queries entire SAP dataset | Limited to exported sample |
| **Maintenance** | No file management | Manual CSV updates |
| **Speed** | Direct SQL query (seconds) | CSV parsing |

## Performance

- **Query Time:** Typically 5-15 seconds for full dataset
- **Processing:** 1,000+ records per second
- **Database Insert:** Bulk insert for optimal speed
- **Caching:** Results stored in MongoDB for instant access

## Security

- **Authentication:** Admin role required for rebuild
- **Token Encryption:** Palantir token stored encrypted (AES-256-GCM)
- **Audit Trail:** Tracks who extracted and when
- **Network:** Requires VPN connection to Palantir

## Troubleshooting

### "Palantir integration is not enabled"
**Solution:** Enable Palantir in System Settings → Integrations

### "Authentication failed (HTTP 401/403)"
**Solution:** Verify Palantir personal token is valid and not expired

### "Dataset not found (HTTP 404)"
**Solution:** Verify Dataset RID is correct

### "Query timeout"
**Solution:**
- Increase timeout in System Settings
- Check VPN connection
- Check network latency to Palantir

### No plant codes found
**Solution:**
- Verify dataset contains SAP MARA data
- Check ORG_PPL column exists
- Review query results in server logs

## Monitoring

Server logs show detailed query execution:

```
[Plant Codes] Starting rebuild from Palantir dataset...
[Plant Codes] Executing query to extract plant codes...
[Palantir Service] Query submitted successfully
[Palantir Service] Query ID: abc123...
[Palantir Service] ✓ Query completed successfully!
[Plant Codes] Query returned 247 unique plant codes
[Plant Codes] Processed 247 valid plant codes
[Plant Codes] Clearing existing plant codes from database...
[Plant Codes] Inserting new plant codes...
[Plant Codes] ✓ Successfully inserted 247 plant codes
```

## Future Enhancements

- [ ] Scheduled automatic rebuilds (daily/weekly)
- [ ] Incremental updates (detect changes only)
- [ ] Plant code validation rules
- [ ] Multi-dataset support
- [ ] Export to Excel/CSV functionality
