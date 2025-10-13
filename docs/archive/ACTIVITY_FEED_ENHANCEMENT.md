# Activity Feed Enhancement

**Date:** 2025-10-12
**Objective:** Add detailed activity feed to Product Manager dashboard showing status changes, comments, and ticket edits

---

## Overview

Enhanced the Product Manager dashboard to replace the generic "Recent Status Updates" section with a rich activity feed that shows specific details about:
- Status changes
- Comments added
- Ticket edits
- SKU assignments
- Ticket creation

---

## Changes Made

### 1. Backend - New Endpoint ✅

**File:** `/server/controllers/productController.js`

**New Function:** `getRecentActivity`
- Aggregates activities from `statusHistory` and `comments` arrays
- Returns unified activity feed with type, description, user info, timestamp
- Supports multiple activity types:
  - `STATUS_CHANGE` - Status transitions
  - `COMMENT_ADDED` - New comments
  - `TICKET_EDIT` - Ticket modifications
  - `SKU_ASSIGNMENT` - SKU assignments
  - `TICKET_CREATED` - New ticket creation
  - `NPDI_INITIATED` - NPDI process started

**Implementation:**
```javascript
const getRecentActivity = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get all active tickets with status history and comments
    const tickets = await ProductTicket.find({
      status: { $nin: ['CANCELED'] }
    }).select('ticketNumber productName status priority chemicalProperties statusHistory comments updatedAt')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit) * 3);

    const activities = [];

    // Extract activities from status history
    tickets.forEach(ticket => {
      if (ticket.statusHistory && ticket.statusHistory.length > 0) {
        ticket.statusHistory.forEach(history => {
          if (history.action && history.changedAt) {
            activities.push({
              type: history.action,
              ticketId: ticket._id,
              ticketNumber: ticket.ticketNumber,
              productName: ticket.productName || ticket.chemicalProperties?.casNumber || 'Untitled',
              status: ticket.status,
              priority: ticket.priority,
              timestamp: history.changedAt,
              description: history.reason,
              user: history.userInfo ? `${history.userInfo.firstName} ${history.userInfo.lastName}` : 'Unknown User',
              userInfo: history.userInfo,
              details: {
                action: history.action,
                previousStatus: history.details?.previousStatus,
                newStatus: history.details?.newStatus || history.status
              }
            });
          }
        });
      }

      // Extract activities from comments
      if (ticket.comments && ticket.comments.length > 0) {
        ticket.comments.forEach(comment => {
          activities.push({
            type: 'COMMENT_ADDED',
            ticketId: ticket._id,
            ticketNumber: ticket.ticketNumber,
            productName: ticket.productName || ticket.chemicalProperties?.casNumber || 'Untitled',
            status: ticket.status,
            priority: ticket.priority,
            timestamp: comment.timestamp,
            description: `Comment: "${comment.content.substring(0, 100)}${comment.content.length > 100 ? '...' : ''}"`,
            user: comment.userInfo ? `${comment.userInfo.firstName} ${comment.userInfo.lastName}` : 'Unknown User',
            userInfo: comment.userInfo,
            details: {
              action: 'COMMENT_ADDED',
              commentContent: comment.content
            }
          });
        });
      }
    });

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Return only the requested limit
    const recentActivities = activities.slice(0, parseInt(limit));

    res.json({
      activities: recentActivities,
      total: activities.length
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ message: 'Server error while fetching recent activity' });
  }
};
```

**Route Added:** `/server/routes/products.js`
```javascript
router.get('/recent-activity', productController.getRecentActivity);
```

---

### 2. API Client Update ✅

**File:** `/client/src/services/api.js`

**New Method:**
```javascript
export const productAPI = {
  // ... existing methods ...
  getRecentActivity: (params) => apiClient.get('/products/recent-activity', { params }),
  // ...
};
```

---

### 3. Dashboard Component Update ✅

**File:** `/client/src/pages/Dashboard.jsx`

#### Added Icons:
```javascript
import {
  // ... existing icons ...
  ArrowPathIcon,      // Status changes
  ChatBubbleLeftIcon, // Comments
  PencilIcon,         // Edits
  CheckIcon           // Assignments
} from '@heroicons/react/24/outline';
```

