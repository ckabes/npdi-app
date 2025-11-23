# SAP MARA to ProductTicket Field Mapping Analysis

**Document Version:** 1.0
**Date:** November 22, 2025
**Analyzed Export:** MARA_Export.csv (Part Number: 176036-BULK)
**Reference:** [SAP MARA Table Documentation](https://leanx.eu/en/sap/table/mara.html)

---

## Executive Summary

This document provides a comprehensive mapping between SAP's MARA (General Material Data) table fields and the NPDI ProductTicket model. The analysis covers 250+ MARA fields from the export and maps them to the ProductTicket schema where applicable.

**Key Statistics:**
- **Total MARA Fields in Export:** 250+
- **Successfully Mapped Fields:** 45
- **Partially Mapped Fields:** 15
- **Unmapped MARA Fields:** 190+ (many are SAP-specific internal fields)
- **Unmapped ProductTicket Fields:** 30+ (NPDI workflow and enrichment fields)

---

## Section 1: Core Product Identification

### ✅ Mapped Fields

| MARA Field | MARA Description | ProductTicket Field | Mapping Notes |
|------------|------------------|---------------------|---------------|
| `MATNR` | Material Number | `skuVariants[].sku` | Maps to individual SKU numbers |
| `BISMT` | Old Material Number | N/A | Could map to `productName` or custom field |
| `TEXT_SHORT` | Short Text Description | `productName` | Direct mapping |
| `TEXT_LONG` | Long Text Description | `corpbaseData.productDescription` | Extended product description |
| `YYD_MTNEX` | Material Name Extension | `skuVariants[].description` | Additional SKU description |

**Data Example:**
- `MATNR`: "176036-BULK"
- `TEXT_SHORT`: "IODOMETHANE-D3, >=99.5 ATOM % D, >=99%"

---

## Section 2: Material Classification & Hierarchy

### ✅ Mapped Fields

| MARA Field | MARA Description | ProductTicket Field | Mapping Notes |
|------------|------------------|---------------------|---------------|
| `MTART` | Material Type | N/A | Fixed as "Standard material" in NPDI |
| `MATKL` | Material Group | `materialGroup` | Direct mapping |
| `SPART` | Division | `sbu` | Business division classification |
| `YYD_YSBU` | Strategic Business Unit | `sbu` | Direct SBU mapping (775, P90, etc.) |
| `PRDHA` | Product Hierarchy | `sialProductHierarchy` | SAP product hierarchy code |
| `PRODH_3` | Product Hierarchy Level 3 | `businessLine.line` | Business line classification |
| `YYD_BRAND` | Brand | `brand` | Brand name (Sigma-Aldrich, Merck, etc.) |
| `YYD_SUBDV` | Subdivision | `businessLine.otherSpecification` | Sub-category details |

**Data Example:**
- `YYD_YSBU`: "775" → `sbu: "775"`
- `YYD_BRAND`: "SA" (Sigma-Aldrich) → `brand: "Sigma-Aldrich"`
- `PRDHA`: "ALO009BFO006" → `sialProductHierarchy: "ALO009BFO006"`

---

## Section 3: Units of Measure & Dimensions

### ✅ Mapped Fields

| MARA Field | MARA Description | ProductTicket Field | Mapping Notes |
|------------|------------------|---------------------|---------------|
| `MEINS` | Base Unit of Measure | `pricingData.baseUnit` | G, ML, KG, etc. |
| `MEINS` | Base Unit of Measure | `skuVariants[].packageSize.unit` | Package unit |
| `BRGEW` | Gross Weight | `skuVariants[].grossWeight` | ⚠️ **MISSING IN MODEL** |
| `NTGEW` | Net Weight | `skuVariants[].netWeight` | ⚠️ **MISSING IN MODEL** |
| `GEWEI` | Weight Unit | N/A | Assumed G (grams) |
| `VOLUM` | Volume | `skuVariants[].volume` | ⚠️ **MISSING IN MODEL** |
| `VOLEH` | Volume Unit | N/A | ML, L |
| `LAENG` | Length | N/A | Not tracked in NPDI |
| `BREIT` | Width | N/A | Not tracked in NPDI |
| `HOEHE` | Height | N/A | Not tracked in NPDI |
| `MEABM` | Unit of Dimension | N/A | Not tracked in NPDI |

**Data Example:**
- `MEINS`: "G" → `baseUnit: "g"`
- `BRGEW`: "1.2" (1.2 grams gross weight)
- `NTGEW`: "1.0" (1.0 grams net weight)
- `VOLUM`: "0.429" (0.429 mL volume)

---

## Section 4: Chemical Properties & Identification

### ✅ Mapped Fields

| MARA Field | MARA Description | ProductTicket Field | Mapping Notes |
|------------|------------------|---------------------|---------------|
| `YYD_CASNR` | CAS Registry Number | `chemicalProperties.casNumber` | Direct mapping |
| `YYD_INHPR` | Ingredient Property | `chemicalProperties.molecularFormula` | Partial mapping |
| `YYD_AKWRT` | Active Ingredient | `composition.components[]` | Component information |

**Data Example:**
- `YYD_CASNR`: "865-50-9" → `chemicalProperties.casNumber: "865-50-9"`

### ⚠️ Partially Mapped / Recommended Additions

| MARA Field | MARA Description | Recommendation |
|------------|------------------|----------------|
| `YYD_YINHA` | Hazardous Ingredient | Add to `chemicalProperties.hazardStatements` |
| `YYD_STOFF` | Substance | Add field for substance classification |
| `YYD_CERPR` | Certificate of Purity | Add to `quality` or `corpbaseData` |

---

## Section 5: Storage & Handling

### ✅ Mapped Fields

| MARA Field | MARA Description | ProductTicket Field | Mapping Notes |
|------------|------------------|---------------------|---------------|
| `TEMPB` | Temperature Condition | `chemicalProperties.storageTemperature` | Storage temperature |
| `RAUBE` | Storage Conditions | `chemicalProperties.storageConditions` | Storage requirements |
| `BEHVO` | Container Requirements | `chemicalProperties.storageConditions.atmosphere` | Atmosphere requirements |

**Data Example:**
- `TEMPB`: "W3" (+2°C to +8°C) → `storageTemperature: "CL (2-8 deg)"`
- `RAUBE`: Storage class code

### 🔄 Complex Mappings

| MARA Field | MARA Description | ProductTicket Field | Mapping Notes |
|------------|------------------|---------------------|---------------|
| `YYD_IATA1` | IATA Shipping Code | `chemicalProperties.shippingConditions` | Requires interpretation |
| `TRAGR` | Transportation Group | `hazardClassification.transportClass` | Hazmat classification |

---

## Section 6: Quality & Compliance

### ✅ Mapped Fields

| MARA Field | MARA Description | ProductTicket Field | Mapping Notes |
|------------|------------------|---------------------|---------------|
| `YYD_QASEG` | Quality Segment | `quality.mqQualityLevel` | MQ100-MQ600 levels |
| `YYD_GMPKZ` | GMP Indicator | `regulatoryInfo` | GMP compliance flag |
| `YYD_QCRES` | QC Responsibility | `quality.attributes[].dataSource` | QC vs Vendor |

**Data Example:**
- `YYD_QASEG`: "200" (Increased Level of Control)
- `YYD_GMPKZ`: GMP compliance indicator

### ⚠️ Partially Mapped

| MARA Field | MARA Description | Recommendation |
|------------|------------------|----------------|
| `YYD_REACH` | REACH Compliance | Add to `regulatoryInfo.reachRegistration` |
| `YYD_TESTS` | Test Specifications | Expand `quality.attributes[]` |
| `YYD_MEDRE` | Medical Device Regulation | Add to `regulatoryInfo` |

---

## Section 7: Lifecycle & Dating

### ✅ Mapped Fields

| MARA Field | MARA Description | ProductTicket Field | Mapping Notes |
|------------|------------------|---------------------|---------------|
| `ERSDA` | Created On | `createdAt` | Creation timestamp |
| `ERNAM` | Created By | `createdBy` | User who created |
| `LAEDA` | Last Change Date | `updatedAt` | Last modification |
| `AENAM` | Changed By | `statusHistory[].changedBy` | Modification history |
| `MHDRZ` | Total Shelf Life | `retestOrExpiration.shelfLifePeriod` | Shelf life in days |
| `MHDHB` | Minimum Remaining Shelf Life | N/A | Not tracked in NPDI |
| `MHDLP` | Period Indicator for SLED | `retestOrExpiration.expirationPeriod` | Expiration period |

**Data Example:**
- `ERSDA`: "2017-02-10" → `createdAt: Date("2017-02-10")`
- `ERNAM`: "X148356" (SAP user) → `createdBy: "user@email.com"`
- `MHDRZ`: "0" (no shelf life restriction in this example)

---

## Section 8: Organizational Ownership

### ✅ Mapped Fields

| MARA Field | MARA Description | ProductTicket Field | Mapping Notes |
|------------|------------------|---------------------|---------------|
| `ORG_PRM` | Product Manager | `createdBy` / Custom field | PM ownership |
| `ORG_PRP` | PMOps Responsible | `assignedTo` | PMOps assignment |
| `PRODH_OWNER` | Product Hierarchy Owner | N/A | Organizational ownership |

**Data Example:**
- `ORG_PRM`: "PRM00800" (Cathy Murphy M236678)
- `ORG_PRP`: "PRP00892" (Connor Kabes M305853)

**Recommendation:** Consider adding dedicated PM/PMOps fields to ProductTicket model

---

## Section 9: Pricing & Forecasting

### ⚠️ Limited Mapping

| MARA Field | MARA Description | ProductTicket Field | Mapping Notes |
|------------|------------------|---------------------|---------------|
| `EKWSL` | Purchasing Value Key | `vendorInformation.purchaseCurrency` | Purchase currency |
| N/A (MARA doesn't store pricing) | List Price | `skuVariants[].pricing.listPrice` | Stored separately in SAP |

**Note:** Pricing data in SAP is typically stored in separate tables (MBEW for valuation, KONP/KONV for pricing conditions), not in MARA.

---

## Section 10: Production Information

### ✅ Mapped Fields

| MARA Field | MARA Description | ProductTicket Field | Mapping Notes |
|------------|------------------|---------------------|---------------|
| `YYD_SOSUB` | Source/Substitution | `productionType` | Produced vs Procured |
| `LABOR` | Laboratory/Office | `primaryPlant` | Production location |
| `YYD_PRDOR` | Production Origin | `countryOfOrigin` | Country of manufacture |

**Data Example:**
- `LABOR`: "2066" (Aldrich Chemical Co. LLC)
- `YYD_PRDOR`: Production origin code

---

## Section 11: Vendor Information (Procured Products)

### ✅ Mapped Fields

| MARA Field | MARA Description | ProductTicket Field | Mapping Notes |
|------------|------------------|---------------------|---------------|
| `YYD_MFRNR` | Manufacturer Number | `vendorInformation.vendorSAPNumber` | Vendor SAP ID |
| `MFRPN` | Manufacturer Part Number | `vendorInformation.vendorProductNumber` | Vendor's product # |

**Data Example:**
- These fields would be populated for procured materials (productionType: "Procured")

---

## Section 12: Intellectual Property & Patents

### ⚠️ Limited Mapping

| MARA Field | MARA Description | ProductTicket Field | Mapping Notes |
|------------|------------------|---------------------|---------------|
| `YYD_ROYAL` | Royalty Indicator | `intellectualProperty.hasIP` | IP flag |
| N/A in MARA | Patent Number | `intellectualProperty.patentNumber` | Patent info |
| N/A in MARA | License Number | `intellectualProperty.licenseNumber` | License info |

---

## Section 13: Status & Workflow

### ✅ Mapped Fields

| MARA Field | MARA Description | ProductTicket Field | Mapping Notes |
|------------|------------------|---------------------|---------------|
| `MSTAE` | Cross-Plant Material Status | `status` | Material status code |
| `VPSTA` | Maintenance Status | N/A | SAP-specific status |
| `PSTAT` | Maintenance Status | N/A | SAP-specific status |
| `LVORM` | Deletion Flag | N/A | Soft delete indicator |

**Data Example:**
- `MSTAE`: "30" (Globally approved) → Could map to `status: "COMPLETED"`

---

## Section 14: EAN/Barcoding

### ⚠️ Not Currently Mapped

| MARA Field | MARA Description | ProductTicket Field | Mapping Notes |
|------------|------------------|---------------------|---------------|
| `EAN11` | EAN/UPC | N/A | **MISSING - Recommend adding** |
| `NUMTP` | EAN Category | N/A | EAN type indicator |

**Data Example:**
- `EAN11`: "4061838008824"

**Recommendation:** Add `barcode` or `ean` field to ProductTicket model for inventory/warehouse integration

---

## Section 15: Digital/Web Properties

### ✅ Mapped Fields

| MARA Field | MARA Description | ProductTicket Field | Mapping Notes |
|------------|------------------|---------------------|---------------|
| `YYD_LSIND` | Listing Indicator | N/A | Internal SAP flag |
| `YYD_LSWEB` | Web Listing Status | N/A | Web availability |
| `YYD_LSWEB_TEXT` | Web Listing Text | N/A | "AL" = Aldrich |

---

## UNMAPPED MARA FIELDS

### Category A: SAP Internal/Technical Fields (Not Needed in NPDI)

**Total:** ~100 fields

These are SAP-specific fields that manage internal system behavior and are not relevant to the NPDI product development workflow:

- `BLANZ`, `WESCH`, `ERGEW`, `ERVOL`, `GEWTO`, `VOLTO`, `FUELG`, `STFAK`, `RBNRM` - Additional weight/volume calculations
- `INHAL`, `VPREH`, `INHBR`, `CUOBF`, `COMPL` - Content/completeness indicators
- `MAXC`, `MAXC_TOL`, `MAXL`, `MAXB`, `MAXH` - Maximum dimension tolerances
- `QQTIME`, `QGRP`, `PRODUCTOID`, `SDM_VERSION` - Quality time, grouping, versioning
- `ANP`, `NEWPROD_INDI`, `PRD_STARTDT`, `PRD_ENDDT`, `INV_PLN_MODE` - Product lifecycle flags
- `FLAGCLASS` - Classification flag
- `/BEV1/LULEINH`, `/VSO/*` fields - Industry-specific (beverage, retail) extensions
- `SOM_CTR_AUTORENEWAL`, `DFS_*` fields - Distribution/renewal settings
- `ADSPC_SPC`, `TOLERANCE_TYPE`, `COLOR_ATINN`, `SIZE1_ATINN`, `SIZE2_ATINN` - Variant characteristic links
- `FIBER_PART*` - Textile industry fields (not applicable)

### Category B: Custom YYD Fields (Millipore Sigma Specific)

**Total:** ~80 fields

Many YYD (custom) fields are specific to Millipore Sigma SAP implementation and don't have direct NPDI equivalents:

**Layout/Display Fields:**
- `L08_LAYOUT`, `M80_LAYOUT`, `SPD_LAYOUT`, `SPE_LAYOUT`, `SPN_LAYOUT`

**Obscure Codes:**
- `YYD_YLOME`, `YYD_YME01`, `YYD_COGSI`, `YYD_YEXX1`
- `YYD_YOME0`, `YYD_YPAGR`, `YYD_YSPGW`, `YYD_YKZLP`
- `YYD_LGSSG`, `YYD_SGSSG`, `YYD_STPUV`
- `YYD_ORAST`, `YYD_ORATL`, `YYD_OSLCR`, `YYD_SELLF`
- `YYD_NOCON`, `YYD_MATVE`
- `YYD_PHOPH`, `YYD_EHSTA`, `YYD_MTCTS`, `YYD_MATAT`, `YYD_ENSUB`

**Pigment/Color Fields (Not Applicable):**
- `YYD_LCAPP`, `YYD_LCDOP`, `YYD_LCMIX`
- `YYD_PIGCO`, `YYD_PIGCR`, `YYD_PIGCT`, `YYD_PIGFR`, `YYD_PIGTY`, `YYD_PIGPS`, `YYD_PIGST`

**Manufacturing Codes:**
- `YYD_GBGLM`, `YYD_GBTXT`, `YYD_GFMNG`, `YYD_VPMAT`, `YYD_VPPRO`
- `YYD_YMEGG`, `YYD_YPKGG`, `YYD_YUFGG`, `YYD_YBAT1`, `YYD_YBAT2`, `YYD_YGMP2`
- `YYD_STAPL`, `YYD_DARFO`, `YYD_LEADM`, `YYD_PURPO`

**Miscellaneous:**
- `YYD_CONTT`, `YYD_COMCO`, `YYD_PPUNI`, `YYD_WEICC`, `YYD_AIUNI`
- `YYD_SCMCL`, `YYD_ABCCL`, `YYD_EXPID`, `YYD_TESTD`, `YYD_PMSTA`
- `YYD_ALLLA`, `YYD_YGMAT`, `YYD_SDREQ`, `YYD_MATTY`, `YYD_YVOCW`
- `YYD_TCTPL`, `YYD_LAGRP`, `YYD_QSPSQ`, `YYD_RQCMG`, `YYD_INHSC`
- `YYD_ADOSS`, `YYD_VISCO`, `YYD_NPSDT`, `YYD_NPEDT`, `YYD_ARREL`
- `YYD_MSDS`, `YYD_SERFL`, `YYD_DIAVA`, `YYD_DICAL`, `YYD_APIQT`
- `YYD_IMCOD`, `YYD_PLPHP`, `YYD_AIDOS`, `YYD_ADCOM`, `YYD_PROJI`
- `YYD_BUSTR`, `YYD_YPKGQ`, `YYD_MRESP`, `YYD_PRDSG`, `YYD_STIND`
- `YYD_DFC`, `YYD_DOM`, `YYD_RTIND`, `YYD_UNIIC`, `YYD_EFCAT`
- `YYD_MATAG`, `YYD_MATAI`, `YYD_AGRLV`, `YYD_TTLOG`
- `YYD_ALTEH`, `YYD_ALTEL`, `YYD_QLOGS`, `YYD_LOGPN`, `YYD_QLOGC`, `YYD_QLOGL`
- `YYD_MATDE`, `YYD_AMSTAE`, `YYD_AMAKTX`

### Category C: Potentially Useful Fields (Recommend Investigation)

These fields may have business value but need clarification from SAP users:

| MARA Field | Description Hint | Potential Use |
|------------|------------------|---------------|
| `YYD_TRADE` | Trade/Export Status | Export compliance |
| `YYD_YLOGO` | Logo/Branding | Marketing assets |
| `YYD_APORL` | APO Relevant | Supply chain planning |
| `YYD_AINAM` | AI Name/Description | AI-generated content flag |
| `YYD_MROLE` | Material Role | Product categorization |
| `YYD_YIFRS` | IFRS Indicator | Financial reporting |
| `YYD_MTYQU` | Material Quality Type | Additional quality classification |
| `YYD_ARTTY` | Article Type | Product classification |

---

## UNMAPPED PRODUCTTICKET FIELDS

The following ProductTicket fields do NOT have direct MARA equivalents because they are specific to the NPDI workflow:

### A. NPDI Workflow Fields

| ProductTicket Field | Purpose | Why Not in MARA |
|---------------------|---------|-----------------|
| `ticketNumber` | NPDI tracking number | NPDI-specific workflow ID |
| `status` | Workflow status (DRAFT, SUBMITTED, IN_PROCESS, etc.) | NPDI workflow states |
| `priority` | Request priority (LOW, MEDIUM, HIGH, URGENT) | NPDI prioritization |
| `assignedTo` | PMOps assignment | NPDI workflow assignment |
| `partNumber.baseNumber` | Assigned part number | Generated during NPDI process |
| `partNumber.assignedBy` | Who assigned part number | NPDI process tracking |
| `partNumber.assignedAt` | When part number assigned | NPDI process tracking |
| `npdiTracking.*` | NPDI external tracking | NPDI workflow integration |
| `launchTimeline.*` | Product launch milestones | NPDI project management |
| `statusHistory[]` | Status change audit trail | NPDI workflow history |
| `comments[]` | User comments/collaboration | NPDI collaboration feature |

### B. PubChem Auto-Population Fields

| ProductTicket Field | Purpose | Why Not in MARA |
|---------------------|---------|-----------------|
| `chemicalProperties.pubchemCID` | PubChem compound ID | NPDI enrichment feature |
| `chemicalProperties.pubchemData.*` | Raw PubChem API data | NPDI enrichment feature |
| `chemicalProperties.autoPopulated` | Auto-population flag | NPDI enrichment tracking |
| `chemicalProperties.inchi` | InChI identifier | Auto-populated from PubChem |
| `chemicalProperties.inchiKey` | InChI key | Auto-populated from PubChem |
| `chemicalProperties.canonicalSMILES` | SMILES notation | Auto-populated from PubChem |
| `chemicalProperties.isomericSMILES` | Isomeric SMILES | Auto-populated from PubChem |
| `chemicalProperties.synonyms[]` | Chemical synonyms | Auto-populated from PubChem |
| `chemicalProperties.additionalProperties.*` | Extended chemical properties | Auto-populated from PubChem |
| `chemicalProperties.solubility[]` | Solubility data | Auto-populated from PubChem |
| `hazardClassification.pubchemGHS.*` | GHS data from PubChem | Auto-populated from PubChem |

### C. NPDI-Specific Business Logic

| ProductTicket Field | Purpose | Why Not in MARA |
|---------------------|---------|-----------------|
| `productionType` | Produced vs Procured | NPDI decision point |
| `distributionType.*` | Distribution model (Standard/POD/DTS) | NPDI business model |
| `distributionType.coaCreator` | COA responsibility | NPDI POD/DTS details |
| `distributionType.labelingType` | Labeling model | NPDI POD/DTS details |
| `distributionType.labelingResponsibility` | Who labels | NPDI POD/DTS details |
| `distributionType.vendorLabelSource` | How vendor gets labels | NPDI POD/DTS details |
| `productScope.*` | Geographic distribution scope | NPDI market planning |
| `businessLine.*` | Business line classification | NPDI categorization |
| `intellectualProperty.*` | IP tracking | NPDI IP management |
| `skuVariants[].type` | SKU type (BULK/PREPACK/etc.) | NPDI SKU strategy |
| `skuVariants[].forecastedSalesVolume` | Sales forecasts | NPDI business planning |
| `pricingData.standardCosts.*` | Cost breakdown | NPDI cost modeling |
| `pricingData.targetMargin` | Target profit margin | NPDI pricing strategy |
| `corpbaseData.aiGenerated` | AI content flag | NPDI AI features |
| `corpbaseData.generatedAt` | AI generation timestamp | NPDI AI features |
| `corpbaseData.targetMarkets[]` | Target markets | NPDI marketing planning |
| `corpbaseData.competitiveAdvantages[]` | Competitive positioning | NPDI marketing content |
| `corpbaseData.technicalSpecifications` | Technical details | NPDI content management |
| `corpbaseData.qualityStandards[]` | Quality standards | NPDI compliance tracking |
| `quality.attributes[]` | Quality test attributes | NPDI quality planning |
| `composition.components[]` | Product composition | NPDI formulation details |
| `regulatoryInfo.*` | Regulatory compliance | NPDI compliance tracking |

---

## RECOMMENDATIONS

### 1. Add Missing Fields to ProductTicket Model

**High Priority:**
- `skuVariants[].grossWeight` and `.netWeight` (map from BRGEW, NTGEW)
- `skuVariants[].volume` (map from VOLUM)
- `skuVariants[].ean` or `barcode` (map from EAN11)
- `productManager` and `pmOpsAssigned` dedicated fields (map from ORG_PRM, ORG_PRP)
- `materialStatus` SAP status field (map from MSTAE)

**Medium Priority:**
- `manufacturerInfo.manufacturerName` (map from LABOR)
- `manufacturerInfo.manufacturerPartNumber` (map from MFRPN)
- `webListingStatus` (map from YYD_LSWEB)
- `exportCompliance` flags

### 2. Create Bidirectional Sync Strategy

For fields that exist in both systems:

**SAP MARA → ProductTicket (Import on NPDI Initiation):**
- Material number → SKU
- CAS number → chemicalProperties.casNumber
- Brand → brand
- SBU → sbu
- Storage conditions → storageTemperature
- Weights/dimensions → SKU variants

**ProductTicket → SAP MARA (Export after NPDI Completion):**
- productName → TEXT_SHORT
- Product description → TEXT_LONG
- Quality level → YYD_QASEG
- Shelf life periods → MHDRZ, MHDLP
- Chemical properties → YYD_CASNR

### 3. Fields Requiring Human Review/Mapping

Some MARA codes need business user interpretation:
- `TEMPB` codes to temperature ranges
- `YYD_QASEG` to MQ quality levels
- `LABOR` codes to plant names
- `YYD_BRAND` codes to full brand names

### 4. Data Validation Rules

Implement validation on import:
- CAS number format matching
- Unit of measure standardization (G vs g)
- Status code translation
- Date format conversion

---

## Similar Products Search Feature

### Overview

The Similar Products Search feature allows users to discover related products that share the same CAS number. This is particularly useful for:
- Finding existing SKUs before creating new products
- Identifying product families and variants
- Cross-referencing material numbers across different brands or divisions

### Field Mapping

| ProductTicket Field | Description | Data Source |
|---------------------|-------------|-------------|
| `similarProducts` | Comma-separated list of material numbers | Palantir MARA query by CAS |

### Implementation Details

**Search Endpoint:**
```
GET /api/products/similar-products/:casNumber
```

**Query Parameters:**
- `maxResults` (default: 3) - Maximum number of results to return
- `maxSearchTime` (default: 20000ms) - Maximum search time before timeout

**Response Format:**
```json
{
  "success": true,
  "message": "Found 3 similar products",
  "products": [
    {
      "MATNR": "176036-BULK",
      "TEXT_SHORT": "IODOMETHANE-D3, >=99.5 ATOM % D, >=99%"
    },
    {
      "MATNR": "176036-1G",
      "TEXT_SHORT": "IODOMETHANE-D3, >=99.5 ATOM % D, >=99%"
    },
    {
      "MATNR": "176036-5G",
      "TEXT_SHORT": "IODOMETHANE-D3, >=99.5 ATOM % D, >=99%"
    }
  ],
  "searchTime": 2,
  "casNumber": "865-50-9"
}
```

### SQL Query

The feature uses Palantir's SQL Query API v2 to search the MARA dataset:

```sql
SELECT DISTINCT MATNR, TEXT_SHORT
FROM `{datasetRID}`
WHERE YYD_CASNR = '{casNumber}'
  AND MATNR IS NOT NULL
  AND MATNR != ''
ORDER BY MATNR
LIMIT {maxResults * 10}
```

### User Interface Integration

1. **Location:** Basic Information section of the product ticket form
2. **Field Type:** Text input with search button
3. **Behavior:**
   - User must enter a valid CAS number first
   - Click "Search" button to open Similar Products popup
   - Select material numbers from search results
   - Selected material numbers populate as comma-separated values

### Use Cases

1. **SKU Discovery:** Before creating a new product, check if similar SKUs already exist
2. **Product Family:** Identify all package sizes for a given chemical compound
3. **Cross-Brand:** Find equivalent products across different brands (Sigma, Merck, etc.)
4. **Data Validation:** Verify CAS numbers match expected product families

### Performance Characteristics

- **Search timeout:** 20 seconds maximum
- **Result limit:** 3 products (configurable)
- **Deduplication:** Automatic removal of duplicate material numbers
- **Early termination:** Stops searching once target number of results found

---

## APPENDIX A: Sample Data Mapping (Part 176036-BULK)

```
MARA Export → ProductTicket Mapping:

MATNR: "176036-BULK" → skuVariants[0].sku: "176036-BULK"
TEXT_SHORT: "IODOMETHANE-D3, >=99.5 ATOM % D, >=99%" → productName
YYD_CASNR: "865-50-9" → chemicalProperties.casNumber: "865-50-9"
YYD_YSBU: "775" → sbu: "775"
YYD_BRAND: "SA" → brand: "Sigma-Aldrich"
MEINS: "G" → pricingData.baseUnit: "g"
BRGEW: "1.2" → [ADD FIELD] skuVariants[0].grossWeight: 1.2
NTGEW: "1.0" → [ADD FIELD] skuVariants[0].netWeight: 1.0
VOLUM: "0.429" → [ADD FIELD] skuVariants[0].volume: 0.429
TEMPB: "W3" → chemicalProperties.storageTemperature: "CL (2-8 deg)"
PRDHA: "ALO009BFO006" → sialProductHierarchy: "ALO009BFO006"
ERSDA: "2017-02-10" → createdAt: Date("2017-02-10")
EAN11: "4061838008824" → [ADD FIELD] skuVariants[0].ean: "4061838008824"
```

---

## APPENDIX B: MARA Field Reference

For complete field definitions, consult:
- [LeanX SAP MARA Documentation](https://leanx.eu/en/sap/table/mara.html)
- [SAP Datasheet MARA](https://www.sapdatasheet.org/abap/tabl/mara.html)
- [SE80 MARA Reference](https://www.se80.co.uk/sap-tables/?name=mara)

---

## APPENDIX C: Glossary

**MARA:** General Material Data - SAP MM (Materials Management) master table
**NPDI:** New Product Development & Introduction
**SBU:** Strategic Business Unit
**SKU:** Stock Keeping Unit
**CAS:** Chemical Abstracts Service registry number
**GHS:** Globally Harmonized System of Classification and Labelling
**GMP:** Good Manufacturing Practice
**EAN:** European Article Number (barcode)
**POD:** Purchase on Demand
**DTS:** Dock to Stock
**MQ:** Milli-Q (quality classification levels)

---

**Document Prepared By:** Claude AI Assistant
**For:** NPDI Application Development
**Contact:** Review with SAP MM team for custom YYD field clarifications
