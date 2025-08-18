# Office Supplies Management - Access Control System Documentation

## Overview

This document provides comprehensive documentation for the role-based access control (RBAC) system implemented in the Office Supplies Management application. The system ensures secure, role-appropriate access to features and data across the entire application.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [User Roles and Permissions](#user-roles-and-permissions)
3. [Access Control Configuration](#access-control-configuration)
4. [API Security](#api-security)
5. [Dashboard Access Control](#dashboard-access-control)
6. [Data Filtering](#data-filtering)
7. [Feature-Specific Access](#feature-specific-access)
8. [Implementation Guide](#implementation-guide)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

## System Architecture

### Core Components

1. **Access Control Configuration** (`/src/lib/access-control-config.ts`)
   - Centralized role and permission definitions
   - Feature-specific access rules
   - Dashboard access configuration

2. **Server Access Control** (`/src/lib/server-access-control.ts`)
   - API endpoint protection
   - Session validation
   - Role-based filtering logic

3. **Client Access Control** (`/src/lib/client-access-control.ts`)
   - UI component protection
   - Navigation control
   - Feature visibility management

4. **Dashboard Layout** (`/src/components/DashboardLayout.tsx`)
   - Role-based navigation
   - Access control enforcement
   - User context management

### Security Principles

- **Principle of Least Privilege**: Users have minimum necessary access
- **Defense in Depth**: Multiple layers of access control
- **Fail-Safe Defaults**: Deny access by default
- **Complete Mediation**: Every access request is checked

## User Roles and Permissions

### Admin Role
**Purpose**: System administration and global oversight

**Access Level**: Full system access
- ✅ All dashboards (Admin, System, Department, Personal)
- ✅ Global data access (all departments)
- ✅ User management (CRUD)
- ✅ System configuration
- ✅ Audit logs
- ✅ All reports (global data)
- ✅ Request approval (system-wide)
- ❌ Request creation (admins don't create requests)

**Key Responsibilities**:
- System administration
- User account management
- Global oversight and reporting
- System-wide request approvals

### Manager Role
**Purpose**: Department management and oversight

**Access Level**: Department-restricted access
- ✅ Manager and Personal dashboards
- ✅ Department-level data access
- ✅ Request management (department-only)
- ✅ Request creation and approval
- ✅ Inventory management (global inventory)
- ✅ Department reports
- ❌ User management
- ❌ System administration
- ❌ Cross-department data access

**Key Responsibilities**:
- Department team management
- Department request approvals
- Inventory oversight
- Department reporting

### Employee Role
**Purpose**: Personal request management and basic system access

**Access Level**: Personal data only
- ✅ Personal dashboard only
- ✅ Personal request management
- ✅ Request creation and editing (own requests)
- ✅ Read-only inventory access
- ✅ Personal history reports
- ❌ Request approvals
- ❌ Management functions
- ❌ Other users' data access

**Key Responsibilities**:
- Personal request creation
- Request status tracking
- Inventory browsing

## Access Control Configuration

### Feature Access Matrix

| Feature | Admin | Manager | Employee |
|---------|-------|---------|----------|
| **Requests**                         |
| View    | All | Department| Personal |
| Create  | ❌ | ✅        | ✅      |
| Edit   | All | Department | Personal |
| Delete | All | ❌ | ❌ |
| Approve | All | Department | ❌ |
| **Inventory** |
| View | ✅ | ✅ | ✅ (Read-only) |
| Create | ✅ | ❌ | ❌ |
| Edit | ✅ | ✅ | ❌ |
| Delete | ✅ | ❌ | ❌ |
| **Users** |
| View | ✅ | ❌ | ❌ |
| Create | ✅ | ❌ | ❌ |
| Edit | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ |
| **Suppliers** |
| View | ✅ | ❌ | ❌ |
| Create | ✅ | ❌ | ❌ |
| Edit | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ |
| **Purchase Orders** |
| View | ✅ | Optional* | ❌ |
| Create | ✅ | Optional* | ❌ |
| Edit | ✅ | Optional* | ❌ |
| Delete | ✅ | ❌ | ❌ |
| **Reports** |
| View | All | Department | Personal |
| Create | ✅ | ❌ | ❌ |
| Edit | ✅ | ❌ | ❌ |
| **Quick Reports** |
| View | ✅ | ✅ | ❌ |

*Optional: Requires explicit permission grant

### Dashboard Access

| Dashboard | Admin | Manager | Employee |
|-----------|-------|---------|----------|
| Admin Dashboard | ✅ | ❌ | ❌ |
| System Dashboard | ✅ | ❌ | ❌ |
| Manager Dashboard | ✅ | ✅ | ❌ |
| Employee Dashboard | ✅ | ✅ | ✅ |

### Data Filtering Rules

| Data Type | Admin | Manager | Employee |
|-----------|-------|---------|----------|
| Requests | Global | Department | Personal |
| Purchase Orders | Global | Department | Personal |
| Reports | Global | Department | Personal |
| Users | Global | ❌ | ❌ |
| Audit Logs | Global | ❌ | ❌ |
| Notifications | Global | Department | ❌ |

## API Security

### Authentication
All API endpoints require valid session authentication via NextAuth.js.

### Authorization Patterns

#### 1. Feature-Based Access Control
```typescript
const accessCheck = await checkAccess(createFeatureAccessCheck('REQUESTS', 'view')())
if (!accessCheck.hasAccess) {
  return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
}
```

#### 2. Department Filtering
```typescript
const { requiresDepartmentFiltering, userDepartment } = accessCheck
const whereClause = {
  // Other conditions...
  ...(requiresDepartmentFiltering && userDepartment && {
    requester: { department: userDepartment }
  })
}
```

#### 3. Personal Data Filtering
```typescript
const { additionalRestrictions, user } = accessCheck
const whereClause = {
  // Other conditions...
  ...(additionalRestrictions?.includes('personal_only') && {
    requesterId: user.id
  })
}
```

### Protected API Routes

#### Admin-Only Routes
- `/api/admin/*` - All admin management endpoints
- `/api/users/*` - User management
- `/api/audit-logs` - System audit logs
- `/api/dashboard/admin` - Admin dashboard data
- `/api/dashboard/system` - System dashboard data

#### Manager-Accessible Routes
- `/api/requests` - Request management (department-filtered)
- `/api/inventory` - Inventory management
- `/api/reports/*` - Reporting (department-filtered)
- `/api/dashboard/manager` - Manager dashboard data
- `/api/categories` - Category management

#### Employee-Accessible Routes
- `/api/requests` - Personal requests only
- `/api/inventory` - Read-only access
- `/api/reports/spending` - Personal reports only
- `/api/dashboard/employee` - Employee dashboard data
- `/api/profile` - Personal profile management

## Dashboard Access Control

### Navigation Control
The `DashboardLayout` component implements role-based navigation:

```typescript
// Admin navigation includes all items
// Manager navigation excludes admin-specific items
// Employee navigation includes only basic items
```

### Dashboard-Specific Features

#### Admin Dashboard
- System-wide statistics
- All pending approvals
- Global low stock alerts
- User management interface
- System health monitoring

#### Manager Dashboard
- Department statistics
- Department pending approvals
- Team management
- Department reports
- Low stock alerts (global inventory)

#### Employee Dashboard
- Personal request history
- Personal statistics
- Read-only inventory view
- No administrative features

## Data Filtering

### Request Data Filtering

#### Admin Access
```sql
SELECT * FROM requests 
-- No filtering - sees all requests
```

#### Manager Access
```sql
SELECT * FROM requests r
JOIN users u ON r.requesterId = u.id
WHERE u.department = 'manager_department'
```

#### Employee Access
```sql
SELECT * FROM requests 
WHERE requesterId = 'employee_id'
```

### Report Data Filtering

#### Spending Reports
- **Admin**: All spending across all departments
- **Manager**: Department spending only
- **Employee**: Personal spending only

#### Quick Reports
- **Admin**: Full access to all quick reports
- **Manager**: Full access to all quick reports
- **Employee**: No access (blocked at API level)

### Notification Filtering

#### Low Stock Alerts
- **Admin**: All low stock items globally
- **Manager**: All low stock items (inventory is global)
- **Employee**: No access to low stock alerts

#### Pending Approvals
- **Admin**: All pending approvals system-wide
- **Manager**: Pending approvals for department requests only
- **Employee**: No access to pending approvals

## Feature-Specific Access

### Request Management

#### Creation Rules
- **Admin**: Cannot create requests (policy decision)
- **Manager**: Can create requests for department
- **Employee**: Can create personal requests

#### Approval Rules
- **Admin**: Can approve any request system-wide
- **Manager**: Can approve requests from their department
- **Employee**: Cannot approve any requests

#### Editing Rules
- **Admin**: Can edit any request
- **Manager**: Can edit requests from their department
- **Employee**: Can edit their own pending requests

### Inventory Management

#### Access Levels
- **Admin**: Full CRUD access to all inventory
- **Manager**: Read and edit access (no create/delete)
- **Employee**: Read-only access

#### Stock Alerts
- **Admin**: Sees all low stock alerts
- **Manager**: Sees all low stock alerts (global inventory)
- **Employee**: No access to stock alerts

### User Management

#### Access Control
- **Admin**: Full user management capabilities
- **Manager**: No user management access
- **Employee**: No user management access

#### Profile Management
- All users can manage their own profiles
- Only admins can manage other users' profiles

### Purchase Order Management

#### Default Access
- **Admin**: Full access to all purchase orders
- **Manager**: No access by default
- **Employee**: No access

#### Explicit Grants
Managers can be granted purchase order access through the permission system:
```typescript
// Requires explicit permission grant
additionalRestrictions: ['requires_explicit_grant']
```

## Implementation Guide

### Adding New Features

1. **Define Access Rules**
   ```typescript
   // In access-control-config.ts
   newFeature: {
     canView: true,
     canCreate: false,
     canEdit: true,
     canDelete: false,
     additionalRestrictions: ['department_restricted']
   }
   ```

2. **Protect API Routes**
   ```typescript
   const accessCheck = await checkAccess(createFeatureAccessCheck('NEW_FEATURE', 'view')())
   if (!accessCheck.hasAccess) {
     return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
   }
   ```

3. **Add UI Protection**
   ```typescript
   const { hasAccess } = useClientAccessControl('newFeature', 'view')
   if (!hasAccess) return null
   ```

### Modifying Existing Access

1. Update the access control configuration
2. Update API route protection
3. Update UI component protection
4. Update tests
5. Update documentation

## Testing

Comprehensive test suites are available:

- `comprehensive-access-control.test.ts` - Core access control testing
- `role-based-filtering.test.ts` - Data filtering testing
- `dashboard-access-control.test.ts` - Dashboard access testing

See `ACCESS_CONTROL_TESTING.md` for detailed testing guidelines.

## Troubleshooting

### Common Issues

1. **Access Denied Errors**
   - Check user role and permissions
   - Verify session authentication
   - Confirm feature access configuration

2. **Data Filtering Issues**
   - Verify department filtering logic
   - Check personal data restrictions
   - Confirm API query filters

3. **UI Component Issues**
   - Check role-based conditional rendering
   - Verify client access control hooks
   - Confirm navigation permissions

### Debug Tips

1. Enable access control logging
2. Check browser console for access control decisions
3. Verify database queries include proper filtering
4. Test with different user roles and departments

## Security Considerations

### Best Practices Implemented

1. **Server-Side Validation**: All access control enforced on server
2. **Session Security**: Secure session management with NextAuth.js
3. **Data Isolation**: Proper filtering prevents data leakage
4. **Fail-Safe Defaults**: Deny access by default
5. **Comprehensive Testing**: Extensive test coverage

### Security Monitoring

1. **Audit Logs**: All access attempts logged
2. **Session Monitoring**: Invalid access attempts tracked
3. **Permission Changes**: All permission modifications logged
4. **Data Access**: Sensitive data access monitored

## Maintenance

### Regular Tasks

1. **Review Access Logs**: Monitor for unusual access patterns
2. **Update Permissions**: Adjust permissions as roles evolve
3. **Test Access Control**: Regular testing of all access scenarios
4. **Update Documentation**: Keep documentation current with changes

### Performance Considerations

1. **Efficient Queries**: Database queries optimized for filtering
2. **Caching**: Access control decisions cached where appropriate
3. **Minimal Overhead**: Lightweight access control checks
4. **Scalable Design**: System scales with user growth
