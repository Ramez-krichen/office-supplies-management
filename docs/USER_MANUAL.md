# User Manual - Office Supplies Management System

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Request Management](#request-management)
4. [Inventory Management](#inventory-management)
5. [Supplier Management](#supplier-management)
6. [Purchase Orders](#purchase-orders)
7. [Reports and Analytics](#reports-and-analytics)
8. [User Management](#user-management)
9. [Settings](#settings)
10. [Troubleshooting](#troubleshooting)

## 1. Getting Started

### 1.1 System Access
To access the Office Supplies Management System:

1. Open your web browser
2. Navigate to the application URL
3. Enter your login credentials
4. Click "Sign In"

### 1.2 Demo Accounts
For testing purposes, use these demo accounts:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@example.com | admin123 | Full system access |
| Manager | manager@example.com | manager123 | Department management |
| Employee | employee@example.com | employee123 | Request creation only |

### 1.3 First Login
After your first successful login:
1. Review your profile information
2. Familiarize yourself with the navigation menu
3. Check notification preferences in Settings
4. Review any pending requests or approvals

### 1.4 Navigation
The system uses a sidebar navigation with the following main sections:
- **Dashboard**: Overview and key metrics
- **Requests**: Create and manage supply requests
- **Inventory**: View and manage items
- **Suppliers**: Manage supplier information
- **Purchase Orders**: Track orders to suppliers
- **Reports**: Analytics and reporting
- **Users**: User management (Admin only)
- **Settings**: System configuration

## 2. Dashboard Overview

### 2.1 Key Metrics
The dashboard displays important metrics:
- **Pending Requests**: Number of requests awaiting approval
- **Low Stock Items**: Items below minimum stock level
- **Active Orders**: Current purchase orders in progress
- **Total Items**: Total number of items in inventory

### 2.2 Recent Activity
View recent requests and their status:
- Request title and description
- Requester information
- Current status
- Amount and date

### 2.3 Quick Actions
Access frequently used functions:
- Create new request
- View pending approvals
- Check low stock alerts
- Generate reports

## 3. Request Management

### 3.1 Creating a Request

#### Step 1: Navigate to Requests
1. Click "Requests" in the sidebar
2. Click "New Request" button

#### Step 2: Fill Request Details
1. **Title**: Enter a descriptive title
2. **Description**: Add detailed description (optional)
3. **Priority**: Select priority level (Low, Medium, High, Urgent)
4. **Department**: Your department (auto-filled)

#### Step 3: Add Items
1. Click "Add Item" to select supplies
2. Choose items from the catalog
3. Enter required quantities
4. Add notes for specific items (optional)

#### Step 4: Review and Submit
1. Review all request details
2. Check total amount
3. Attach files if needed
4. Click "Submit Request"

### 3.2 Managing Requests

#### Viewing Requests
- **My Requests**: View your submitted requests
- **All Requests**: View all requests (Manager/Admin only)
- **Filter Options**: Filter by status, department, date range

#### Request Status
- **Pending**: Awaiting approval
- **In Progress**: Being processed
- **Approved**: Approved and ready for ordering
- **Rejected**: Rejected with comments
- **Completed**: Fulfilled and closed

#### Editing Requests
- Requests can be edited only in "Pending" status
- Click "Edit" to modify request details
- Resubmit after making changes

### 3.3 Approval Process

#### For Approvers (Managers/Admins)
1. Navigate to "Requests" section
2. Filter by "Pending" status
3. Click on request to review details
4. Review items, quantities, and justification
5. Choose to Approve, Reject, or Request Changes
6. Add comments explaining decision
7. Submit approval decision

#### Approval Workflow
- **Level 1**: Department Manager approval
- **Level 2**: Admin approval (for high-value requests)
- **Auto-approval**: For low-value requests (configurable)

## 4. Inventory Management

### 4.1 Viewing Inventory
- **Item List**: Browse all available items
- **Categories**: Filter by item categories
- **Search**: Search by item name or reference
- **Stock Status**: Filter by stock levels

### 4.2 Item Information
Each item displays:
- **Name and Description**: Item details
- **Reference**: Unique item identifier
- **Category**: Item classification
- **Supplier**: Primary supplier
- **Price**: Current unit price
- **Stock Level**: Current and minimum stock
- **Status**: Active/Inactive

### 4.3 Stock Alerts
- **Low Stock**: Items below minimum level
- **Out of Stock**: Items with zero stock
- **Notifications**: Automatic alerts for managers

### 4.4 Adding Items (Admin Only)
1. Click "Add Item" button
2. Fill in item details:
   - Name and description
   - Reference number
   - Category and supplier
   - Unit price and measurement
   - Minimum stock level
3. Save the new item

## 5. Supplier Management

### 5.1 Supplier Directory
View all suppliers with:
- **Company Information**: Name and contact details
- **Performance Metrics**: Order history and statistics
- **Contact Information**: Email, phone, address
- **Status**: Active or inactive

### 5.2 Supplier Details
Each supplier profile includes:
- **Basic Information**: Name, contact person, address
- **Communication**: Email and phone numbers
- **Statistics**: Number of items supplied, total orders
- **Recent Activity**: Last order date and amount

### 5.3 Managing Suppliers (Admin Only)
- **Add Supplier**: Create new supplier profiles
- **Edit Information**: Update contact details
- **Deactivate**: Mark suppliers as inactive
- **Performance Review**: Track supplier metrics

## 6. Purchase Orders

### 6.1 Order Lifecycle
Purchase orders follow this workflow:
1. **Draft**: Created but not sent
2. **Sent**: Transmitted to supplier
3. **Confirmed**: Acknowledged by supplier
4. **Partially Received**: Some items delivered
5. **Received**: All items delivered
6. **Cancelled**: Order cancelled

### 6.2 Creating Orders
Orders are typically created automatically from approved requests, but can also be created manually:
1. Click "New Order" button
2. Select supplier
3. Add items and quantities
4. Review total amount
5. Save as draft or send immediately

### 6.3 Tracking Orders
- **Order Status**: Current stage in workflow
- **Expected Delivery**: Estimated delivery date
- **Items**: List of ordered items and quantities
- **Communication**: Notes and supplier correspondence

### 6.4 Receiving Orders
When items arrive:
1. Open the purchase order
2. Click "Mark as Received"
3. Confirm quantities received
4. Update stock levels automatically
5. Close the order

## 7. Reports and Analytics

### 7.1 Dashboard Reports
- **Monthly Spending**: Current month expenditure
- **Category Breakdown**: Spending by category
- **Top Suppliers**: Most used suppliers
- **Consumption Trends**: Usage patterns over time

### 7.2 Detailed Reports
- **Spending Analysis**: Detailed cost breakdown
- **Consumption Report**: Items used by department
- **Supplier Performance**: Delivery and quality metrics
- **Forecast Report**: Predicted future needs

### 7.3 Exporting Data
- **PDF Reports**: Formatted reports for printing
- **Excel Export**: Data for further analysis
- **CSV Files**: Raw data export
- **Email Reports**: Scheduled report delivery

## 8. User Management (Admin Only)

### 8.1 User Accounts
Manage user accounts with:
- **Personal Information**: Name, email, department
- **Role Assignment**: Admin, Manager, Employee
- **Status**: Active or inactive
- **Last Login**: Recent activity tracking

### 8.2 Role Permissions
- **Admin**: Full system access and configuration
- **Manager**: Department-level access and approvals
- **Employee**: Request creation and personal data access

### 8.3 User Operations
- **Add User**: Create new user accounts
- **Edit Profile**: Update user information
- **Reset Password**: Force password reset
- **Deactivate**: Disable user access

## 9. Settings

### 9.1 General Settings
- **Application Name**: System branding
- **Default Currency**: Monetary display format
- **Time Zone**: System time settings
- **Language**: Interface language (future feature)

### 9.2 Notification Settings
Configure notifications for:
- **Low Stock Alerts**: Inventory warnings
- **Request Approvals**: Approval notifications
- **Order Updates**: Purchase order status changes
- **System Messages**: Important announcements

### 9.3 Security Settings
- **Session Timeout**: Automatic logout time
- **Password Policy**: Password requirements
- **Two-Factor Authentication**: Additional security
- **Access Logging**: Activity monitoring

## 10. Troubleshooting

### 10.1 Common Issues

#### Login Problems
- **Forgot Password**: Use password reset link
- **Account Locked**: Contact administrator
- **Browser Issues**: Clear cache and cookies

#### Performance Issues
- **Slow Loading**: Check internet connection
- **Timeout Errors**: Refresh page and retry
- **Browser Compatibility**: Use supported browsers

#### Data Issues
- **Missing Items**: Check with administrator
- **Incorrect Stock**: Report to inventory manager
- **Permission Errors**: Verify role assignments

### 10.2 Getting Help
- **User Support**: Contact IT helpdesk
- **Training**: Request additional training
- **Documentation**: Refer to this manual
- **System Status**: Check system announcements

### 10.3 Best Practices
- **Regular Backups**: Save important data
- **Security**: Use strong passwords, log out when finished
- **Accuracy**: Double-check data entry
- **Communication**: Report issues promptly

---

*This user manual provides comprehensive guidance for using the Office Supplies Management System effectively. For additional support, contact your system administrator or IT helpdesk.*
