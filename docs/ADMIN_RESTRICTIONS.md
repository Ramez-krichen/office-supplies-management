# Admin User Restrictions Implementation

## Overview
This document outlines the implementation of admin user restrictions to ensure only one admin user exists in the system with the email `admin@example.com`.

## Changes Made

### 1. Database Seed Scripts Updated
All seed scripts have been modified to create only one admin user:

- **scripts/seed.ts**: Removed second admin user creation
- **scripts/fixed-seed.ts**: Removed second admin user creation  
- **scripts/enhanced-seed.ts**: Removed second admin user creation, changed email to `admin@example.com`
- **prisma/comprehensive-seed.ts**: Removed loop creating multiple admins, now creates single admin

### 2. API Route Validations

#### User Creation Routes
- **`/api/users/route.ts`**: Added admin limit validation in POST method
- **`/api/admin/users/route.ts`**: Enhanced admin limit validation (already existed)

#### User Update Routes
- **`/api/users/[id]/route.ts`**: Added comprehensive validations:
  - Prevent changing main admin email
  - Prevent changing role to admin if one already exists
  - Prevent changing main admin's role
  - Prevent deleting main admin user

- **`/api/admin/users/[id]/route.ts`**: Added same comprehensive validations

### 3. Frontend Validations

#### UserModal Component
- **`src/components/modals/UserModal.tsx`**: Added client-side validations:
  - Prevent changing main admin email
  - Prevent changing main admin role
  - Enhanced admin role creation validation

#### User Management Pages
- **`src/app/users/page.tsx`**: Added UI protections:
  - Hide delete button for main admin
  - Hide activate/deactivate buttons for main admin
  - Show "Main Admin" label

- **`src/app/admin/page.tsx`**: Added visual indicator for main admin

### 4. Admin Cleanup Script
- **`scripts/cleanup-admin-users.ts`**: New script to:
  - Ensure main admin exists with `admin@example.com`
  - Convert other admin users to managers
  - Verify final state has only one admin

- **package.json**: Added `db:cleanup-admins` script

## Validation Rules

### Main Admin Protection
The user with email `admin@example.com` is protected from:
1. Email changes
2. Role changes (must remain ADMIN)
3. Account deletion
4. Account deactivation

### Admin Role Restrictions
1. Only one user can have the ADMIN role at any time
2. New users cannot be assigned ADMIN role if one already exists
3. Existing users cannot be changed to ADMIN role if one already exists

## API Error Messages
- `"Cannot change email of the main admin account"` (403)
- `"Cannot change role of the main admin account"` (403)
- `"Cannot delete the main admin account"` (403)
- `"Only one admin account is allowed"` (403)

## Usage Instructions

### Running Admin Cleanup
To ensure only one admin exists:
```bash
npm run db:cleanup-admins
```

### Seeding Database
All seed scripts now create only one admin:
```bash
npm run db:seed
# or
npm run db:fixed-seed
```

### Main Admin Credentials
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: ADMIN
- **Department**: IT

## Technical Implementation Details

### Backend Validations
1. **User Creation**: Check admin count before creating new admin users
2. **User Updates**: Validate current user state and prevent unauthorized changes
3. **User Deletion**: Block deletion of main admin account

### Frontend Protections
1. **Form Validation**: Client-side checks in UserModal
2. **UI Controls**: Hide/disable actions for main admin
3. **Visual Indicators**: Show "Main Admin" labels

### Database Constraints
- Email uniqueness enforced by Prisma schema
- Role validation through application logic
- Status management with proper constraints

## Security Considerations
1. Main admin cannot be accidentally deleted or modified
2. System always maintains exactly one admin user
3. Admin privileges cannot be escalated without proper validation
4. All changes are logged and validated server-side

## Testing
To verify the implementation:
1. Run cleanup script: `npm run db:cleanup-admins`
2. Try creating additional admin users (should fail)
3. Try modifying main admin email/role (should fail)
4. Try deleting main admin (should fail)
5. Verify UI protections in user management pages
