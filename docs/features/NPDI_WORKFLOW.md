# NPDI Workflow - Ticket Number Transition

## Overview

When a ticket is initiated in the NPDI (New Product Development & Introduction) system, the **ticket number changes** from the original system-generated number to the external NPDI tracking number.

## Ticket Number Flow

### Phase 1: Initial Creation
- **System Action**: Auto-generates ticket number
- **Format**: `NPDI-YYYY-####` (e.g., `NPDI-2025-0055`)
- **Status**: `SUBMITTED` or `DRAFT`
- **Visible**: In all dashboards, ticket details, and activity logs

### Phase 2: SKU Assignment (PMOps)
- **Status**: Changes to `IN_PROCESS` after SKU assignment
- **Ticket Number**: Still uses original system-generated number
- **Example**: `NPDI-2025-0055`

### Phase 3: NPDI Initiation (PMOps)
- **PMOps Action**: Enters external NPDI tracking number from NPDI system
- **Input Example**: `NPDI-2025-0054` (from external NPDI system)
- **System Action**:
  - ✅ **REPLACES** the original ticket number with the new NPDI tracking number
  - ✅ Status changes to `NPDI_INITIATED`
  - ✅ Ticket becomes **locked and non-editable**
  - ✅ Activity log records the ticket number change

### Ticket Number Change Example

```
BEFORE NPDI Initiation:
  Ticket Number: NPDI-2025-0055 (system-generated)
  Status: IN_PROCESS

PMOps enters: NPDI-2025-0054 (from external NPDI system)

AFTER NPDI Initiation:
  Ticket Number: NPDI-2025-0054 (from external NPDI system)
  Status: NPDI_INITIATED
  NPDI Tracking: NPDI-2025-0054
```

## Activity History Entry

When NPDI is initiated, the system logs:

```
🚀 NPDI Initiated
Status: NPDI_INITIATED
Action: NPDI_INITIATED
Message: "NPDI initiated by [User Name]. Ticket number changed from 'NPDI-2025-0055' to 'NPDI-2025-0054'. NPDI Tracking: NPDI-2025-0054"
Details:
  - previousTicketNumber: NPDI-2025-0055
  - newTicketNumber: NPDI-2025-0054
  - npdiTrackingNumber: NPDI-2025-0054
  - initiatedAt: 2025-01-11T...
  - initiatedBy: user@example.com
```

## Where the Ticket Number Appears

After NPDI initiation, the **new ticket number** (NPDI-2025-0054) appears in:

1. ✅ **Ticket Header** - Top of ticket details page
2. ✅ **NPDI Banner** - "NPDI Initiated: NPDI-2025-0054"
3. ✅ **Dashboard List** - All ticket listings
4. ✅ **Activity History** - Shows the transition
5. ✅ **Database** - `ticketNumber` field updated
6. ✅ **Search Results** - Searchable by new number
7. ✅ **Exports/Reports** - Uses new number

## Important Notes

### Why the Number Changes
- The original number (NPDI-2025-0055) is the **internal system tracking number**
- The new number (NPDI-2025-0054) is the **official NPDI tracking number** from the external NPDI system
- The official NPDI number becomes the primary identifier once initiated

### Traceability
- The **original ticket number** is preserved in the activity history
- The transition is fully logged and auditable
- Users can see both numbers in the activity log entry

### Non-Editability
- Once NPDI is initiated, the ticket is **permanently locked**
- The ticket number cannot be changed again
- All further changes must be made in the external NPDI system

### Search Considerations
- After NPDI initiation, search by the **new number** (NPDI-2025-0054)
- The old number (NPDI-2025-0055) may still be searchable in activity history text
- Activity logs maintain full traceability between old and new numbers

## Technical Implementation

### Database Fields
```javascript
{
  ticketNumber: "NPDI-2025-0054",  // Updated to NPDI tracking number
  npdiTracking: {
    trackingNumber: "NPDI-2025-0054",
    initiatedAt: Date,
    initiatedBy: "user@example.com"
  },
  status: "NPDI_INITIATED",
  statusHistory: [
    {
      action: "NPDI_INITIATED",
      reason: "Ticket number changed from NPDI-2025-0055 to NPDI-2025-0054",
      details: {
        previousTicketNumber: "NPDI-2025-0055",
        newTicketNumber: "NPDI-2025-0054"
      }
    }
  ]
}
```

### Backend Logic
- The `ticketNumber` field is normally protected and cannot be changed
- Exception: When `status === 'NPDI_INITIATED'` AND `npdiTracking.trackingNumber` is provided
- The system validates and allows the ticket number update only during NPDI initiation

### Frontend Display
- All components read from `ticket.ticketNumber`
- After NPDI initiation, this automatically shows the new number
- No special handling needed - the field just contains the new value

## User Experience Flow

### For PMOps

1. **See Ticket** with original number: `NPDI-2025-0055`
2. **Complete to-dos**: Assign SKUs, base part number
3. **Status changes** to `IN_PROCESS`
4. **NPDI Initiation section appears** at top of page
5. **Enter official NPDI number** from external system: `NPDI-2025-0054`
6. **Click "Initiate NPDI"**
7. **Success message**: "NPDI initiated! Ticket number updated to NPDI-2025-0054"
8. **Ticket header now shows**: `NPDI-2025-0054`
9. **Green banner displays**: "NPDI Initiated: NPDI-2025-0054"
10. **Activity log shows**: "Ticket number changed from NPDI-2025-0055 to NPDI-2025-0054"

### For All Users

After NPDI initiation:
- Search for ticket using new number: `NPDI-2025-0054` ✅
- Old number in activity history for reference
- Ticket is locked - no edits allowed
- Clear indication that NPDI has been initiated

## Security Considerations

- Only PMOps and Admin roles can initiate NPDI
- Ticket number change is one-way and permanent
- Full audit trail maintained in activity history
- Original ticket number preserved for compliance
