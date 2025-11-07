# Form Configuration System - User Guide

## Overview

The Admin Portal now includes a comprehensive Form Configuration system that allows administrators to customize the product ticket submission form without writing code. This includes:

- Editing all field labels, help text, and properties
- Adding custom sections with new fields
- Reordering sections
- Showing/hiding fields and sections
- Setting field types, validation, and grid layout

## Getting Started

### 1. Initialize the Form Configuration Database

Before using the form configuration system, you need to seed the default configuration:

```bash
node server/scripts/seedFormConfig.js
```

This creates the initial form configuration based on the current CreateTicket form structure.

### 2. Access the Form Configuration Editor

1. Log in as an Admin user (Mike Wilson)
2. Navigate to **Admin Dashboard** (via sidebar)
3. Click on **Form Configuration** tab

## Using the Form Configuration Editor

### Visual Editor Features

The Form Configuration editor provides a live preview of how the form will appear to Product Managers, with inline editing capabilities:

#### Editing Field Properties

**Labels & Text:**
- Click on any field label to edit it inline
- Click on help text to modify it
- Click the checkmark icon when done editing

**Field Settings:**
- **Type**: Change between text, textarea, number, select, checkbox, date
- **Grid Size**: Set width (full, half, third, quarter)
- **Required**: Toggle whether field is mandatory
- **Editable**: Control if field can be edited in tickets
- **Visibility**: Show/hide fields using the eye icon
- **Placeholder**: Set placeholder text
- **Default Value**: Set default values for new tickets

#### Managing Sections

**Reordering:**
- Use ↑ ↓ arrows to move sections up/down
- Changes affect the order in the submission form

**Editing Sections:**
- Click pencil icon to edit section name inline
- Edit description below the name
- Click eye icon to show/hide entire sections

**Deleting:**
- Custom sections show a trash icon
- Built-in sections cannot be deleted (protected)

### Adding Custom Content

#### Add Custom Section

1. Click **"+ Add Section"** button (top right)
2. Enter:
   - **Section Key**: Unique identifier (e.g., `customSection1`)
   - **Section Name**: Display name (e.g., "Additional Information")
   - **Description**: Optional section description
3. Click **"Add Section"**

#### Add Custom Field

1. Navigate to the section where you want to add a field
2. Click **"+ Add Custom Field"** at the bottom of the section
3. Configure:
   - **Field Key**: Unique identifier (e.g., `customField1`)
   - **Label**: Display label
   - **Type**: Select field type
   - **Grid Size**: Layout width
   - **Help Text**: Helper text shown below field
   - **Placeholder**: Placeholder text
   - **Required/Visible/Editable**: Toggle options
4. Click **"Add Field"**

### Saving Changes

1. Make all desired changes in the editor
2. Click **"Save Configuration"** (top right)
3. Changes are immediately active for new tickets

## Field Types Available

| Type | Description | Use Cases |
|------|-------------|-----------|
| **Text** | Single-line text input | Names, codes, short values |
| **Textarea** | Multi-line text input | Descriptions, comments, notes |
| **Number** | Numeric input with validation | Quantities, measurements, percentages |
| **Select** | Dropdown menu | Pre-defined options, categories |
| **Checkbox** | Boolean toggle | Yes/no, enable/disable |
| **Date** | Date picker | Deadlines, timestamps |
| **Email** | Email input with validation | Contact information |
| **URL** | URL input with validation | Links, references |

## Grid Layout System

Fields use a responsive grid system:

- **Full Width**: Spans entire width (good for descriptions, long text)
- **Half Width**: 50% width (2 fields per row on desktop)
- **Third Width**: 33% width (3 fields per row on desktop)
- **Quarter Width**: 25% width (4 fields per row on desktop)

*Note: On mobile, all fields stack vertically regardless of grid setting*

## How Changes Appear

### In CreateTicket Form

- Custom sections appear at the end of the form
- Custom fields appear within their designated sections
- Field order follows the configuration
- All validation and requirements are enforced

### In TicketDetails View

- Custom sections display in both view and edit modes
- Fields respect the editable setting
- Data is saved to the ticket document
- Custom sections appear after standard sections

## Data Model

### Form Configuration Structure

```javascript
{
  name: "Product Ticket Form - Default",
  version: "1.0.0",
  isActive: true,
  sections: [
    {
      sectionKey: "basic",
      name: "Basic Information",
      description: "Essential product information",
      visible: true,
      order: 1,
      isCustom: false, // Built-in section
      fields: [
        {
          fieldKey: "productName",
          label: "Product Name",
          type: "text",
          required: true,
          visible: true,
          editable: true,
          placeholder: "Enter product name",
          helpText: "Commercial name of the product",
          gridColumn: "full",
          order: 1,
          isCustom: false // Built-in field
        }
      ]
    }
  ]
}
```

