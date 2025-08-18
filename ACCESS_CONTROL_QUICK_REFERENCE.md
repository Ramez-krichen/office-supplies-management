# Access Control Quick Reference Guide

## Role Summary

| Role | Access Level | Key Features |
|------|-------------|--------------|
| **Admin** | Global | Full system access, user management, cannot create requests |
| **Manager** | Department | Department oversight, request approval, inventory management |
| **Employee** | Personal | Own requests only, read-only inventory, no approvals |

## Common Code Patterns

### API Route Protection
```typescript
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control'

export async function GET() {
  const accessCheck = await checkAccess(createFeatureAccessCheck('FEATURE_NAME', 'view')())
  if (!accessCheck.hasAccess) {
    return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
  }
  
  const { user, userRole, userDepartment, requiresDepartmentFiltering, additionalRestrictions } = accessCheck
  // Use these values for data filtering
}
```

### Data Filtering Patterns
```typescript
// Department filtering (for managers)
const whereClause = {
  ...(requiresDepartmentFiltering && userDepartment && {
    requester: { department: userDepartment }
  })
}

// Personal filtering (for employees)
const whereClause = {
  ...(additionalRestrictions?.includes('personal_only') && {
    requesterId: user.id
  })
}
```

### UI Component Protection
```typescript
import { useClientAccessControl } from '@/lib/client-access-control'

function MyComponent() {
  const { hasAccess } = useClientAccessControl('featureName', 'action')
  
  if (!hasAccess) {
    return null // or <AccessDenied />
  }
  
  return <div>Protected content</div>
}
```

### Role-Based Conditional Rendering
```typescript
import { useSession } from 'next-auth/react'

function MyComponent() {
  const { data: session } = useSession()
  
  return (
    <div>
      {session?.user?.role === 'ADMIN' && <AdminOnlyComponent />}
      {['ADMIN', 'MANAGER'].includes(session?.user?.role) && <ManagerComponent />}
      {session?.user?.role !== 'EMPLOYEE' && <NotForEmployees />}
    </div>
  )
}
```

## Feature Access Quick Check

### Requests
- **Admin**: View all, Edit all, Approve all, ❌ Create
- **Manager**: Department only, Create ✅, Approve ✅
- **Employee**: Personal only, Create ✅, ❌ Approve

### Inventory
- **Admin**: Full CRUD ✅
- **Manager**: View ✅, Edit ✅, ❌ Create/Delete
- **Employee**: Read-only ✅

### Users
- **Admin**: Full CRUD ✅
- **Manager**: ❌ No access
- **Employee**: ❌ No access

### Reports
- **Admin**: All data ✅
- **Manager**: Department data ✅
- **Employee**: Personal data ✅

### Purchase Orders
- **Admin**: Full access ✅
- **Manager**: ❌ Requires explicit grant
- **Employee**: ❌ No access

## Dashboard Access

| Dashboard | Admin | Manager | Employee |
|-----------|-------|---------|----------|
| `/dashboard/admin` | ✅ | ❌ | ❌ |
| `/dashboard/system` | ✅ | ❌ | ❌ |
| `/dashboard/manager` | ✅ | ✅ | ❌ |
| `/dashboard/employee` | ✅ | ✅ | ✅ |

## API Endpoints by Role

### Admin-Only APIs
```
/api/admin/*
/api/users/*
/api/audit-logs
/api/dashboard/admin
/api/dashboard/system
```

### Manager-Accessible APIs
```
/api/requests (department-filtered)
/api/inventory
/api/reports/* (department-filtered)
/api/dashboard/manager
/api/categories
```

### Employee-Accessible APIs
```
/api/requests (personal only)
/api/inventory (read-only)
/api/reports/spending (personal only)
/api/dashboard/employee
/api/profile
```

## Data Filtering Examples

### Requests API
```typescript
// Admin: No filtering
const requests = await prisma.request.findMany()

// Manager: Department filtering
const requests = await prisma.request.findMany({
  where: {
    requester: { department: userDepartment }
  }
})

// Employee: Personal filtering
const requests = await prisma.request.findMany({
  where: {
    requesterId: user.id
  }
})
```

### Reports API
```typescript
// Admin: Global data
const data = await prisma.request.findMany({
  where: { status: 'APPROVED' }
})

// Manager: Department data
const data = await prisma.request.findMany({
  where: {
    status: 'APPROVED',
    requester: { department: userDepartment }
  }
})

// Employee: Personal data
const data = await prisma.request.findMany({
  where: {
    status: 'APPROVED',
    requesterId: user.id
  }
})
```

## Notification Access

### Low Stock Alerts
- **Admin**: ✅ Global alerts
- **Manager**: ✅ Global alerts (inventory is global)
- **Employee**: ❌ No access

### Pending Approvals
- **Admin**: ✅ System-wide
- **Manager**: ✅ Department only
- **Employee**: ❌ No access

## Common Mistakes to Avoid

1. **Client-Side Only Protection**: Always enforce on server-side
2. **Missing Data Filtering**: Don't forget to filter data by role
3. **Hardcoded Role Checks**: Use the access control system
4. **Inconsistent Permissions**: Keep UI and API permissions aligned
5. **Missing Error Handling**: Handle access denied gracefully

## Testing Checklist

- [ ] API endpoints protected
- [ ] Data filtering implemented
- [ ] UI components protected
- [ ] Navigation restricted
- [ ] Error handling in place
- [ ] All roles tested
- [ ] Cross-department access blocked
- [ ] Personal data isolated

## Quick Debugging

### Check User Session
```typescript
const session = await getServerSession(authOptions)
console.log('User:', session?.user)
```

### Check Access Control
```typescript
const accessCheck = await checkAccess(createFeatureAccessCheck('FEATURE', 'action')())
console.log('Access Check:', accessCheck)
```

### Check Data Filtering
```typescript
console.log('Department Filtering:', requiresDepartmentFiltering)
console.log('Additional Restrictions:', additionalRestrictions)
```

## Emergency Access

If access control is blocking legitimate access:

1. Check user role in database
2. Verify access control configuration
3. Check session authentication
4. Review API route protection
5. Test with different user accounts

## Performance Tips

1. **Cache Access Checks**: Cache frequent access control decisions
2. **Efficient Queries**: Use database indexes for filtering
3. **Minimal Checks**: Only check what's necessary
4. **Batch Operations**: Group access checks when possible

## Security Reminders

- ✅ Always validate on server-side
- ✅ Use parameterized queries
- ✅ Log access attempts
- ✅ Handle errors gracefully
- ✅ Test all access scenarios
- ❌ Never trust client-side validation alone
- ❌ Don't expose sensitive data in errors
- ❌ Don't hardcode permissions
