# NPDI Ticket API Documentation

## Overview

The NPDI Ticket API provides external applications with access to retrieve ticket information based on the default ticket template. This RESTful API allows for querying, filtering, and retrieving detailed ticket data.

**Base URL:** `http://localhost:5000/api/v1/tickets`

**Authentication:** All endpoints require an API key passed via the `X-API-Key` header.

## Authentication

### API Key Setup

1. Generate an API key:
   ```bash
   node server/scripts/generateApiKey.js "My Application"
   ```

2. Add the generated key to your `.env` file:
   ```
   API_KEY_1=your-generated-api-key-here
   ```

3. Use the API key in all requests:
   ```bash
   curl -H "X-API-Key: your-api-key-here" http://localhost:5000/api/v1/tickets
   ```

### Development Mode
In development mode without configured API keys, authentication is automatically disabled with a warning.

---

## Endpoints

### 1. Get All Tickets

Retrieve a paginated list of tickets with optional filtering.

**Endpoint:** `GET /api/v1/tickets`

**Query Parameters:**
- `page` (integer, default: 1) - Page number for pagination
- `limit` (integer, default: 50, max: 100) - Number of results per page
- `status` (string or array) - Filter by ticket status (DRAFT, SUBMITTED, IN_PROCESS, NPDI_INITIATED, COMPLETED, CANCELED)
- `priority` (string or array) - Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `productLine` (string or array) - Filter by product line
- `sbu` (string or array) - Filter by SBU (775, P90, 440, P87, P89, P85)
- `createdBy` (string) - Filter by creator email
- `assignedTo` (string) - Filter by assigned user email
- `startDate` (ISO date string) - Filter tickets created after this date
- `endDate` (ISO date string) - Filter tickets created before this date
- `sortBy` (string, default: createdAt) - Field to sort by
- `sortOrder` (string, default: desc) - Sort order (asc or desc)

**Example Request:**
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:5000/api/v1/tickets?page=1&limit=10&status=IN_PROCESS&sbu=775"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "ticketNumber": "NPDI-2025-0001",
      "productName": "Chemical Product A",
      "productLine": "Life Science",
      "status": "IN_PROCESS",
      "priority": "HIGH",
      "sbu": "775",
      "createdBy": "john.smith@milliporesigma.com",
      "createdAt": "2025-10-01T10:30:00.000Z",
      "updatedAt": "2025-10-13T14:20:00.000Z",
      "chemicalProperties": {
        "casNumber": "50-00-0",
        "molecularFormula": "CH2O",
        "molecularWeight": 30.026
      },
      "skuVariants": [
        {
          "type": "CONF",
          "sku": "F8775-100G",
          "packageSize": {
            "value": 100,
            "unit": "g"
          },
          "pricing": {
            "listPrice": 125.50,
            "currency": "USD"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

### 2. Get Single Ticket by ID

Retrieve detailed information about a specific ticket by its MongoDB ObjectId.

**Endpoint:** `GET /api/v1/tickets/:id`

**Path Parameters:**
- `id` (string) - MongoDB ObjectId of the ticket

**Example Request:**
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:5000/api/v1/tickets/507f1f77bcf86cd799439011"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "ticketNumber": "NPDI-2025-0001",
    "productName": "Chemical Product A",
    "productLine": "Life Science",
    "productionType": "Produced",
    "status": "IN_PROCESS",
    "priority": "HIGH",
    "sbu": "775",
    "createdBy": "john.smith@milliporesigma.com",
    "assignedTo": "sarah.johnson@milliporesigma.com",
    "chemicalProperties": {
      "casNumber": "50-00-0",
      "molecularFormula": "CH2O",
      "molecularWeight": 30.026,
      "iupacName": "Formaldehyde",
      "physicalState": "Liquid"
    },
    "hazardClassification": {
      "ghsClass": "H300-H399",
      "signalWord": "DANGER",
      "hazardStatements": ["H301", "H311", "H331"]
    },
    "quality": {
      "mqQualityLevel": "MQ300",
      "attributes": []
    },
    "skuVariants": [
      {
        "type": "CONF",
        "sku": "F8775-100G",
        "description": "100g bottle",
        "packageSize": {
          "value": 100,
          "unit": "g"
        },
        "pricing": {
          "standardCost": 45.00,
          "listPrice": 125.50,
          "margin": 64,
          "currency": "USD"
        }
      }
    ],
    "statusHistory": [
      {
        "status": "DRAFT",
        "changedBy": "john.smith@milliporesigma.com",
        "changedAt": "2025-10-01T10:30:00.000Z",
        "reason": "Ticket created",
        "action": "TICKET_CREATED"
      }
    ],
    "comments": [],
    "createdAt": "2025-10-01T10:30:00.000Z",
    "updatedAt": "2025-10-13T14:20:00.000Z"
  }
}
```

---

### 3. Get Ticket by Ticket Number

Retrieve a ticket using its human-readable ticket number (e.g., NPDI-2025-0001).

**Endpoint:** `GET /api/v1/tickets/number/:ticketNumber`

**Path Parameters:**
- `ticketNumber` (string) - Ticket number in format NPDI-YYYY-NNNN

**Example Request:**
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:5000/api/v1/tickets/number/NPDI-2025-0001"
```

**Example Response:**
Same as "Get Single Ticket by ID"

---

### 4. Advanced Search

Perform complex searches with multiple filters and text queries.

**Endpoint:** `POST /api/v1/tickets/search`

**Request Body:**
```json
{
  "query": "formaldehyde",
  "filters": {
    "status": "IN_PROCESS",
    "sbu": ["775", "P90"],
    "priority": "HIGH"
  },
  "page": 1,
  "limit": 25,
  "sortBy": "updatedAt",
  "sortOrder": "desc",
  "fields": ["ticketNumber", "productName", "status", "chemicalProperties"]
}
```

**Body Parameters:**
- `query` (string, optional) - Text search across multiple fields (ticket number, product name, CAS number, etc.)
- `filters` (object, optional) - Additional filters (same as query parameters in GET endpoints)
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 50) - Results per page
- `sortBy` (string, default: createdAt) - Field to sort by
- `sortOrder` (string, default: desc) - Sort order
- `fields` (array, optional) - Specific fields to return (reduces response size)