#### Updated State:
```javascript
const [recentActivity, setRecentActivity] = useState([]); // Replaces recentlyUpdated
```

#### Updated Data Fetching:
```javascript
const fetchRecentTickets = async () => {
  try {
    // Fetch recent tickets (last 5)
    const response = await productAPI.getTickets({ page: 1, limit: 5 });
    setRecentTickets(response.data.tickets || []);

    // Fetch recent activity (status changes, comments, edits)
    const activityResponse = await productAPI.getRecentActivity({ limit: 10 });
    setRecentActivity(activityResponse.data.activities || []);
  } catch (error) {
    console.error('Failed to fetch recent tickets:', error);
  }
};
```

#### Added Helper Functions:

**1. Activity Icon Mapper:**
```javascript
const getActivityIcon = (activityType) => {
  switch (activityType) {
    case 'STATUS_CHANGE':
      return <ArrowPathIcon className="h-5 w-5 text-blue-600" />;
    case 'COMMENT_ADDED':
      return <ChatBubbleLeftIcon className="h-5 w-5 text-green-600" />;
    case 'TICKET_EDIT':
      return <PencilIcon className="h-5 w-5 text-orange-600" />;
    case 'SKU_ASSIGNMENT':
      return <CheckIcon className="h-5 w-5 text-purple-600" />;
    case 'TICKET_CREATED':
      return <PlusIcon className="h-5 w-5 text-gray-600" />;
    default:
      return <ClockIcon className="h-5 w-5 text-gray-600" />;
  }
};
```

**2. Activity Background Color:**
```javascript
const getActivityBgColor = (activityType) => {
  switch (activityType) {
    case 'STATUS_CHANGE':
      return 'bg-blue-50 border-blue-200';
    case 'COMMENT_ADDED':
      return 'bg-green-50 border-green-200';
    case 'TICKET_EDIT':
      return 'bg-orange-50 border-orange-200';
    case 'SKU_ASSIGNMENT':
      return 'bg-purple-50 border-purple-200';
    case 'TICKET_CREATED':
      return 'bg-gray-50 border-gray-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};
```

**3. Time Ago Formatter:**
```javascript
const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return time.toLocaleDateString();
};
```

#### New Activity Feed UI:
```javascript
{/* Recent Activity Feed */}
<div className="card">
  <div className="card-header">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
      <Link to="/tickets" className="text-sm text-millipore-blue hover:text-millipore-blue-dark">
        View All →
      </Link>
    </div>
  </div>
  <div className="card-body p-0">
    {recentActivity.length > 0 ? (
      <div className="divide-y divide-gray-200">
        {recentActivity.slice(0, 8).map((activity, index) => (
          <Link
            key={`${activity.ticketId}-${activity.timestamp}-${index}`}
            to={`/tickets/${activity.ticketId}`}
            className={`block px-6 py-4 hover:bg-gray-50 transition-colors border-l-4 ${getActivityBgColor(activity.type)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.ticketNumber}
                  </p>
                  <StatusBadge status={activity.status} />
                  {activity.priority && <PriorityBadge priority={activity.priority} />}
                </div>
                <p className="text-sm text-gray-700 mb-1 line-clamp-2">
                  {activity.description}
                </p>
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span className="font-medium">{activity.user}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    ) : (
      <div className="px-6 py-8 text-center text-gray-500">
        <p>No recent activity</p>
      </div>
    )}
  </div>
