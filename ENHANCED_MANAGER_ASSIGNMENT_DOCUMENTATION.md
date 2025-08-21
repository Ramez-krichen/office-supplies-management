# Enhanced Manager Assignment System Documentation

## Overview

The Enhanced Manager Assignment System automatically manages department manager assignments based on the following business rules:

1. **Single Manager Auto-Assignment**: When there is only one active manager in a department, they are automatically assigned as the department manager.
2. **No Manager Notifications**: When a department has no active managers, the admin receives a notification to create/activate/reassign a manager.
3. **Multiple Manager Notifications**: When a department has 2 or more active managers, the admin receives a notification to select which one should be the primary manager.
4. **Dynamic Notifications**: Admin gets notified again whenever a new manager is added to a department that already has multiple managers.

## System Architecture

### Core Components

#### 1. Enhanced Manager Assignment Logic (`src/lib/manager-assignment.ts`)

**Main Functions:**

- `processManagerAssignmentForDepartment(departmentId, triggerEvent?)`: Processes manager assignment for a single department
- `processAllDepartmentManagerAssignments()`: Processes all departments in the system
- `handleManagerStatusChange(managerId, newStatus, departmentId?)`: Handles manager activation/deactivation
- `handleManagerTransfer(managerId, fromDepartmentId, toDepartmentId)`: Handles manager transfers between departments

**Business Logic Flow:**

```
Department Analysis
├── Exactly 1 Active Manager + No Assigned Manager
│   └── ✅ Auto-assign manager
├── 0 Active Managers
│   └── 📢 Send "No Managers" notification to admin
├── 2+ Active Managers
│   └── 📢 Send "Multiple Managers" notification to admin
└── Already Properly Configured
    └── ✅ No action needed
```

#### 2. Automatic Trigger System (`src/lib/manager-assignment-hooks.ts`)

**Hook Functions:**

- `afterUserCreated(userId)`: Triggered when a new user is created
- `afterUserUpdated(userId, previousData, newData)`: Triggered when user data changes
- `afterUserDeleted(userId, userData)`: Triggered when a user is deleted
- `afterDepartmentCreated(departmentId)`: Triggered when a new department is created
- `afterDepartmentUpdated(departmentId, previousData, newData)`: Triggered when department data changes

**Trigger Scenarios:**

1. **Manager Creation**: New manager user created → Process their department
2. **Role Change**: User becomes/stops being a manager → Process affected departments
3. **Status Change**: Manager activated/deactivated → Process their department
4. **Department Transfer**: Manager moves between departments → Process both departments
5. **Manager Deletion**: Manager deleted → Process their former department

#### 3. API Endpoints (`src/app/api/admin/departments/process-manager-assignments/route.ts`)

**Available Actions:**

- `POST /api/admin/departments/process-manager-assignments`
  - `action: "process-single-department"` - Process one department
  - `action: "process-all-departments"` - Process all departments
  - `action: "handle-manager-status-change"` - Handle manager status change
  - `action: "handle-manager-transfer"` - Handle manager transfer

- `GET /api/admin/departments/process-manager-assignments` - Get overview of all departments

#### 4. Integration with User Management

**Enhanced User APIs:**

- `POST /api/admin/users` - Creates user and triggers manager assignment hooks
- `PUT /api/admin/users/[id]` - Updates user and triggers manager assignment hooks
- `DELETE /api/admin/users/[id]` - Deletes user and triggers manager assignment hooks

## Notification System

### Notification Types

#### 1. No Managers Available
```json
{
  "type": "MANAGER_ASSIGNMENT",
  "title": "No Manager Available for [Department Name]",
  "message": "Department '[Department Name]' has no managers. Please create a new manager or reassign an existing manager from another department.",
  "priority": "HIGH",
  "targetRole": "ADMIN",
  "data": {
    "departmentId": "dept_id",
    "departmentName": "Department Name",
    "departmentCode": "DEPT_CODE",
    "scenario": "NO_MANAGERS",
    "availableManagers": []
  }
}
```

#### 2. Multiple Managers Available
```json
{
  "type": "MANAGER_ASSIGNMENT",
  "title": "Multiple Managers Available for [Department Name]",
  "message": "Department '[Department Name]' has X managers. Please select which manager should be assigned to this department.",
  "priority": "HIGH",
  "targetRole": "ADMIN",
  "data": {
    "departmentId": "dept_id",
    "departmentName": "Department Name",
    "departmentCode": "DEPT_CODE",
    "scenario": "MULTIPLE_MANAGERS",
    "availableManagers": [
      {
        "id": "manager_id",
        "name": "Manager Name",
        "email": "manager@example.com"
      }
    ]
  }
}
```

### Notification Deduplication

The system prevents duplicate notifications by checking for existing unread notifications for the same department before creating new ones.

## Usage Examples

