# Similar Products Search Feature

## Overview

The Similar Products Search feature enables users to discover existing products in the SAP MARA database that share the same CAS (Chemical Abstracts Service) number as the product being created. This helps identify duplicate products, find related materials, and leverage existing product data.

## Purpose

- **Prevent Duplicates**: Identify if a product with the same CAS number already exists in SAP
- **Data Reuse**: Import field values from existing similar products
- **Cross-Reference**: Find related products across different material types and categories
- **Quality Assurance**: Ensure consistency across similar products in the portfolio

## How It Works

### Search Process

1. **Automatic Trigger**: The search can be initiated from the Create Ticket page when a CAS number is available
2. **Palantir Query**: Searches the SAP MARA dataset via Palantir Foundry SQL Query API v2
3. **Smart Loading**: Initially fetches 3 results, with option to load more
4. **Time Limit**: Maximum 20 second search time to ensure responsive UX

### Search Parameters

```javascript
{
  casNumber: "64-17-5",  // Required CAS number to search
  maxResults: 3,          // Initial results (expandable)
  maxSearchTime: 20000    // 20 seconds maximum
}
```

### API Endpoint

**GET** `/api/products/similar-products/:casNumber`

**Query Parameters:**
- `maxResults` (optional): Number of results to fetch (default: 3)
- `maxSearchTime` (optional): Maximum search time in milliseconds (default: 20000)

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "MATNR": "123456",
      "MAKTX": "Ethanol, 99.5%",
      "MEINS": "L",
      "MTART": "ZFIN",
      // ... other SAP MARA fields
    }
  ],
  "searchTime": 2340,
  "timedOut": false
}
```

## User Interface

### Similar Products Popup

The popup modal displays search results with the following features:

#### Header
- **CAS Number**: Displays the CAS being searched
- **Close Button**: Dismiss the popup without importing data

#### Search Status
- **Loading State**: Shows animated spinner during search
- **Progress Indicator**: Displays elapsed search time
- **Result Count**: Shows number of products found

#### Results Table

| Material Number | Description | Unit | Material Type | Actions |
|----------------|-------------|------|---------------|---------|
| 123456 | Ethanol, 99.5% | L | ZFIN | ☑️ Select |
| 234567 | Ethanol ACS | KG | ZFIN | ☐ Select |
| 345678 | Ethanol, absolute | L | ZROH | ☐ Select |

**Column Details:**
- **Material Number (MATNR)**: SAP material identifier
- **Description (MAKTX)**: Product description from SAP
- **Unit (MEINS)**: Base unit of measure
- **Material Type (MTART)**: SAP material type classification
- **Select**: Checkbox to select products for import

#### Load More Feature

- **Initial Results**: Shows first 3 matching products
- **Load More Button**: Appears if additional results are available
- **Progressive Loading**: Fetches 3 more results each time "Load More" is clicked
- **Smart Detection**: Button only shows when more results exist

#### Footer Actions
- **Cancel**: Close popup without importing
- **Import Selected**: Import field data from selected products

## Field Import Functionality

When products are selected and imported:

### Imported Fields

The system imports the following SAP MARA fields:

| SAP Field | ProductTicket Field | Description |
|-----------|---------------------|-------------|
| MATNR | sapMaterialNumber | Material number |
| MAKTX | productName | Material description |
| MEINS | baseUnit | Base unit of measure |
| MTART | materialType | Material type |
| MATKL | materialGroup | Material group |
| SPART | division | Division |
| LABOR | laboratoryOffice | Laboratory/design office |
| EKWSL | purchasingValueKey | Purchasing value key |
| And 50+ more fields... | Various | See SAP-MARA-to-ProductTicket-Mapping.md |

### Import Behavior

1. **Non-Destructive**: Only populates empty fields
2. **User Control**: User selects which products to import from
3. **First Match Priority**: If multiple products selected, first matching non-empty value is used
4. **Smart Merging**: Combines data from multiple similar products
5. **Validation**: All imported data goes through standard validation

### Example Import Scenario

**Selected Products:**
- Product A: Has `laboratoryOffice = "LAB01"`, missing `purchasingValueKey`
- Product B: Has `purchasingValueKey = "P01"`, missing `laboratoryOffice`

**Result:**
- Ticket gets both `laboratoryOffice = "LAB01"` AND `purchasingValueKey = "P01"`

## Implementation Details

### Component Location
```
client/src/components/admin/SimilarProductsPopup.jsx
```

### Key Features

#### Progressive Loading
```javascript
const [maxResults, setMaxResults] = useState(3);
const [hasMoreResults, setHasMoreResults] = useState(false);