</div>
```

---

## Visual Design

### Activity Types and Colors:

| Activity Type | Icon | Border Color | Background |
|---------------|------|--------------|------------|
| STATUS_CHANGE | 🔄 Arrow (blue) | Blue | Blue tint |
| COMMENT_ADDED | 💬 Chat bubble (green) | Green | Green tint |
| TICKET_EDIT | ✏️ Pencil (orange) | Orange | Orange tint |
| SKU_ASSIGNMENT | ✓ Check (purple) | Purple | Purple tint |
| TICKET_CREATED | ➕ Plus (gray) | Gray | Gray tint |

### Layout Structure:

```
┌────────────────────────────────────────────┐
│ Recent Activity                [View All →]│
├────────────────────────────────────────────┤
│ ┃ 🔄  NPDI-2025-0005  [IN_PROCESS] [HIGH] │
│ ┃     Status changed from SUBMITTED to     │
│ ┃     IN_PROCESS                           │
│ ┃     Sarah Johnson • 2h ago              │
├────────────────────────────────────────────┤
│ ┃ 💬  NPDI-2025-0003  [SUBMITTED] [MED]   │
│ ┃     Comment: "Please expedite this..."  │
│ ┃     John Smith • 3h ago                 │
├────────────────────────────────────────────┤
│ ┃ ✏️  NPDI-2025-0001  [DRAFT] [LOW]       │
│ ┃     Ticket edited: Updated pricing...   │
│ ┃     Mike Wilson • 1d ago                │
└────────────────────────────────────────────┘
```

---

## Features

### 1. Specific Activity Details ✅
- Shows **exactly what changed** (not just "updated")
- Example: "Status changed from SUBMITTED to IN_PROCESS"
- Example: "Comment: 'Please expedite this request'"
- Example: "SKU assigned: SIGMA-12345-1G"

### 2. Activity Highlighting ✅
- **Color-coded left borders** for visual distinction
- **Different icons** for each activity type
- **Background tints** for better grouping

### 3. User Attribution ✅
- Shows who performed each action
- Consistent with user information flow (firstName + lastName)

### 4. Time Information ✅
- Smart time formatting:
  - "just now" (< 1 minute)
  - "5m ago" (< 1 hour)
  - "2h ago" (< 24 hours)
  - "3d ago" (< 7 days)
  - Full date (> 7 days)

### 5. Ticket Context ✅
- Ticket number (clickable link)
- Current status badge
- Priority badge
- Product name or CAS number

---

## User Experience Improvements

### Before:
- Generic "Recent Status Updates" section
- Only showed recently updated tickets
- No indication of **what** changed
- No distinction between status changes, comments, or edits
- Simple timestamp

### After:
- Detailed "Recent Activity" feed
- Shows all types of activities:
  - Status changes
  - Comments
  - Edits
  - SKU assignments
  - Ticket creation
- **Specific descriptions** of what changed
- **Visual highlighting** with colors and icons
- **User attribution** for every action
- **Smart time formatting** (relative + absolute)
- Up to 8 most recent activities (vs. 5 tickets)

---

## Technical Implementation

### Data Flow:

```
1. Frontend Dashboard loads
   ↓
2. Calls productAPI.getRecentActivity({ limit: 10 })
   ↓
3. Backend queries ProductTicket collection
   ↓
4. Extracts activities from:
   - statusHistory array (STATUS_CHANGE, TICKET_EDIT, etc.)
   - comments array (COMMENT_ADDED)
   ↓
5. Unifies all activities into single array
   ↓
6. Sorts by timestamp (newest first)
   ↓
7. Returns top N activities
   ↓