**Example Request:**
```bash
curl -X POST \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"query":"formaldehyde","filters":{"status":"IN_PROCESS"}}' \
  "http://localhost:5000/api/v1/tickets/search"
```

**Example Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 3,
    "pages": 1
  },
  "searchQuery": "formaldehyde",
  "appliedFilters": {
    "status": "IN_PROCESS"
  }
}
```

---

### 5. Get Ticket Statistics

Retrieve aggregated statistics about tickets.

**Endpoint:** `GET /api/v1/tickets/statistics`

**Example Request:**
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:5000/api/v1/tickets/statistics"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "totalTickets": 142,
    "byStatus": [
      { "_id": "DRAFT", "count": 23 },
      { "_id": "IN_PROCESS", "count": 45 },
      { "_id": "COMPLETED", "count": 68 },
      { "_id": "CANCELED", "count": 6 }
    ],
    "byPriority": [
      { "_id": "LOW", "count": 18 },
      { "_id": "MEDIUM", "count": 67 },
      { "_id": "HIGH", "count": 42 },
      { "_id": "URGENT", "count": 15 }
    ],
    "bySBU": [
      { "_id": "775", "count": 56 },
      { "_id": "P90", "count": 38 },
      { "_id": "440", "count": 28 }
    ],
    "byProductLine": [
      { "_id": "Life Science", "count": 78 },
      { "_id": "Process Solutions", "count": 44 },
      { "_id": "Electronics", "count": 20 }
    ],
    "recentActivity": [...]
  }
}
```

---

### 6. Get Default Template

Retrieve the default ticket template structure with all form configuration details.

**Endpoint:** `GET /api/v1/tickets/template/default`

