# Access Control System Guide

## Overview

This document provides comprehensive guidance on the role-based access control (RBAC) system implemented in the Office Supplies Management System. The system enforces strict access controls based on user roles and department assignments.

## User Roles

### 1. Admin Access
**Full System Control**

#### Dashboard Access
- ✅ Admin Dashboard: Full access
- ✅ System Dashboard: Full access to global metrics, reports, inventory, and requests
- ✅ Department Dashboard: Can view all departments
- ✅ Personal Dashboard: Full access

#### Feature Access
- **Requests**: Can approve and reject any request, but **cannot create requests**
- **Inventory**: Full access to all stock across departments
- **Suppliers**: Full access
- **Purchase Orders**: Full access to create and manage all
- **Reports**: Full access to reports and filters
- **Quick Reports**: Full access
- **Users**: Manage all users and roles
- **Departments**: View and edit all
- **Audit Logs**: Full visibility into all system activities
- **Settings**: Full configuration rights

#### Special Features
- ✅ Low Stock Alerts: Displayed globally on the dashboard
- ✅ Pending Approvals: Displayed for all pending requests system-wide

### 2. Manager Access
**Department-Level Management**

#### Dashboard Access
- ❌ Admin Dashboard: No access
- ❌ System Dashboard: No access
- ✅ Department Dashboard: Access only to their own department's data
- ✅ Personal Dashboard: Full access

#### Feature Access
- **Requests**: 
  - Can create requests (limited to their own department)
  - Can approve/reject requests from their department
- **Inventory**: View and manage inventory for their department
- **Suppliers**: ❌ No access
- **Purchase Orders**: ⚠️ Optional (access only if explicitly granted)
- **Reports**: Access to department-level reporting
- **Quick Reports**: Access to filtered reports for their department
- **Users**: ❌ No access
- **Departments**: ❌ No access
- **Audit Logs**: ❌ No access
- **Settings**: ❌ No access

#### Special Features
- ✅ Low Stock Alerts: Displayed only for their department
- ✅ Pending Approvals: Displayed for requests within their department

### 3. Employee Access
**Personal Request Management**

#### Dashboard Access
- ❌ Admin Dashboard: No access
- ❌ System Dashboard: No access
- ❌ Department Dashboard: No access
- ✅ Personal Dashboard: Full access

#### Feature Access
- **Requests**:
  - Can create and track personal requests
  - Request creation is limited to their own department
  - Can only view and edit their own requests
- **Inventory**: View only
- **Suppliers**: ❌ No access
- **Purchase Orders**: ❌ No access
- **Reports**: View only personal request history/summaries
- **Quick Reports**: ❌ No access or optional
- **Users**: ❌ No access
- **Departments**: ❌ No access
- **Audit Logs**: ❌ No access
- **Settings**: ❌ No access

#### Special Features
- ❌ Low Stock Alerts: No access
- ❌ Pending Approvals: No access

## Implementation Details

### Database Schema Enhancements

The system uses enhanced database schemas with proper enums and constraints:

```typescript
enum UserRole {
  ADMIN
  MANAGER
  EMPLOYEE
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}
```

### Access Control Configuration

The system uses a comprehensive configuration file (`access-control-config.ts`) that defines:

- Dashboard access permissions
- Feature-level permissions (view, create, edit, delete, approve)
- Department-level restrictions
- Special access restrictions

### API Security

All API routes are protected with:

- Session validation
- Role-based access control
- Feature-specific permissions
- Department-level filtering where applicable

Example API protection:
```typescript
const accessCheck = await checkAccess(createFeatureAccessCheck('REQUESTS', 'view')())
if (!accessCheck.hasAccess) {
  return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
}
```

### Frontend Access Control

Client-side components use access control functions to:

- Show/hide navigation items
- Enable/disable features
- Filter content based on user permissions

## Testing

### Manual Testing Scenarios

#### Admin Testing
1. Login as admin user
2. Verify access to all dashboards
3. Verify cannot create requests
4. Verify can approve/reject any request
5. Verify can access all administrative features