8. Frontend displays with icons, colors, and formatting
```

### Activity Aggregation:

The backend scans multiple tickets and aggregates all activities into a unified feed, providing a comprehensive view of recent changes across all tickets.

**Benefits:**
- See comments and status changes mixed together chronologically
- Better context for what's happening across all tickets
- Easy to spot patterns (e.g., multiple status changes by same user)

---

## Examples

### Status Change Activity:
```json
{
  "type": "STATUS_CHANGE",
  "ticketNumber": "NPDI-2025-0005",
  "description": "Status changed from SUBMITTED to IN_PROCESS",
  "user": "Sarah Johnson",
  "timestamp": "2025-10-12T14:30:00.000Z",
  "status": "IN_PROCESS",
  "priority": "HIGH"
}
```

**Display:**
- 🔄 Blue arrow icon
- Blue left border
- "NPDI-2025-0005 [IN_PROCESS] [HIGH]"
- "Status changed from SUBMITTED to IN_PROCESS"
- "Sarah Johnson • 2h ago"

### Comment Activity:
```json
{
  "type": "COMMENT_ADDED",
  "ticketNumber": "NPDI-2025-0003",
  "description": "Comment: \"Please expedite this request as it's blocking production\"",
  "user": "John Smith",
  "timestamp": "2025-10-12T11:15:00.000Z",
  "status": "SUBMITTED",
  "priority": "URGENT"
}
```

**Display:**
- 💬 Green chat bubble icon
- Green left border
- "NPDI-2025-0003 [SUBMITTED] [URGENT]"
- "Comment: 'Please expedite this request as it's blocking production'"
- "John Smith • 5h ago"

---

## Benefits

### For Product Managers:
1. **Better Awareness** - See exactly what's happening across all tickets
2. **Quick Context** - Understand recent changes at a glance
3. **Activity Tracking** - Monitor comments and status changes together
4. **Time Saving** - No need to open tickets to see recent activity
5. **Priority Focus** - See urgent items with visual highlighting

### For PMOps:
1. **Team Visibility** - See what Product Managers are doing
2. **Comment Monitoring** - Quick access to recent comments
3. **Status Tracking** - Monitor ticket progression
4. **Issue Detection** - Spot patterns in activity (e.g., frequent edits)

---

## Files Modified

### Backend:
- ✅ `/server/controllers/productController.js` - Added `getRecentActivity` endpoint
- ✅ `/server/routes/products.js` - Added route for activity endpoint

### Frontend:
- ✅ `/client/src/services/api.js` - Added `getRecentActivity` API method
- ✅ `/client/src/pages/Dashboard.jsx` - Replaced "Recent Status Updates" with activity feed

### Documentation:
- ✅ `/ACTIVITY_FEED_ENHANCEMENT.md` (this file)

---

## Testing Checklist

### Manual Testing:
- [ ] Dashboard loads without errors
- [ ] Activity feed displays correctly
- [ ] Different activity types show different icons and colors
- [ ] Status change activities show correct descriptions
- [ ] Comment activities display comment content
- [ ] Edit activities show what was edited
- [ ] SKU assignment activities appear correctly
- [ ] User names appear correctly
- [ ] Time ago formatting works correctly
- [ ] Clicking activities navigates to ticket details
- [ ] Empty state displays when no activities exist
- [ ] Activity feed updates after ticket actions

### Edge Cases:
- [ ] No activities in system (empty state)
- [ ] Only 1-2 activities (less than 8)
- [ ] Very long comment content (truncation)
- [ ] Missing user information (shows "Unknown User")
- [ ] Activities from different time periods
- [ ] Mixed activity types in feed

---

## Future Enhancements

### Possible Additions:
1. **Real-time Updates** - WebSocket integration for live activity feed
2. **Activity Filtering** - Filter by activity type or user
3. **Activity Search** - Search within activity descriptions
4. **Load More** - Pagination or infinite scroll
5. **Activity Details Modal** - Expand activity for full details
6. **Activity Notifications** - Push notifications for important activities
7. **Activity Mentions** - @mention users in comments and show in feed
8. **Activity Exports** - Download activity feed as CSV/PDF
9. **Activity Analytics** - Charts showing activity patterns over time
10. **Customizable Display** - User preferences for which activities to show

---

## Performance Notes

- Single API call fetches up to 10 activities
- Backend aggregates from multiple tickets efficiently
- Client-side sorting and slicing minimal
- No real-time updates (polling could be added)
- Limit of 8 activities displayed (10 fetched for buffer)

---

## Comparison: Before vs After

### Before (Recent Status Updates):
- Showed 5 most recently updated tickets
- Generic "Updated [timestamp]" message
- No indication of what changed
- No activity type distinction
- Simple list format

### After (Recent Activity Feed):
- Shows 8 most recent activities across all tickets
- Specific descriptions of what changed
- Activity type icons and colors
- User attribution for every action
- Rich card format with highlighting
- Mixed activity types (status, comments, edits)

---

## Conclusion

The activity feed enhancement successfully addresses the user's request to "specify what was changed in the Recent status updates" and "highlight recently added comments or ticket changes".

**Key Achievements:**
✅ Unified activity feed showing all types of changes
✅ Specific descriptions of what changed
✅ Visual highlighting with icons and colors
✅ User attribution for accountability
✅ Smart time formatting
✅ Better dashboard overview for Product Managers

**Impact:**
- More informative dashboard
- Better awareness of recent changes
- Easier to spot important activities
- Improved user experience

---

**Enhancement completed successfully!**