const handleLoadMore = async () => {
  const newMaxResults = maxResults + 3;
  setMaxResults(newMaxResults);
  await handleSearch(newMaxResults);
};
```

#### Auto-Start Search
```javascript
useEffect(() => {
  // Auto-start search when popup opens
  handleSearch(3);
}, []);
```

#### Product Selection
```javascript
const handleProductSelect = (materialNumber) => {
  const newSelection = new Set(selectedProducts);
  if (newSelection.has(materialNumber)) {
    newSelection.delete(materialNumber);
  } else {
    newSelection.add(materialNumber);
  }
  setSelectedProducts(newSelection);
};
```

### Backend Service

**Service:** `server/services/palantirService.js`

**Function:** `searchSimilarProducts(casNumber, options)`

**Implementation:**
- Uses Palantir Foundry SQL Query API v2
- Searches MARA dataset for matching CAS numbers
- Handles pagination and result limiting
- Returns matched products with full field data

## User Workflow

### Typical Usage Flow

1. **Enter CAS Number**: User enters CAS in Chemical Properties form
2. **Trigger Search**: Click "Search Similar Products" button
3. **View Results**: Popup automatically searches and displays results
4. **Review Products**: User reviews similar products in table
5. **Select Products**: Check boxes next to products to import
6. **Load More** (Optional): Click "Load More" if needed
7. **Import Data**: Click "Import Selected" to populate fields
8. **Verify Data**: Review and adjust imported data as needed

### Search States

#### No Results Found
- Message: "No similar products found in X seconds"
- Icon: Information circle
- Action: User can close popup and continue manually

#### Results Found
- Message: "Found X similar products"
- Display: Table with product details
- Action: User can select and import

#### Timeout
- Message: "Search timed out after 20 seconds"
- Behavior: Returns any partial results found
- Action: User can retry or continue manually

## Benefits

### For Product Managers
- **Faster Data Entry**: Auto-populate fields from existing products
- **Consistency**: Maintain data consistency across similar products
- **Discovery**: Find related products they may not have known about

### For PM-OPS
- **Quality Control**: Identify potential duplicates before NPDI creation
- **Data Validation**: Cross-reference new products with existing materials
- **Portfolio Management**: Better understanding of product relationships

### For System
- **Data Integrity**: Reduce duplicate product entries
- **SAP Integration**: Leverage existing SAP master data
- **Efficiency**: Reduce manual data entry and errors

## Related Documentation

- [Palantir SQL Query API Integration](../Palantir-SQL-Query-API-Integration-Guide.md)
- [SAP MARA Field Mapping](../features/SAP-MARA-to-ProductTicket-Mapping.md)
- [API Documentation](../api/API_DOCUMENTATION.md)

## Configuration

### Environment Variables

No additional environment variables required. Uses existing Palantir integration:

```bash
PALANTIR_HOSTNAME=your-foundry-instance.palantirfoundry.com
PALANTIR_TOKEN=your-oauth-token
```

### System Settings

Configured via System Settings admin panel:
- **Palantir Integration**: Must be enabled
- **Query Timeout**: Configurable (default 20 seconds)
- **Max Results**: Configurable per search (default 3 initial, expandable)

## Performance Considerations

### Search Optimization
- **Smart Caching**: Results cached temporarily during session
- **Progressive Loading**: Prevents loading unnecessary data
- **Timeout Protection**: Ensures UI remains responsive
- **Efficient Queries**: Optimized SQL queries on Palantir side

### Best Practices
- Start with CAS lookup to ensure valid CAS number
- Review all selected products before import
- Verify imported data fits product context
- Use "Load More" only when needed

## Future Enhancements

Potential improvements for future releases:
- Search by other identifiers (IUPAC name, synonyms)
- Advanced filtering options (material type, division)
- Side-by-side comparison of selected products
- Field-level import control (select specific fields)
- History tracking of imported products
- Export similar products list

## Troubleshooting

### Common Issues

**Problem:** "No results found" for known CAS
- **Solution**: Verify CAS format is correct (e.g., 64-17-5)
- **Solution**: Check if products exist in SAP MARA with that CAS

**Problem:** Search times out
- **Solution**: Network connectivity issues with Palantir
- **Solution**: Large dataset causing slow queries
- **Action**: Contact IT to check Palantir integration

**Problem:** Import doesn't populate fields
- **Solution**: Fields may already contain values (non-destructive import)
- **Solution**: Check if selected products have data for those fields

**Problem:** "Load More" button doesn't appear
- **Solution**: All available results already loaded
- **Solution**: Fewer than 3 results exist in SAP

## Version History

- **v1.1** (Current) - Added progressive "Load More" functionality
- **v1.0** - Initial release with 3-result limit

---

**Last Updated:** 2025-11-22
**Maintained by:** NPDI Development Team
