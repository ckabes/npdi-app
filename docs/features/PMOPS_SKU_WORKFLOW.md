# PMOps SKU Management & Part Number Assignment

**Last Updated:** 2025-11-23

## Overview

This document describes the PMOps workflow for managing SKU variants and assigning part numbers to product tickets. The system includes visual indicators, automatic status transitions, and data validation to ensure proper ticket processing.

## Part Number Assignment

### Workflow

When a PMOps user assigns a part number to a ticket:

1. **Access SKUs Tab**: Navigate to the ticket details and click on the "SKUs" tab
2. **Assign Part Number**: Enter the base part number (e.g., "1234567") in the input field
3. **Save**: Click "Assign Part Number"
4. **Automatic Status Change**: If the ticket is in `SUBMITTED` status, it automatically transitions to `IN_PROCESS`

### Generated Part Numbers

The system automatically generates full part numbers for each SKU variant by appending suffixes:

- **BULK**: Suffix is always `-BULK`
- **PREPACK**: Suffix is based on package size (e.g., `-100G`, `-1KG`, `-500ML`)
- **VAR**: Suffix is always `-VAR`
- **CONF**: Suffix is always `-CONF`
- **SPEC**: Suffix is always `-SPEC`

**Example:**
- Base part number: `1234567`
- Generated part numbers:
  - `1234567-BULK` (BULK variant)
  - `1234567-100G` (100g PREPACK variant)
  - `1234567-1KG` (1kg PREPACK variant)
  - `1234567-VAR` (VAR variant)
  - `1234567-CONF` (CONF variant)

### Status Transition Rules

| Current Status | Part Number Action | New Status | Notes |
|---------------|-------------------|------------|-------|
| SUBMITTED | Assign part number | IN_PROCESS | Automatic transition |
| IN_PROCESS | Update part number | IN_PROCESS | No status change |
| IN_PROCESS | Add part number | IN_PROCESS | No status change |

## Visual Indicators

### Tab Highlighting

The SKUs tab uses colored indicators to show action items:

1. **Orange Highlight with "!" Badge**: Part number is required (highest priority)
   - Tab border: Orange
   - Background: Orange tint
   - Badge: Orange circle with "!" icon

2. **Blue Highlight with "!" Badge**: BULK SKU is missing (shows only after part number is assigned)
   - Tab border: Blue
   - Background: Blue tint
   - Badge: Blue circle with "!" icon

3. **Normal State**: All required items completed
   - Standard tab styling

**Priority**: Orange (missing part number) takes precedence over blue (missing BULK SKU)

### SKU Type Badges

SKU variants are color-coded for quick identification:

| SKU Type | Badge Color | Row Background | Purpose |
|----------|-------------|----------------|---------|
| BULK | Green | Light green | Base unit variant |
| PREPACK | Yellow | None | Packaged variants |
| VAR | Blue | None | Variable variant |
| CONF | Blue | None | Configuration variant |
| SPEC | Blue | None | Special variant |

### List Price Display

- **Read-only view**: List price is displayed in **bold green** text
- **Edit mode**: Standard input field

## Base Unit Management

### Setting Base Unit

The base unit defines the package size for BULK SKUs and is used for pricing calculations.

**Product Manager Role:**
- Sets base unit during ticket creation
- Default: `1 kg`
- Located in "Base Unit Size" section before pricing

**PMOps Role:**
- Can only edit base unit when actively editing SKUs
- Base unit section appears when "Edit SKUs" is active
- Changes automatically update all BULK SKU package sizes

### Base Unit Constraints

1. **Value must be a number** greater than 0
2. **Unit options**: mg, g, kg, mL, L
3. **BULK SKUs**: Always locked to base unit size
4. **Other SKUs**: Independent package sizes

## SKU Variant Management

### Editing SKUs

1. Click **"Edit SKUs"** button at top of SKUs section
2. Base unit editor becomes visible (if needed)
3. Add, remove, or modify SKU variants
4. Edit part number suffix for each variant (if needed)
5. Click **"Save Changes"** to persist updates

### BULK SKU Special Behavior

BULK SKUs have special rules:

- **Package Size**: Always matches base unit (read-only in table)
- **Other Fields**: Net weight, gross weight, volume, and list price are intentionally blank
- **Cannot Deviate**: Package size cannot be changed independently

### Field Validation

The system validates SKU fields before saving:

- **Package Size Value**: Must be numeric (parsed as Number)
- **Net Weight Value**: Must be numeric (parsed as Number)
- **Gross Weight Value**: Must be numeric (parsed as Number)
- **Volume Value**: Must be numeric (parsed as Number)
- **List Price**: Must be numeric (parsed as Number)

### Package Size Display Rules

| SKU Type | Package Size Display |
|----------|---------------------|
| BULK | Shows base unit value (read-only, labeled "Base Unit") |
| PREPACK | Editable in edit mode, shown in display mode |
| VAR | Shows "N/A" (not applicable) |
| CONF | Shows "N/A" (not applicable) |
| SPEC | Shows "N/A" (not applicable) |

## CorpBase HTML Editing

### HTML List Formatting

The system automatically fixes orphaned `<li>` tags when saving HTML content:

**Before Save:**
```html
<ul>,<li>Item 1
<li>Item 2
```

**After Save (automatically fixed):**
```html
<ul>
<li>Item 1</li>
<li>Item 2</li>
</ul>
```

### HTML Editor Features

