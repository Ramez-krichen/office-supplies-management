# Comprehensive Notification System Documentation

## Overview

This document describes the comprehensive notification system implemented for the Office Supplies Management application. The system provides real-time alerts, persistent notification storage, email integration, and advanced management capabilities.

## Features Implemented

### ✅ Core Features
- **Real-time notifications** using Server-Sent Events (SSE)
- **Persistent notification storage** with full CRUD operations
- **Email notifications** with HTML templates
- **Notification preferences** per user
- **Read/unread status tracking**
- **Notification categorization** by priority and type
- **Bulk notification management** for administrators
- **Manager notifications** for employee assignments
- **Employee notifications** for request status changes

### ✅ Advanced Features
- **Priority levels** (LOW, MEDIUM, HIGH, URGENT)
- **Notification categories** (GENERAL, REQUEST_UPDATE, EMPLOYEE_MANAGEMENT, SYSTEM, PURCHASE_ORDER)
- **Action URLs** with custom labels
- **Notification expiration**
- **Delivery tracking** (EMAIL, IN_APP, PUSH)
- **Retry mechanisms** for failed deliveries
- **Comprehensive UI components**

## Database Schema

### Enhanced Tables

#### `notifications`
```sql
- id: TEXT (Primary Key)
- type: TEXT (Notification type)
- title: TEXT (Notification title)
- message: TEXT (Notification content)
- data: TEXT (JSON data)
- status: TEXT (UNREAD, READ, DISMISSED)
- priority: TEXT (LOW, MEDIUM, HIGH, URGENT)
- targetRole: TEXT (Target user role)
- targetUserId: TEXT (Specific target user)
- category: TEXT (Notification category)
- actionUrl: TEXT (Optional action URL)
- actionLabel: TEXT (Action button label)
- expiresAt: DATETIME (Expiration date)
- metadata: TEXT (Additional JSON metadata)
- createdAt: DATETIME
- updatedAt: DATETIME
- readAt: DATETIME
- dismissedAt: DATETIME
```

#### `notification_preferences`
```sql
- id: TEXT (Primary Key)
- userId: TEXT (Foreign Key to users)
- emailEnabled: BOOLEAN
- inAppEnabled: BOOLEAN
- requestStatusChanges: BOOLEAN
- managerAssignments: BOOLEAN
- systemAlerts: BOOLEAN
- weeklyDigest: BOOLEAN
- createdAt: DATETIME
- updatedAt: DATETIME
```

#### `notification_deliveries`
```sql
- id: TEXT (Primary Key)
- notificationId: TEXT (Foreign Key to notifications)
- deliveryType: TEXT (EMAIL, IN_APP, PUSH)
- status: TEXT (PENDING, SENT, DELIVERED, FAILED)
- attemptCount: INTEGER
- lastAttemptAt: DATETIME
- deliveredAt: DATETIME
- errorMessage: TEXT
- createdAt: DATETIME
- updatedAt: DATETIME
```

## API Endpoints

### User Notifications
- `GET /api/notifications` - Get user notifications with filtering
- `POST /api/notifications` - Create new notification (Admin/Manager only)
- `PATCH /api/notifications/[id]` - Mark as read/dismissed
- `DELETE /api/notifications/[id]` - Delete notification (Admin only)

### Bulk Operations
- `PATCH /api/notifications/bulk` - Bulk mark as read/dismissed
- `POST /api/notifications/bulk` - Create bulk notifications (Admin only)

### Preferences
- `GET /api/notifications/preferences` - Get user preferences
- `PUT /api/notifications/preferences` - Update user preferences

### Real-time Stream
- `GET /api/notifications/stream` - Server-Sent Events stream

### Admin Management
- `GET /api/admin/notifications` - Admin notification management
- `POST /api/admin/notifications` - Create admin notifications
- `PATCH /api/admin/notifications/[id]` - Update notifications
- `DELETE /api/admin/notifications/[id]` - Delete notifications

## Core Services

### NotificationService (`src/lib/notification-service.ts`)
Singleton service handling all notification operations:
- **createNotification()** - Create and schedule notifications
- **getUserPreferences()** - Get user notification preferences
- **updateUserPreferences()** - Update user preferences
- **markAsRead()** - Mark notification as read
- **markAsDismissed()** - Mark notification as dismissed
- **getUserNotifications()** - Get filtered user notifications
- **bulkMarkAsRead()** - Bulk operations
- **cleanupExpiredNotifications()** - Maintenance operations

### Notification Triggers (`src/lib/notification-triggers.ts`)
Automated notification triggers for business events:
- **triggerRequestStatusNotification()** - Request status changes
- **triggerEmployeeAssignmentNotification()** - Employee assignments
- **triggerSystemAlert()** - System alerts
- **triggerLowStockAlert()** - Inventory alerts
- **triggerPurchaseOrderNotification()** - Purchase order updates

## Real-time System

### Server-Sent Events Implementation
- **Connection Management** - Track active user connections
- **Heartbeat System** - Keep connections alive
- **Broadcast Functions** - Send notifications to specific users or all users
- **Connection Recovery** - Handle disconnections gracefully

### Stream Events
- `connected` - Initial connection established
- `notification` - New notification received
- `unread_count` - Updated unread count
- `heartbeat` - Keep-alive signal

## Email Integration

### SMTP Configuration
Environment variables required:
```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@company.com
```

### Email Templates
- **HTML Email Templates** with responsive design
- **Priority-based styling** (urgent notifications highlighted)
- **Action buttons** for direct navigation
- **Unsubscribe information**