**Example Request:**
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:5000/api/v1/tickets/template/default"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "template": {
      "id": "507f191e810c19729de860ea",
      "name": "Default Product Ticket Template",
      "description": "Standard template for all product tickets",
      "isDefault": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-10-01T00:00:00.000Z"
    },
    "formConfiguration": {
      "_id": "507f191e810c19729de860eb",
      "name": "Product Ticket Form",
      "version": "1.0.0",
      "sections": [
        {
          "sectionKey": "basicInfo",
          "name": "Basic Information",
          "description": "Core product information",
          "order": 1,
          "fields": [
            {
              "fieldKey": "productName",
              "label": "Product Name",
              "type": "text",
              "required": true,
              "visible": true,
              "editable": true
            },
            {
              "fieldKey": "productLine",
              "label": "Product Line",
              "type": "select",
              "required": true,
              "visible": true,
              "editable": true,
              "options": [
                { "value": "Life Science", "label": "Life Science" },
                { "value": "Process Solutions", "label": "Process Solutions" }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

---

### 7. Get Available Templates

Retrieve all active ticket templates.

**Endpoint:** `GET /api/v1/tickets/templates`

**Example Request:**
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:5000/api/v1/tickets/templates"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f191e810c19729de860ea",
      "name": "Default Product Ticket Template",
      "description": "Standard template for all product tickets",
      "isDefault": true,
      "isActive": true,
      "assignedUsers": [],
      "formConfiguration": {...}
    }
  ]
}
```

---

### 8. Get Tickets by Template

Retrieve all tickets associated with a specific template.

**Endpoint:** `GET /api/v1/tickets/template/:templateId`

**Path Parameters:**
- `templateId` (string) - MongoDB ObjectId of the template

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 50)

**Example Request:**
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:5000/api/v1/tickets/template/507f191e810c19729de860ea?page=1&limit=20"
```

---

### 9. Get Ticket Schema

Retrieve the ticket data schema/structure for understanding available fields.

**Endpoint:** `GET /api/v1/tickets/schema`

**Example Request:**
```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:5000/api/v1/tickets/schema"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "schema": {
      "ticketNumber": {
        "type": "string",
        "description": "Unique ticket identifier"
      },
      "productName": {
        "type": "string",
        "description": "Name of the product"
      },
      "status": {
        "type": "string",
        "description": "Current ticket status",
        "enum": ["DRAFT", "SUBMITTED", "IN_PROCESS", "NPDI_INITIATED", "COMPLETED", "CANCELED"]
      },
      "chemicalProperties": {
        "type": "object",
        "description": "Chemical properties of the product",
        "fields": {
          "casNumber": {
            "type": "string",
            "description": "CAS Registry Number",
            "pattern": "^\\d{1,7}-\\d{2}-\\d$"
          },
          "molecularFormula": {
            "type": "string",
            "description": "Molecular formula"
          }
        }
      }
    },
    "modelName": "ProductTicket",
    "version": "1.0.0"
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

### 401 Unauthorized - Missing API Key
```json
{
  "success": false,
  "message": "API key is required. Please provide an API key in the X-API-Key header."
}
```

### 403 Forbidden - Invalid API Key
```json
{
  "success": false,
  "message": "Invalid API key. Access denied."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Ticket not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to fetch tickets",
  "error": "Detailed error message"
}
```

---

## Data Models

### Ticket Status Values
- `DRAFT` - Initial draft state
- `SUBMITTED` - Submitted for review
- `IN_PROCESS` - Currently being processed
- `NPDI_INITIATED` - NPDI process initiated
- `COMPLETED` - Ticket completed
- `CANCELED` - Ticket canceled

### Priority Values
- `LOW` - Low priority
- `MEDIUM` - Medium priority (default)
- `HIGH` - High priority
- `URGENT` - Urgent priority

### SBU Values
- `775` - SBU 775
- `P90` - P90
- `440` - SBU 440
- `P87` - P87
- `P89` - P89
- `P85` - P85

### Package Units
- `mg` - Milligrams
- `g` - Grams
- `kg` - Kilograms
- `mL` - Milliliters
- `L` - Liters
- `units` - Units
- `vials` - Vials
- `plates` - Plates
- `bulk` - Bulk

---

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Development:** 500 requests per 15 minutes per IP
- **Production:** 100 requests per 15 minutes per IP

When rate limit is exceeded, you'll receive a 429 status code:
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Best Practices

1. **Use Pagination:** Always use pagination for list endpoints to avoid large responses
2. **Filter Early:** Apply filters in the query to reduce data transfer
3. **Select Fields:** Use the `fields` parameter in search to request only needed data
4. **Cache Results:** Cache frequently accessed data on your side
5. **Handle Errors:** Implement proper error handling for all API responses
6. **Secure API Keys:** Never commit API keys to version control
7. **Monitor Usage:** Keep track of your API usage to stay within rate limits

---

## Example Integration (Node.js)

```javascript
const axios = require('axios');

class NPDITicketAPI {
  constructor(apiKey, baseUrl = 'http://localhost:5000/api/v1/tickets') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  async getAllTickets(params = {}) {
    const response = await this.client.get('/', { params });
    return response.data;
  }

  async getTicketById(id) {
    const response = await this.client.get(`/${id}`);
    return response.data;
  }

  async getTicketByNumber(ticketNumber) {
    const response = await this.client.get(`/number/${ticketNumber}`);
    return response.data;
  }

  async searchTickets(searchBody) {
    const response = await this.client.post('/search', searchBody);
    return response.data;
  }

  async getStatistics() {
    const response = await this.client.get('/statistics');
    return response.data;
  }

  async getDefaultTemplate() {
    const response = await this.client.get('/template/default');
    return response.data;
  }
}

// Usage
const api = new NPDITicketAPI('your-api-key-here');

// Get all tickets with filters
api.getAllTickets({ status: 'IN_PROCESS', limit: 10 })
  .then(result => console.log(result))
  .catch(error => console.error(error));

// Search tickets
api.searchTickets({
  query: 'formaldehyde',
  filters: { sbu: '775' }
})
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

---

## Example Integration (Python)

```python
import requests

class NPDITicketAPI:
    def __init__(self, api_key, base_url='http://localhost:5000/api/v1/tickets'):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }

    def get_all_tickets(self, **params):
        response = requests.get(f'{self.base_url}/',
                               headers=self.headers,
                               params=params)
        response.raise_for_status()
        return response.json()

    def get_ticket_by_id(self, ticket_id):
        response = requests.get(f'{self.base_url}/{ticket_id}',
                               headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_ticket_by_number(self, ticket_number):
        response = requests.get(f'{self.base_url}/number/{ticket_number}',
                               headers=self.headers)
        response.raise_for_status()
        return response.json()

    def search_tickets(self, search_body):
        response = requests.post(f'{self.base_url}/search',
                                headers=self.headers,
                                json=search_body)
        response.raise_for_status()
        return response.json()

    def get_statistics(self):
        response = requests.get(f'{self.base_url}/statistics',
                               headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_default_template(self):
        response = requests.get(f'{self.base_url}/template/default',
                               headers=self.headers)
        response.raise_for_status()
        return response.json()

# Usage
api = NPDITicketAPI('your-api-key-here')

# Get tickets with filters
result = api.get_all_tickets(status='IN_PROCESS', limit=10)
print(result)

# Search tickets
search_result = api.search_tickets({
    'query': 'formaldehyde',
    'filters': {'sbu': '775'}
})
print(search_result)
```

---

## Data Structure Details

### Part Numbers and SKU Attribution

When PM-OPS assigns a base part number to a ticket, all SKU variants are automatically associated with that part number:

**Part Number Object:**
```json
{
  "partNumber": {
    "baseNumber": "176036",
    "assignedBy": "sarah.johnson@milliporesigma.com",
    "assignedAt": "2025-10-05T09:15:00.000Z"
  }
}
```

**SKU Variants with Part Number:**
Each SKU variant in the response will include:
- `partNumber`: The base part number from the ticket
- `sku`: The full SKU code (e.g., "176036-100G")

### Forecasted Sales Volume

For PREPACK SKUs only, the API includes forecasted annual sales volume data:

```json
{
  "type": "PREPACK",
  "sku": "176036-100G",
  "partNumber": "176036",
  "packageSize": {
    "value": 100,
    "unit": "g"
  },
  "forecastedSalesVolume": {
    "year1": 5000,
    "year2": 7500,
    "year3": 10000
  }
}
```

**Fields:**
- `year1` (number): Forecasted number of containers for year 1
- `year2` (number): Forecasted number of containers for year 2
- `year3` (number): Forecasted number of containers for year 3

**Notes:**
- Forecast data is only present for PREPACK type SKUs
- Values represent number of containers, not volume
- Fields may be 0 if no forecast was provided
- Non-PREPACK SKUs (CONF, SPEC, VAR, BULK) will not have this field

---

## Support

For issues or questions about the API:
1. Check this documentation first
2. Review error messages carefully
3. Ensure your API key is valid and properly configured
4. Contact the NPDI system administrator

---

## Internal Web API Endpoints

The following endpoints are used by the internal web application and require profile-based authentication (via headers) instead of API keys.

### 1. PubChem CAS Number Lookup

Automatically populate chemical data from PubChem database using CAS number.

**Endpoint:** `GET /api/products/cas-lookup/:casNumber`

**Authentication:** Profile headers (`x-user-role`, `x-user-email`, etc.)

**Path Parameters:**
- `casNumber` (string) - CAS Registry Number in format XXX-XX-X

**Example Request:**
```bash
curl -H "x-user-role: PRODUCT_MANAGER" \
  -H "x-user-email: john.smith@milliporesigma.com" \
  "http://localhost:5000/api/products/cas-lookup/50-00-0"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "casNumber": "50-00-0",
    "molecularFormula": "CH2O",
    "molecularWeight": 30.026,
    "iupacName": "Formaldehyde",
    "synonyms": ["Methanal", "Formalin", "Methylene oxide"],
    "physicalState": "Liquid",
    "ghsClassification": {
      "hazardStatements": ["H301", "H311", "H331"],
      "signalWord": "DANGER"
    }
  }
}
```

**Timeout:** 30 seconds (PubChem API can be slow)

---

### 2. SAP MARA Data Search (via Palantir)

Search SAP MARA dataset for existing product information using material number.

**Endpoint:** `GET /api/products/sap-search/:partNumber`

**Authentication:** Profile headers

**Path Parameters:**
- `partNumber` (string) - SAP Material Number (MATNR field)

**Example Request:**
```bash
curl -H "x-user-role: PM_OPS" \
  -H "x-user-email: sarah.johnson@milliporesigma.com" \
  "http://localhost:5000/api/products/sap-search/176036"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "MATNR": "176036",
    "TEXT_SHORT": "Formaldehyde solution",
    "YYD_CASNR": "50-00-0",
    "YYD_MOLFORMULA": "CH2O",
    "YYD_MOLWEIGHT": "30.026",
    "BRGEW": "1.200",
    "MEINS": "EA"
  },
  "mappedFields": {
    "productName": "Formaldehyde solution",
    "chemicalProperties.casNumber": "50-00-0",
    "chemicalProperties.molecularFormula": "CH2O",
    "chemicalProperties.molecularWeight": 30.026,
    "grossWeight": 1.2,
    "baseUnitOfMeasure": "EA"
  },
  "queryExecutionTime": "2.8s"
}
```

**Performance:**
- Typical query: 2-3 seconds
- Uses Palantir SQL Query API v2
- Async query execution with status polling
- Apache Arrow binary format parsing

**Requirements:**
- VPN connection to Merck network
- Palantir configuration in System Settings
- Valid OAuth2 bearer token

---

### 3. AI Content Generation

Generate marketing content using Azure OpenAI for product descriptions, titles, and features.

**Endpoint:** `POST /api/products/generate-corpbase-content`

**Authentication:** Profile headers

**Request Body:**
```json
{
  "productData": {
    "productName": "Formaldehyde solution",
    "casNumber": "50-00-0",
    "molecularFormula": "CH2O",
    "molecularWeight": 30.026
  },
  "fields": ["productDescription", "websiteTitle", "keyFeatures"],
  "forceTemplate": false
}
```

**Body Parameters:**
- `productData` (object, required) - Product information for content generation
  - `productName` (string, required) - Product name
  - `casNumber` (string, optional) - CAS number
  - `molecularFormula` (string, optional) - Molecular formula
  - `molecularWeight` (number, optional) - Molecular weight
- `fields` (array, optional) - Specific fields to generate (default: all enabled)
- `forceTemplate` (boolean, optional) - Use template-based generation if AI unavailable

**Example Response:**
```json
{
  "success": true,
  "data": {
    "productDescription": "High-purity formaldehyde solution suitable for molecular biology...",
    "websiteTitle": "Formaldehyde Solution - High Purity CH2O",
    "metaDescription": "Premium formaldehyde solution for laboratory use...",
    "keyFeatures": [
      "High purity > 99%",
      "Molecular biology grade",
      "Stabilized formulation",
      "Quality tested",
      "Fast shipping"
    ],
    "applications": [
      "Cell fixation",
      "Tissue preservation",
      "Protein crosslinking",
      "Molecular diagnostics"
    ]
  },
  "generationTime": "3.2s",
  "model": "gpt-4o-mini"
}
```

**Configuration:**
- Azure OpenAI endpoint: Merck NLP API
- Model: gpt-4o-mini (default), gpt-4o, gpt-5-mini
- Max tokens: 2000 per field
- Temperature: 0.5-0.7 (varies by content type)

**Timeout:** 60 seconds

---

### 4. Weight Matrix Management

Manage package size to weight conversions for SKU variants.

#### 4.1 Get All Weight Matrix Entries

**Endpoint:** `GET /api/weight-matrix`

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 50, max: 100) - Results per page

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "packageSize": "100 g",
      "weightGrams": 100,
      "category": "solid",
      "notes": "Standard solid package",
      "createdAt": "2025-10-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 142,
    "pages": 3
  }
}
```

#### 4.2 Search Weight Matrix

**Endpoint:** `GET /api/weight-matrix/search`

**Query Parameters:**
- `q` (string, required) - Search query for package size

**Example Request:**
```bash
curl "http://localhost:5000/api/weight-matrix/search?q=100"
```

#### 4.3 Lookup Weight by Package Size

**Endpoint:** `GET /api/weight-matrix/lookup/:packageSize`

**Path Parameters:**
- `packageSize` (string, URL-encoded) - Package size to lookup

**Example Request:**
```bash
curl "http://localhost:5000/api/weight-matrix/lookup/100%20g"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "packageSize": "100 g",
    "weightGrams": 100,
    "category": "solid"
  }
}
```

#### 4.4 Create Weight Matrix Entry

**Endpoint:** `POST /api/weight-matrix`

**Authentication:** Admin role required

**Request Body:**
```json
{
  "packageSize": "250 mL",
  "weightGrams": 250,
  "category": "liquid",
  "notes": "Standard liquid volume"
}
```

#### 4.5 Update Weight Matrix Entry

**Endpoint:** `PUT /api/weight-matrix/:id`

**Authentication:** Admin role required

#### 4.6 Delete Weight Matrix Entry

**Endpoint:** `DELETE /api/weight-matrix/:id`

**Authentication:** Admin role required

---

### 5. Data Export Endpoints

Export ticket data in various formats.

#### 5.1 Export PDP Checklist

**Endpoint:** `GET /api/products/:id/export-pdp`

**Response Type:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (Excel)

**Example Request:**
```bash
curl -H "x-user-role: PM_OPS" \
  "http://localhost:5000/api/products/507f1f77bcf86cd799439011/export-pdp" \
  --output PDP-Checklist.xlsx