Available in Product Description, Key Features, and Applications fields:

1. **Formatting Toolbar**:
   - Bold: `<strong>`
   - Italic: `<em>`
   - Subscript: `<sub>`
   - Superscript: `<sup>`

2. **Special Symbols**:
   - Degree (°): `&deg;`
   - Plus-minus (±): `&plusmn;`
   - Greater/equal (≥): `&ge;`
   - Less/equal (≤): `&le;`
   - Trademark (™): `&trade;`
   - Registered (®): `&reg;`
   - Greek letters: α, β, μ

3. **Live Preview**: Shows formatted HTML as it will appear on website

## Status History Tracking

All PMOps actions are tracked in the ticket's status history:

### Part Number Assignment
```json
{
  "action": "SKU_ASSIGNMENT",
  "reason": "SKU base number assigned: \"1234567\" by John Doe",
  "userInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "role": "PMOps"
  }
}
```

### Status Change on Part Number Assignment
```json
{
  "action": "STATUS_CHANGE",
  "reason": "Status changed from SUBMITTED to IN_PROCESS by John Doe",
  "details": {
    "previousStatus": "SUBMITTED",
    "newStatus": "IN_PROCESS"
  }
}
```

## Data Persistence

### Backend Schema

**ProductTicket Model** (`server/models/ProductTicket.js`):

```javascript
{
  partNumber: {
    baseNumber: String,  // Base part number (e.g., "1234567")
    assignedBy: String,  // Email of PMOps user
    assignedAt: Date     // Timestamp of assignment
  },

  baseUnit: {
    value: Number,       // Numeric value (e.g., 1, 100, 500)
    unit: String         // Unit type: 'mg', 'g', 'kg', 'mL', 'L'
  },

  skuVariants: [{
    type: String,        // BULK, PREPACK, VAR, CONF, SPEC
    suffix: String,      // Part number suffix (e.g., "BULK", "100G", "VAR")
    packageSize: {
      value: Number,     // Numeric value
      unit: String       // Unit type
    },
    netWeight: {
      value: Number,
      unit: String
    },
    grossWeight: {
      value: Number,
      unit: String
    },
    volume: {
      value: Number,
      unit: String
    },
    pricing: {
      listPrice: Number
    }
  }]
}
```

### API Endpoints

**Update Ticket** (`PUT /api/products/:id`):
- Updates part number, base unit, and SKU variants
- Automatically transitions status from SUBMITTED to IN_PROCESS when part number assigned
- Tracks changes in status history

**Used by:**
- `handleSavePartNumber()`: Assigns part number and updates status
- `handleSaveBaseUnit()`: Updates base unit and BULK SKU package sizes
- `handleSaveSKUs()`: Saves all SKU variant changes

## UI Components

### PMOpsTabView Component

**File**: `client/src/components/PMOpsTabView.jsx`

**Key Functions**:

| Function | Purpose | Lines |
|----------|---------|-------|
| `handleSavePartNumber` | Assigns part number, auto-transitions status | 22-60 |
| `handleSaveBaseUnit` | Updates base unit and BULK SKUs | 62-86 |
| `handleEditSKUs` | Enters SKU edit mode | 139-159 |
| `handleSaveSKUs` | Saves SKU variant changes | 255-272 |
| `handleUpdateSKUField` | Updates individual SKU field with type parsing | 200-256 |
| `getPartNumberSuffix` | Generates suffix based on variant type | 113-137 |

**State Management**:
- `partNumber`: Base part number string
- `baseUnit`: Object with numeric value and unit string
- `editingSKUs`: Boolean for edit mode
- `editedSKUs`: Array of SKU variants being edited

## Best Practices

### For PMOps Users

1. **Always assign part number first**: This triggers the status transition
2. **Verify BULK SKU exists**: Check for blue indicator after assigning part number
3. **Set appropriate base unit**: This determines BULK SKU package size
4. **Review generated part numbers**: Verify suffixes are correct for each variant
5. **Use HTML editor for CorpBase fields**: Ensures proper formatting

### For Developers

1. **Always parse numeric inputs**: Use `parseFloat()` for number fields
2. **Validate before save**: Check for required fields and valid values
3. **Track changes**: Add status history entries for significant actions
4. **Use toast notifications**: Provide clear user feedback
5. **Test status transitions**: Verify automatic status changes work correctly

## Troubleshooting

### Common Issues

**Issue**: Base unit save fails with 500 error
- **Cause**: Value sent as string instead of number
- **Solution**: Ensure `parseFloat()` is used in `handleBaseUnitChange`

**Issue**: Orphaned `<li>` tags in saved HTML
- **Cause**: Missing wrapper `<ul>` tags
- **Solution**: System automatically fixes on save via `fixOrphanedListItems()`

**Issue**: Part number assigned but status didn't change
- **Cause**: Ticket not in SUBMITTED status
- **Solution**: Status only auto-transitions from SUBMITTED → IN_PROCESS

**Issue**: BULK SKU package size not updating when base unit changes
- **Cause**: Edit mode not active or BULK SKU doesn't exist
- **Solution**: Enter edit mode first, ensure BULK variant exists

## Related Documentation

- [Architecture Overview](../architecture/ARCHITECTURE.md) - System design
- [API Documentation](../api/API_DOCUMENTATION.md) - REST API reference
- [Form Configuration Guide](../guides/FORM_CONFIGURATION_GUIDE.md) - Form customization

---

**Maintained by:** NPDI Development Team