## Frontend Components

### React Hooks
- **useNotifications()** - Main notification management hook
- **useNotificationPreferences()** - Preferences management hook

### UI Components
- **NotificationBell** - Header notification icon with badge
- **NotificationDropdown** - Quick notification preview
- **NotificationPreferences** - Settings management
- **NotificationsPage** - Full notification management interface

### Features
- **Real-time updates** via EventSource
- **Filtering and sorting** by status, category, priority
- **Bulk operations** (mark all as read, select multiple)
- **Action buttons** for quick navigation
- **Responsive design** for mobile and desktop

## Integration Points

### Request Approval System
Automatically triggers notifications when:
- Request is approved
- Request is rejected
- Request status changes to IN_PROGRESS
- Request is completed
- Request is cancelled

### User Management System
Automatically triggers notifications when:
- New employee is assigned to a manager's department
- Employee role changes
- Department assignments change

### Purchase Order System
Automatically triggers notifications when:
- Purchase order is sent
- Purchase order is received
- Purchase order status changes

### Inventory System
Automatically triggers notifications when:
- Stock levels fall below minimum threshold
- Items are out of stock
- Inventory discrepancies detected

## Configuration

### Notification Types
```typescript
enum NotificationType {
  REQUEST_STATUS_CHANGE = 'REQUEST_STATUS_CHANGE',
  EMPLOYEE_ASSIGNMENT = 'EMPLOYEE_ASSIGNMENT',
  MANAGER_ASSIGNMENT = 'MANAGER_ASSIGNMENT',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  PURCHASE_ORDER_UPDATE = 'PURCHASE_ORDER_UPDATE',
  INVENTORY_ALERT = 'INVENTORY_ALERT'
}
```

### Priority Levels
```typescript
enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}
```

### Categories
```typescript
enum Category {
  GENERAL = 'GENERAL',
  REQUEST_UPDATE = 'REQUEST_UPDATE',
  EMPLOYEE_MANAGEMENT = 'EMPLOYEE_MANAGEMENT',
  SYSTEM = 'SYSTEM',
  PURCHASE_ORDER = 'PURCHASE_ORDER'
}
```

## Testing

### Test Script
Run the comprehensive test suite:
```bash
node test-notification-system.js
```

### Test Coverage
- ✅ Authentication and authorization
- ✅ API endpoint functionality
- ✅ Database operations
- ✅ Real-time notifications
- ✅ Email integration
- ✅ Notification triggers
- ✅ Bulk operations
- ✅ Preferences management

## Deployment Considerations

### Environment Setup
1. **Database Migration** - Run Prisma migrations
2. **SMTP Configuration** - Set up email service
3. **Environment Variables** - Configure all required variables
4. **SSL/TLS** - Ensure secure connections for real-time features

### Performance Optimization
- **Database Indexing** - Optimized queries with proper indexes
- **Connection Pooling** - Efficient real-time connection management
- **Caching** - User preferences and notification counts
- **Cleanup Jobs** - Automated expired notification removal

### Security Features
- **Authentication Required** - All endpoints require valid session
- **Role-based Access** - Proper permission checks
- **Input Validation** - Sanitized user inputs
- **Rate Limiting** - Prevent notification spam

## Monitoring and Maintenance

### Logging
- **Notification Creation** - Track all notification events
- **Delivery Status** - Monitor email delivery success/failure
- **Connection Status** - Real-time connection monitoring
- **Error Tracking** - Comprehensive error logging

### Maintenance Tasks
- **Cleanup Expired Notifications** - Automated daily cleanup
- **Delivery Retry** - Retry failed email deliveries
- **Connection Health** - Monitor real-time connection health
- **Performance Metrics** - Track notification system performance

## Usage Examples

### Creating a Notification
```typescript
import { notificationService } from '@/lib/notification-service'

await notificationService.createNotification({
  type: 'REQUEST_STATUS_CHANGE',
  title: 'Request Approved',
  message: 'Your request has been approved by the manager',
  priority: 'HIGH',
  targetUserId: 'user-id',
  category: 'REQUEST_UPDATE',
  actionUrl: '/requests/123',
  actionLabel: 'View Request'
})
```

### Using the React Hook
```typescript
import { useNotifications } from '@/hooks/useNotifications'

function MyComponent() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useNotifications()
  
  // Component implementation
}
```

### Real-time Integration
```typescript
// The hook automatically handles real-time updates
// No additional setup required in components
```

## Future Enhancements

### Potential Improvements
- **Push Notifications** - Browser push notification support
- **Mobile App Integration** - Native mobile notifications
- **Advanced Filtering** - More granular filtering options
- **Notification Templates** - Customizable notification templates
- **Analytics Dashboard** - Notification metrics and analytics
- **Webhook Integration** - External system notifications
- **Scheduled Notifications** - Time-based notification delivery

## Support and Troubleshooting

### Common Issues
1. **Real-time not working** - Check EventSource browser support
2. **Emails not sending** - Verify SMTP configuration
3. **Notifications not appearing** - Check user preferences
4. **Performance issues** - Review database indexes

### Debug Mode
Enable detailed logging by setting:
```env
DEBUG_NOTIFICATIONS=true
```

## Conclusion

The comprehensive notification system provides a robust, scalable solution for real-time communication within the Office Supplies Management application. It supports all major notification patterns, includes advanced management features, and provides excellent user experience through modern UI components and real-time updates.

The system is production-ready with proper error handling, security measures, and performance optimizations. It can be easily extended to support additional notification types and delivery methods as business requirements evolve.