### Field Validation

Fields support validation rules:
- **Pattern**: Regex pattern for text fields
- **Min/Max**: Numeric range limits
- **MinLength/MaxLength**: Text length limits
- **Step**: Increment for number fields

Example:
```javascript
validation: {
  pattern: '^\\d{1,7}-\\d{2}-\\d$', // CAS number format
  min: 0,
  max: 100,
  minLength: 3,
  maxLength: 50,
  step: 0.01
}
```

## API Endpoints

The form configuration system exposes these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/form-config/active` | GET | Get active configuration |
| `/api/form-config/all` | GET | List all configurations (admin) |
| `/api/form-config/:id` | GET | Get specific configuration |
| `/api/form-config` | POST | Create new configuration |
| `/api/form-config/:id` | PUT | Update configuration |
| `/api/form-config/:id/sections/reorder` | PATCH | Reorder sections |
| `/api/form-config/:id/sections` | POST | Add custom section |
| `/api/form-config/:id/sections/:key/fields` | POST | Add custom field |
| `/api/form-config/:id/sections/:key` | DELETE | Delete custom section |
| `/api/form-config/:id/sections/:key/fields/:field` | DELETE | Delete custom field |
| `/api/form-config/:id/activate` | PATCH | Set as active configuration |

## Best Practices

### Field Design

1. **Clear Labels**: Use descriptive, unambiguous labels
2. **Help Text**: Provide context for complex fields
3. **Required Fields**: Only mark essential fields as required
4. **Default Values**: Set sensible defaults to speed up data entry
5. **Grid Layout**: Group related fields using half/third width

### Section Organization

1. **Logical Grouping**: Group related fields into sections
2. **Progressive Disclosure**: Put advanced fields in later sections
3. **Ordering**: Place most important sections first
4. **Descriptions**: Use section descriptions to set context

### Validation

1. **Be Specific**: Use appropriate field types (email, url, number)
2. **Patterns**: Add regex patterns for formatted data (CAS numbers, codes)
3. **Constraints**: Set min/max values where applicable
4. **User-Friendly**: Write clear error messages in help text

## Troubleshooting

### Configuration Not Appearing

**Issue**: Changes don't appear in CreateTicket or TicketDetails

**Solutions**:
1. Verify configuration is set as active
2. Refresh the browser page
3. Check browser console for errors
4. Verify the seed script ran successfully

### Fields Not Saving

**Issue**: Custom field data doesn't save to tickets

**Solution**: Custom fields automatically save to the ticket document. Check:
1. Field key is unique within the section
2. No validation errors preventing save
3. Check server logs for errors

### Layout Issues

**Issue**: Fields don't align properly

**Solutions**:
1. Use consistent grid sizes within a section
2. Remember mobile always stacks vertically
3. Full-width fields break the row

## Advanced Usage

### Version Control

Multiple configurations can exist, but only one is active:

1. Create a new configuration version
2. Make and test changes
3. Activate when ready
4. Previous version remains for rollback

### Conditional Fields

Some fields support conditional display:
```javascript
conditionalDisplay: {
  dependsOn: "productionType",
  value: "Procured"
}
```

This field only shows when `productionType` equals `"Procured"`.

## Components Reference

### Frontend Components

- **FormConfigurationEditor** (`/client/src/components/admin/FormConfigurationEditor.jsx`): Main editor UI
- **DynamicFormSection** (`/client/src/components/forms/DynamicFormSection.jsx`): Renders a section with fields
- **DynamicCustomSections** (`/client/src/components/forms/DynamicCustomSections.jsx`): Renders all custom sections
- **useFormConfig** (`/client/src/hooks/useFormConfig.js`): Hook for loading form configuration

### Backend Components

- **FormConfiguration Model** (`/server/models/FormConfiguration.js`): Mongoose schema
- **Form Config Routes** (`/server/routes/formConfig.js`): API endpoints
- **Seed Script** (`/server/scripts/seedFormConfig.js`): Database initialization

## Limitations

### Protected Elements

- Built-in sections cannot be deleted (basic, chemical, pricing, etc.)
- Built-in fields cannot be deleted
- Specialized sections (Chemical Properties, Quality, SKU, CorpBase) use custom logic and cannot be fully configured

### Field Types

- Select fields require manual option configuration in the editor
- Complex validation (cross-field validation) requires code changes
- File upload fields not currently supported

### Data Migration

- Existing tickets don't automatically get custom fields
- Custom fields only appear in tickets created after configuration
- Changing field types may cause data compatibility issues

## Support & Feedback

For issues or feature requests related to the Form Configuration system:
1. Check server logs for errors
2. Verify form configuration in MongoDB
3. Test with a new ticket to isolate issues
4. Document steps to reproduce any bugs

---

**Last Updated**: 2025-10-12
**Version**: 1.0.0