#### Manager Testing
1. Login as manager user
2. Verify access only to department and personal dashboards
3. Verify can create requests for their department
4. Verify can approve requests from their department only
5. Verify cannot access admin features

#### Employee Testing
1. Login as employee user
2. Verify access only to personal dashboard
3. Verify can create personal requests
4. Verify can only view their own requests
5. Verify cannot access management features

### Automated Testing

Run the test suite:
```bash
npm test access-control
```

The test suite covers:
- Role-based permissions
- Feature access validation
- Department filtering
- Edge cases and error handling

## Configuration

### Adding New Features

To add a new feature to the access control system:

1. Update `access-control-config.ts`:
```typescript
export interface AccessControlConfig {
  // ... existing features
  newFeature: FeatureAccess
}
```

2. Define permissions for each role:
```typescript
ADMIN: {
  newFeature: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    departmentRestricted: false
  }
}
```

3. Update API routes with access control:
```typescript
const accessCheck = await checkAccess(createFeatureAccessCheck('NEW_FEATURE', 'view')())
```

4. Update frontend navigation and components

### Modifying Permissions

To modify existing permissions:

1. Update the role configuration in `access-control-config.ts`
2. Update tests to reflect new permissions
3. Test thoroughly across all affected features

## Security Considerations

### Best Practices

1. **Server-side Validation**: Always validate permissions on the server
2. **Department Filtering**: Apply department restrictions in database queries
3. **Session Management**: Ensure proper session validation
4. **Audit Logging**: Log all access control decisions
5. **Regular Reviews**: Periodically review and update permissions

### Common Pitfalls

1. **Client-side Only**: Never rely solely on client-side access control
2. **Missing Department Filters**: Always apply department restrictions for managers
3. **Hardcoded Permissions**: Use the configuration system, not hardcoded checks
4. **Inconsistent Validation**: Ensure API and UI permissions match

## Troubleshooting

### Common Issues

1. **Access Denied Errors**: Check user role and feature permissions
2. **Department Filtering**: Verify user has department assignment
3. **Session Issues**: Ensure proper authentication
4. **Permission Mismatches**: Verify configuration consistency

### Debug Tools

Use the access control helper functions for debugging:
```typescript
const config = getUserAccessConfig(userRole)
const hasAccess = canAccessFeature(userRole, 'feature', 'action')
const needsFiltering = requiresDepartmentFiltering(userRole, 'feature')
```

## Migration Guide

If upgrading from a previous version:

1. Run database migrations to update schema
2. Update user roles to use new enum values
3. Test all existing functionality
4. Update any custom access control logic

## Database Migration

To apply the enhanced access control schema:

```bash
# Apply Prisma schema changes
npx prisma db push

# Run the access control migration script
sqlite3 prisma/dev.db < prisma/migrations/access-control-migration.sql

# Regenerate Prisma client
npx prisma generate
```

## Quick Start

### 1. Installation
The access control system is already integrated. No additional installation required.

### 2. Configuration
All access control rules are defined in `src/lib/access-control-config.ts`. Modify this file to adjust permissions.

### 3. Testing
```bash
# Run access control tests
npm test access-control

# Run API access control tests
npm test api-access-control
```

### 4. Verification
After deployment, verify the system works by:
1. Testing each user role
2. Checking API endpoints return correct access errors
3. Verifying UI elements show/hide correctly

## File Structure

```
src/
├── lib/
│   ├── access-control-config.ts     # Main configuration
│   ├── access-control.ts            # Client-side functions
│   └── server-access-control.ts     # Server-side functions
├── __tests__/
│   ├── access-control.test.ts       # Unit tests
│   └── api-access-control.test.ts   # API integration tests
└── components/
    └── layout/
        └── sidebar.tsx              # Updated navigation
```

## Support

For questions or issues with the access control system:

1. Check this documentation
2. Review the test cases for examples
3. Examine the configuration files
4. Contact the development team

## Changelog

### Version 2.0 - Enhanced Access Control
- ✅ Comprehensive role-based access control
- ✅ Database schema enhancements with enums
- ✅ Feature-level permissions
- ✅ Department-level filtering
- ✅ Comprehensive test suite
- ✅ API security enhancements
- ✅ Frontend access control integration
