# Department Filtering Implementation for Manager Reports

## Overview

This document describes the implementation of department-specific filtering for managers in the Reports section of the office supplies management system. The goal is to ensure that managers only see data related to their own department, while admins continue to see data from all departments.

## Problem Statement

Previously, when managers logged in and accessed the Reports section, they would see reports including data from all departments. This was not ideal because:

1. Managers should only have access to their own department's data
2. The reports page didn't clearly indicate that data was being filtered
3. There was no visual indication of which department the data belonged to
4. Some API endpoints were not consistently applying department filtering

## Solution Implementation

### 1. Frontend Changes (Reports Page)

**File: `src/app/reports/page.tsx`**

- Added session management using `useSession()` hook
- Implemented dynamic page title and description based on user role
- Added department indicator banner for managers
- Updated all section headers to show department context
- Enhanced quick report descriptions to be department-specific
- Added loading state for session fetching

**Key Features:**
- **Dynamic Title**: Shows "{Department} Department Reports" for managers vs "Reports & Analytics" for admins
- **Department Banner**: Blue info box showing "Showing data filtered for {Department} department only"
- **Contextual Headers**: All sections show department name in parentheses when applicable
- **Personalized Descriptions**: Quick report buttons show department-specific descriptions

### 2. Backend API Changes

**Files Modified:**
- `src/app/api/reports/analytics/route.ts`
- `src/app/api/reports/spending/route.ts`
- `src/app/api/reports/quick/route.ts`

**Key Improvements:**
- **Consistent Filtering**: All endpoints now use the same department filtering logic
- **Helper Function**: Created `buildDepartmentFilter()` function for consistent implementation
- **Complete Coverage**: Category, supplier, and all other data is now properly filtered
- **Performance**: Reduced duplicate code and improved maintainability

### 3. Department Filtering Logic

**Helper Function:**
```typescript
const buildDepartmentFilter = (field: string) => {
  if (!requiresDepartmentFiltering || !userDepartment) return {}
  
  return {
    [field]: {
      OR: [
        { department: userDepartment },
        { departmentRef: { name: userDepartment } }
      ]
    }
  }
}
```

**Filtering Fields:**
- **Requests**: `requester` field
- **Purchase Orders**: `createdBy` field
- **Categories**: Filtered through request relationships
- **Suppliers**: Filtered through request relationships

### 4. Access Control Integration

The implementation leverages the existing access control system:

- **`requiresDepartmentFiltering`**: Determined by `isDepartmentRestricted()` function
- **`userDepartment`**: Retrieved from user session
- **Role-based Logic**: Managers get filtered data, admins get all data

## User Experience Changes

### For Managers:
- **Clear Department Context**: Page title shows their department name
- **Filtered Data**: All charts, metrics, and reports show only their department's data
- **Visual Indicators**: Blue banner and department labels throughout the interface
- **Personalized Content**: Descriptions and labels reference their specific department

### For Admins:
- **No Change**: Continue to see all departments' data
- **Global View**: Maintain access to system-wide analytics and reports

## Technical Implementation Details

### 1. Session Management
```typescript
const { data: session, status } = useSession()
const isDepartmentSpecific = session?.user?.role === 'MANAGER' && session?.user?.department
const userDepartment = session?.user?.department
```

### 2. Conditional Rendering
```typescript
<h1 className="text-2xl font-bold text-gray-900">
  {isDepartmentSpecific ? `${userDepartment} Department Reports` : 'Reports & Analytics'}
</h1>
```

### 3. Department Banner
```typescript
{isDepartmentSpecific && (
  <div className="flex items-center mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
    <Building2 className="h-4 w-4 mr-2" />
    Showing data filtered for {userDepartment} department only
  </div>
)}
```

### 4. Contextual Headers
```typescript
<h3 className="text-lg font-medium text-gray-900 mb-4">
  Spending by Category
  {isDepartmentSpecific && (
    <span className="text-sm font-normal text-gray-500 ml-2">({userDepartment})</span>
  )}
</h3>
```

## Testing

A test script has been created (`test-department-filtering.js`) to verify:

1. **Manager Filtering**: Ensures managers only see their department's data
2. **Admin Access**: Confirms admins can see all departments
3. **Data Consistency**: Checks for department field consistency
4. **Request Filtering**: Validates request-level department filtering

## Benefits

### 1. **Security**: Managers can only access their department's data
### 2. **Clarity**: Clear indication of what data is being shown
### 3. **Consistency**: All reports and analytics follow the same filtering rules
### 4. **User Experience**: Personalized interface for department managers
### 5. **Maintainability**: Centralized filtering logic for easy updates

## Future Enhancements

### 1. **Department Switcher**: Allow admins to toggle between different departments
### 2. **Comparative Analysis**: Show department performance vs. other departments
### 3. **Department-specific KPIs**: Custom metrics for each department
### 4. **Export Options**: Department-specific report exports
### 5. **Real-time Updates**: Live department data updates

## Conclusion

The department filtering implementation successfully addresses the original problem by:

- Ensuring managers only see their department's data
- Providing clear visual indicators of data scope
- Maintaining admin access to all data
- Implementing consistent filtering across all API endpoints
- Creating a personalized user experience for department managers

The solution is scalable, maintainable, and follows the existing access control patterns in the system.