### 1. Automatic Processing

The system automatically processes manager assignments when:

```javascript
// User creation triggers automatic processing
const newManager = await prisma.user.create({
  data: {
    role: 'MANAGER',
    status: 'ACTIVE',
    departmentId: 'dept_123'
  }
})
// → Automatically triggers processManagerAssignmentForDepartment('dept_123')
```

### 2. Manual Processing

Admins can manually trigger processing:

```javascript
// Process single department
const response = await fetch('/api/admin/departments/process-manager-assignments', {
  method: 'POST',
  body: JSON.stringify({
    action: 'process-single-department',
    departmentId: 'dept_123'
  })
})

// Process all departments
const response = await fetch('/api/admin/departments/process-manager-assignments', {
  method: 'POST',
  body: JSON.stringify({
    action: 'process-all-departments'
  })
})
```

### 3. Handle Status Changes

```javascript
// Handle manager activation/deactivation
const response = await fetch('/api/admin/departments/process-manager-assignments', {
  method: 'POST',
  body: JSON.stringify({
    action: 'handle-manager-status-change',
    managerId: 'manager_123',
    newStatus: 'ACTIVE',
    departmentId: 'dept_123'
  })
})
```

## Database Schema Requirements

### Required Fields

**Department Model:**
- `managerId`: String? - ID of assigned manager
- `status`: String - Department status (ACTIVE/INACTIVE)

**User Model:**
- `role`: String - User role (MANAGER/EMPLOYEE/ADMIN)
- `status`: String - User status (ACTIVE/INACTIVE)
- `departmentId`: String? - Department the user belongs to

**Notification Model:**
- Standard notification fields for admin notifications

## Testing

### Test Scenarios

1. **Single Manager Auto-Assignment**
   - Create department with exactly one active manager
   - Verify manager is automatically assigned

2. **Multiple Managers Notification**
   - Create department with 2+ active managers
   - Verify admin notification is created

3. **No Managers Notification**
   - Create department with no active managers
   - Verify admin notification is created

4. **Manager Status Changes**
   - Activate/deactivate managers
   - Verify appropriate processing occurs

5. **Manager Transfers**
   - Transfer manager between departments
   - Verify both departments are processed

### Running Tests

```bash
# Test existing functionality
node scripts/check-and-assign-managers-updated.js

# Test enhanced functions (requires compilation)
node test-enhanced-functions.js
```

## Performance Considerations

### Optimization Features

1. **Duplicate Prevention**: Checks for existing notifications before creating new ones
2. **Selective Processing**: Only processes departments when relevant changes occur
3. **Batch Processing**: Can process all departments in a single operation
4. **Error Isolation**: Individual department processing errors don't affect others

### Monitoring

- All operations are logged with appropriate detail levels
- Audit logs are created for all manager assignments
- Processing results include success/failure counts

## Security

### Access Control

- All admin endpoints require ADMIN role authentication
- Manager assignment operations are restricted to admins only
- Audit logs track all manager assignment changes

### Data Validation

- User role and status validation before processing
- Department existence validation
- Manager eligibility validation

## Maintenance

### Regular Tasks

1. **Periodic Processing**: Run `processAllDepartmentManagerAssignments()` periodically to catch any missed assignments
2. **Notification Cleanup**: Clean up old/resolved manager assignment notifications
3. **Audit Review**: Review audit logs for manager assignment patterns

### Troubleshooting

**Common Issues:**

1. **Notifications Not Created**: Check if duplicate notifications already exist
2. **Auto-Assignment Not Working**: Verify manager has ACTIVE status and belongs to department
3. **Hooks Not Triggering**: Ensure user/department APIs are using the hook functions

**Debug Commands:**

```bash
# Check current department status
node scripts/check-and-assign-managers-updated.js

# View recent notifications
# Check admin notification center in the application
```

## Future Enhancements

### Potential Improvements

1. **Manager Preferences**: Allow managers to specify department preferences
2. **Workload Balancing**: Consider manager workload when auto-assigning
3. **Temporary Assignments**: Support temporary manager assignments
4. **Delegation**: Allow managers to delegate responsibilities
5. **Approval Workflow**: Require approval for certain manager assignments

### Integration Opportunities

1. **Email Notifications**: Send email alerts for critical manager assignment issues
2. **Dashboard Widgets**: Show manager assignment status on admin dashboard
3. **Reporting**: Generate reports on manager assignment patterns
4. **API Webhooks**: Trigger external systems when manager assignments change

## Conclusion

The Enhanced Manager Assignment System provides a robust, automated solution for managing department manager assignments. It ensures that:

- Departments with single managers get automatic assignments
- Admins are notified when manual intervention is needed
- The system responds dynamically to organizational changes
- All operations are properly logged and audited

The system is designed to be maintainable, scalable, and secure while providing a seamless experience for both administrators and end users.