# Access Control Testing Guide

This document provides comprehensive testing guidelines for the role-based access control system implemented in the Office Supplies Management application.

## Test Files Overview

### 1. `comprehensive-access-control.test.ts`
Tests the core access control configuration and API integration for all user roles.

**Coverage:**
- Admin role: Full system access verification
- Manager role: Department-level access verification  
- Employee role: Personal data access verification
- API access control integration
- Feature-specific permissions

### 2. `role-based-filtering.test.ts`
Tests data filtering logic for different user roles across all APIs.

**Coverage:**
- Admin: Global data access (no filtering)
- Manager: Department-level data filtering
- Employee: Personal data filtering only
- Low stock alerts by role
- Notification access by role

### 3. `dashboard-access-control.test.ts`
Tests dashboard access control and UI restrictions.

**Coverage:**
- Dashboard access permissions by role
- Navigation item visibility
- Feature availability on dashboards
- Data filtering on dashboard displays

## Access Control Specifications Tested

### Admin Role ✅
- **Dashboard Access**: Admin, System, Department, Personal
- **Request Management**: View all, Edit all, Approve all, Cannot create
- **Inventory**: Full CRUD access
- **Users**: Full CRUD access
- **Suppliers**: Full CRUD access
- **Purchase Orders**: Full CRUD access
- **Reports**: Full access to all reports globally
- **Low Stock Alerts**: Global visibility
- **Pending Approvals**: System-wide visibility

### Manager Role ✅
- **Dashboard Access**: Department, Personal only
- **Request Management**: Department-level view/edit/approve, Can create
- **Inventory**: View and edit (global inventory)
- **Users**: No access
- **Suppliers**: No access
- **Purchase Orders**: Optional access (requires explicit grant)
- **Reports**: Department-level access only
- **Low Stock Alerts**: Global visibility (inventory is global)
- **Pending Approvals**: Department-level visibility

### Employee Role ✅
- **Dashboard Access**: Personal only
- **Request Management**: Personal requests only, Can create/edit own
- **Inventory**: Read-only access
- **Users**: No access
- **Suppliers**: No access
- **Purchase Orders**: No access
- **Reports**: Personal history only
- **Low Stock Alerts**: No access
- **Pending Approvals**: No access

## Manual Testing Scenarios

### 1. Admin User Testing
```bash
# Login as admin user
# Verify access to:
- /dashboard/admin ✅
- /dashboard/system ✅
- /users ✅
- /suppliers ✅
- /purchase-orders ✅
- /reports (all data) ✅
- /audit-logs ✅

# Verify restrictions:
- Cannot create requests ✅
- Can approve any request ✅
```

### 2. Manager User Testing
```bash
# Login as manager user
# Verify access to:
- /dashboard/manager ✅
- /requests (department only) ✅
- /inventory (read/edit) ✅
- /reports (department only) ✅

# Verify restrictions:
- Cannot access /dashboard/admin ❌
- Cannot access /users ❌
- Cannot access /suppliers ❌
- Cannot access /purchase-orders (unless granted) ❌
- Cannot see requests from other departments ❌
```

### 3. Employee User Testing
```bash
# Login as employee user
# Verify access to:
- /dashboard/employee ✅
- /requests (personal only) ✅
- /inventory (read-only) ✅
- /reports (personal history) ✅

# Verify restrictions:
- Cannot access /dashboard/admin ❌
- Cannot access /dashboard/manager ❌
- Cannot access /users ❌
- Cannot access /suppliers ❌
- Cannot access /purchase-orders ❌
- Cannot see other users' requests ❌
- Cannot approve requests ❌
- Cannot see low stock alerts ❌
```

## API Testing Scenarios

### 1. Request API Testing
```javascript
// Test department filtering for managers
GET /api/requests
// Should only return requests from manager's department

// Test personal filtering for employees  
GET /api/requests
// Should only return employee's own requests

// Test global access for admins
GET /api/requests
// Should return all requests from all departments
```

### 2. Reports API Testing
```javascript
// Test spending reports filtering
GET /api/reports/spending
// Admin: All data
// Manager: Department data only
// Employee: Personal data only

// Test quick reports access
GET /api/reports/quick
// Admin: Full access
// Manager: Full access
// Employee: No access (403)
```

### 3. Dashboard API Testing
```javascript
// Test dashboard stats
GET /api/dashboard/stats
// Admin: Global statistics
// Manager: Department statistics
// Employee: No access (403)

// Test pending approvals
GET /api/dashboard/admin
// Admin: All pending approvals
GET /api/dashboard/manager  
// Manager: Department pending approvals only
```

## Notification System Testing

### Low Stock Alerts
- **Admin**: Should see all low stock alerts globally
- **Manager**: Should see all low stock alerts (inventory is global)
- **Employee**: Should not see low stock alerts

### Pending Approvals
- **Admin**: Should see all pending approvals system-wide
- **Manager**: Should see pending approvals for their department only
- **Employee**: Should not see pending approvals

## UI Component Testing

### Navigation Menu
- **Admin**: All menu items visible
- **Manager**: Management items visible, no admin items
- **Employee**: Basic items only, no management/admin items

### Dashboard Components
- **Admin**: All widgets and data visible
- **Manager**: Department-specific widgets and data
- **Employee**: Personal widgets and data only

### Request Management
- **Admin**: Approve/reject buttons visible, no create button
- **Manager**: Approve/reject buttons for dept requests, create button visible
- **Employee**: Create/edit buttons for own requests, no approve buttons

## Test Execution

### Running Tests
```bash
# Install testing dependencies (if not already installed)
npm install --save-dev jest @types/jest

# Run all access control tests
npm test -- --testPathPattern="access-control"

# Run specific test files
npm test comprehensive-access-control.test.ts
npm test role-based-filtering.test.ts
npm test dashboard-access-control.test.ts
```

### Expected Results
All tests should pass, confirming:
1. Proper role-based access control configuration
2. Correct API filtering by role and department
3. Appropriate UI restrictions by role
4. Secure data access patterns

## Security Validation

### Critical Security Checks ✅
1. **No privilege escalation**: Users cannot access higher-privilege features
2. **Data isolation**: Users can only see data they're authorized to view
3. **API security**: All endpoints properly validate user permissions
4. **Session validation**: All protected routes require valid authentication
5. **Role validation**: All features check user role before granting access

### Common Security Issues Prevented ✅
1. **Horizontal privilege escalation**: Employees cannot see other employees' data
2. **Vertical privilege escalation**: Lower roles cannot access higher role features
3. **Data leakage**: Department filtering prevents cross-department data access
4. **Unauthorized actions**: Users cannot perform actions outside their role permissions

## Maintenance and Updates

When adding new features or modifying access control:

1. **Update test files** to cover new scenarios
2. **Verify role specifications** are correctly implemented
3. **Test all user roles** with the new feature
4. **Update documentation** to reflect changes
5. **Run full test suite** to ensure no regressions

## Troubleshooting

### Common Issues
1. **Test failures**: Check mock configurations and user role setup
2. **Access denied errors**: Verify user role and permissions in test data
3. **Data filtering issues**: Check department and personal filtering logic
4. **UI component issues**: Verify role-based conditional rendering

### Debug Tips
1. Check console logs for access control decisions
2. Verify session data in test mocks
3. Confirm database queries include proper filtering
4. Test with different user roles and departments