```

#### 5.2 Export Product Information Form

**Endpoint:** `GET /api/products/:id/export-pif`

**Response Type:** Excel file

#### 5.3 Export Ticket Data

**Endpoint:** `GET /api/products/:id/export-data`

**Response Type:** Excel file with all ticket data

---

### 6. Admin Endpoints

#### 6.1 Test Palantir Connection

**Endpoint:** `POST /api/admin/palantir/test-connection`

**Authentication:** Admin role required

**Example Response:**
```json
{
  "success": true,
  "message": "Palantir connection test successful",
  "connectionTime": "2.8s",
  "sampleData": {
    "MATNR": "176036",
    "TEXT_SHORT": "Formaldehyde solution"
  },
  "queryId": "abc123-def456",
  "columnsRetrieved": 296
}
```

#### 6.2 Test Azure OpenAI Connection

**Endpoint:** `POST /api/system-settings/test-azure-openai`

**Authentication:** Admin role required

**Example Response:**
```json
{
  "success": true,
  "message": "Azure OpenAI connection test successful",
  "model": "gpt-4o-mini",
  "responseTime": "1.2s",
  "sampleResponse": "This is a test response from Azure OpenAI."
}
```

#### 6.3 Test PubChem Connection

**Endpoint:** `POST /api/system-settings/test-pubchem`

**Authentication:** Admin role required

---

## Integration Architecture

### Palantir Foundry SQL Query API v2

The SAP MARA search uses Palantir's async SQL query execution:

**Workflow:**
1. Submit query → receive queryId
2. Poll status until "succeeded"
3. Fetch results in Apache Arrow binary format
4. Parse Arrow table to JavaScript objects
5. Map MARA fields to ProductTicket schema

**Benefits:**
- Efficient querying without downloading entire dataset
- Direct SQL access to 250+ MARA columns
- Automatic field mapping
- 2-3 second typical query time vs 45+ seconds for file download

**Documentation:** See `docs/Palantir-SQL-Query-API-Integration-Guide.md`

---

## Changelog

### Version 1.2.0 (2025-11-22)
- Added Palantir SAP MARA search endpoint
- Added Azure OpenAI content generation endpoint
- Added PubChem CAS lookup endpoint
- Added Weight Matrix management endpoints
- Added data export endpoints
- Added admin testing endpoints
- Documented internal web API endpoints

### Version 1.1.0 (2025-10-19)
- Added forecasted sales volume data for PREPACK SKUs
- Enhanced SKU data to include part number attribution
- Improved API response transformation

### Version 1.0.0 (2025-10-13)
- Initial API release
- Support for ticket retrieval and search
- API key authentication
- Template information endpoints
- Statistics and schema endpoints
