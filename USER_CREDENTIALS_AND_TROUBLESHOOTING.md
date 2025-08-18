# User Credentials and Troubleshooting Guide

## ✅ Successfully Added Users

The following users have been successfully created in the system:

### 🔑 Login Credentials

| Role | Email | Password | Department |
|------|-------|----------|------------|
| **ADMIN** | admin@example.com | admin123 | IT |
| **MANAGER** | manager@example.com | manager123 | Operations |
| **EMPLOYEE** | employee@example.com | employee123 | Operations |

## 📊 Database Status

- **Total Users**: 97
- **Admins**: 1
- **Managers**: 18
- **Employees**: 78
- **Notifications**: 13 (system notifications)

## 🌐 Application Access

- **URL**: http://localhost:3000
- **Development Server**: Running on port 3000
- **Database**: SQLite (dev.db)

## 🔧 NotificationBadge Error Analysis

### Error Details
```
TypeError: Failed to fetch
    at fetchUnreadCount (NotificationBadge.tsx:69:36)
Error: Network error - server may be down or unreachable
```

### Root Cause Analysis
The error occurs when the NotificationBadge component tries to fetch unread notifications from `/api/admin/notifications?status=UNREAD`. This typically happens when:

1. **Server Not Running**: The development server isn't running
2. **Network Issues**: Local network connectivity problems
3. **API Endpoint Issues**: The notification API endpoint has problems

### ✅ Verification Steps Completed

1. **Database Connection**: ✅ Working (97 users, 13 notifications)
2. **Notification Table**: ✅ Exists and functional
3. **API Endpoint**: ✅ `/api/admin/notifications` route exists
4. **User Authentication**: ✅ All user roles created successfully
5. **Development Server**: ✅ Running on port 3000

### 🎯 Troubleshooting Steps

#### If NotificationBadge Error Persists:

1. **Check Server Status**:
   ```bash
   # Verify server is running
   netstat -ano | findstr :3000
   ```

2. **Restart Development Server**:
   ```bash
   cd "Internship-main\summer internship test\office-supplies-management"
   npm run dev
   ```

3. **Test API Endpoint Manually**:
   - Login as admin (admin@example.com / admin123)
   - Open browser dev tools (F12)
   - Check Network tab for failed requests
   - Look for 500/404 errors on `/api/admin/notifications`

4. **Check Database Connection**:
   ```bash
   npx tsx scripts/test-notification-fix.ts
   ```

5. **Clear Browser Cache**:
   - Hard refresh (Ctrl+F5)
   - Clear browser cache and cookies
   - Try incognito/private browsing mode

#### Expected Behavior:
- **Admin/Manager users**: Should see notification bell icon
- **Employee users**: Should NOT see notification bell (by design)
- **Unauthenticated users**: Should NOT see notification bell

## 🚀 Next Steps

1. **Login Testing**:
   - Test all three user accounts
   - Verify role-based access control
   - Check dashboard functionality

2. **Notification System**:
   - Login as admin to test notification badge
   - Check if notifications load properly
   - Verify notification center functionality

3. **System Functionality**:
   - Test inventory management
   - Test request creation and approval
   - Test user management (admin only)

## 📝 Additional Notes

- The notification system is designed to only show for ADMIN and MANAGER roles
- Employee users will not see the notification badge (this is intentional)
- The system includes comprehensive error handling for network issues
- All passwords use bcrypt hashing with 12 rounds for security

## 🔍 Debugging Commands

```bash
# Check all users
npx tsx scripts/add-specific-users.ts

# Test notification system
npx tsx scripts/test-notification-fix.ts

# Reset database (if needed)
npm run db:fixed-reset

# Start development server
npm run dev
```
