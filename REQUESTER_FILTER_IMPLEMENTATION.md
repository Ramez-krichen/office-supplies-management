# Requester Filter Implementation

## Overview
Added a new filter to the requests page that allows users to filter requests by who created them (the requester).

## Changes Made

### 1. Backend API Changes (`/src/app/api/requests/route.ts`)
- Added `requesterId` parameter extraction from search params
- Added filtering logic to include `requesterId` in the database query where clause
- The filter works alongside existing filters (status, priority, department, date range)

### 2. Frontend Changes (`/src/app/requests/page.tsx`)
- Added `requesterFilter` state variable (defaults to 'ALL')
- Added `users` state to store the list of available users
- Added `isLoadingUsers` state for loading indicator
- Added `fetchUsers()` function to load users from `/api/users` endpoint
- Updated `fetchRequests()` to include requester filter in API calls
- Added requester filter to useEffect dependencies
- Updated URL parameter handling to support requester filter
- Updated the filter grid layout from 4 columns to 5 columns
- Added requester dropdown in the filters section
- Updated "no requests found" condition to include requester filter

### 3. UI Components
- Added a new "Requester" dropdown filter in the filters section
- Dropdown shows "All Requesters" as default option
- Lists all users by name, with user ID as the value
- Dropdown is disabled while users are loading
- Maintains consistent styling with other filter dropdowns
- **Role-based visibility**: Only shown to ADMIN and MANAGER roles (hidden for EMPLOYEE)
- Grid layout adjusts automatically (4 columns for employees, 5 columns for admins/managers)

## How It Works

1. **User Selection**: Users can select a specific requester from the dropdown to filter requests
2. **API Integration**: The selected requester ID is sent to the backend API as a query parameter
3. **Database Filtering**: The backend filters requests where `requesterId` matches the selected user ID
4. **Real-time Updates**: The filter updates immediately when changed, just like other filters
5. **URL Support**: The filter can be set via URL parameters (e.g., `?requesterId=user123`)

## Technical Details

- **Filter Parameter**: `requesterId` (user ID)
- **API Endpoint**: Uses existing `/api/requests` with additional query parameter
- **User Data Source**: `/api/users` endpoint provides the list of available users
- **State Management**: Uses React useState for filter state and user list
- **Performance**: Users are fetched once and cached in component state

## Benefits

- **Enhanced Filtering**: Users can now easily find requests created by specific people
- **Improved User Experience**: Reduces time spent searching through large lists of requests
- **Administrative Oversight**: Managers and admins can quickly review requests from specific team members
- **Consistent Interface**: Follows the same pattern as existing filters
- **URL Shareable**: Filter state can be shared via URL parameters
- **Role-based Security**: Employees can only see their own requests (filter hidden for them)
- **Responsive Design**: UI adapts based on user permissions

## Usage Examples

- Filter to see only requests created by "John Doe"
- Combine with other filters (e.g., pending requests from John Doe in IT department)
- Use URL parameter: `/requests?requesterId=clx123abc&status=PENDING`
