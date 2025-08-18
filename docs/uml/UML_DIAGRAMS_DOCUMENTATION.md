# UML Diagrams Documentation - Office Supplies Management System

## Overview

This document provides comprehensive documentation for the UML diagrams created for the Office Supplies Management System. The diagrams follow standard UML 2.5 notation and provide different perspectives of the system architecture, behavior, and structure.

## Diagram Types

### 1. Sequence Diagram - Request Approval Workflow
**File**: `sequence-diagram-request-approval.drawio`

#### Purpose
This sequence diagram illustrates the complete request approval workflow, showing the interactions between different system components and actors during the request lifecycle.

#### Participants
- **Employee**: The user who creates supply requests
- **System**: The application logic and business rules
- **Manager**: The approver who reviews and approves/rejects requests
- **Database**: The data persistence layer

#### Key Interactions
1. **Request Creation Phase**:
   - Employee submits a new request with items and priorities
   - System validates the request data
   - Request is saved to the database with a unique ID
   - System checks approval rules based on request amount
   - Notification is sent to the appropriate manager

2. **Approval Phase**:
   - Manager receives notification and reviews the request
   - System retrieves request details from the database
   - Manager makes approval decision (approve/reject)
   - System updates request status and creates approval record
   - Purchase order is automatically generated for approved requests
   - Notifications are sent to all relevant parties

#### Business Rules Demonstrated
- **Automatic Routing**: Requests are automatically routed to appropriate approvers
- **Audit Trail**: All actions are logged with timestamps and user information
- **Workflow Automation**: Approved requests trigger purchase order generation
- **Notification System**: Real-time notifications keep all parties informed

#### Alternative Flows
- **Rejection Flow**: If manager rejects, request status is updated and requester is notified
- **Multi-level Approval**: High-value requests may require additional approval levels
- **Timeout Handling**: Requests may auto-escalate if not approved within timeframe

### 2. Class Diagram - Domain Model
**File**: `class-diagram-domain-model.drawio`

#### Purpose
This class diagram represents the core domain entities of the Office Supplies Management System, showing their attributes, methods, and relationships.

#### Core Classes

##### User Class
- **Attributes**: id, email, name, password, role, department, timestamps
- **Methods**: authenticate(), hasPermission(), createRequest(), approveRequest()
- **Role**: Central entity for authentication and authorization

##### Request Class
- **Attributes**: id, title, description, status, priority, requester info, amounts, timestamps
- **Methods**: submit(), approve(), reject(), calculateTotal()
- **Role**: Represents supply requests with full lifecycle management

##### Item Class
- **Attributes**: id, reference, name, description, unit, price, stock levels, category/supplier IDs
- **Methods**: isLowStock(), updateStock()
- **Role**: Catalog items with inventory tracking

##### Supplier Class
- **Attributes**: id, name, contact information, timestamps
- **Methods**: getPerformanceMetrics(), updateContactInfo()
- **Role**: External vendor management

##### Category Class
- **Attributes**: id, name, description, parentId (for hierarchy)
- **Methods**: getSubcategories(), addSubcategory()
- **Role**: Hierarchical organization of items

##### PurchaseOrder Class
- **Attributes**: id, orderNumber, supplier info, status, amounts, dates
- **Methods**: send(), markReceived()
- **Role**: Order management and tracking

##### Supporting Classes
- **RequestItem**: Junction table linking requests to items with quantities
- **OrderItem**: Junction table linking purchase orders to items
- **Approval**: Approval workflow tracking with multi-level support
- **StockMovement**: Inventory transaction history

#### Enumerations
- **UserRole**: ADMIN, MANAGER, EMPLOYEE
- **RequestStatus**: PENDING, IN_PROGRESS, APPROVED, REJECTED, COMPLETED
- **Priority**: LOW, MEDIUM, HIGH, URGENT
- **PurchaseOrderStatus**: DRAFT, SENT, CONFIRMED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED
- **ApprovalStatus**: PENDING, APPROVED, REJECTED
- **MovementType**: IN, OUT, ADJUSTMENT, RETURN

#### Key Relationships
- **User → Request**: One-to-many (users create multiple requests)
- **Item → Category**: Many-to-one (items belong to categories)
- **Item → Supplier**: Many-to-one (items supplied by suppliers)
- **Category → Category**: Self-referencing (parent-child hierarchy)
- **Request ↔ Item**: Many-to-many through RequestItem
- **PurchaseOrder ↔ Item**: Many-to-many through OrderItem

#### Design Patterns
- **Composite Pattern**: Category hierarchy with parent-child relationships
- **State Pattern**: Request and PurchaseOrder status management
- **Observer Pattern**: Notification system for status changes
- **Factory Pattern**: Creation of different request types

### 3. Professional Use Case Diagram - System Overview (UML 2.5 Compliant)
**File**: `use-case-diagram-system-overview.drawio`

#### Purpose
This professionally enhanced UML 2.5 compliant use case diagram provides a comprehensive view of all system functionality organized by functional packages and user roles, demonstrating proper actor hierarchies and relationship types with improved visual design and organization.

#### Professional Enhancement Features
- **Enhanced Visual Design**: Improved colors, fonts, and layout for better readability
- **Comprehensive Coverage**: Added missing use cases for complete system representation
- **Better Organization**: Logical grouping of related functionality
- **Professional Styling**: Consistent visual elements and professional appearance
- **Extended Functionality**: Additional use cases for advanced features

#### UML 2.5 Compliance Features
- **Proper Stereotypes**: All actors and packages use correct UML 2.5 stereotypes
- **Package Organization**: Use cases grouped into logical functional packages
- **Actor Inheritance**: Hierarchical actor relationships with generalization
- **Relationship Types**: Proper include, extend, and association relationships
- **System Boundary**: Clear system boundary with stereotype notation
- **Color Coding**: Functional areas distinguished by consistent color schemes

#### Actor Hierarchy (with UML 2.5 Generalization)

##### Employee (Base Actor)
- **Stereotype**: `<<actor>>`
- **Access Level**: Basic user with limited permissions
- **Primary Use Cases**:
  - Authenticate User
  - Create Supply Request
  - Edit Request (included in Create)
  - View My Requests
  - Track Request Status
  - Cancel Request
  - View Inventory

##### Manager (Inherits from Employee)
- **Stereotype**: `<<actor>>`
- **Generalization**: Inherits all Employee capabilities
- **Additional Use Cases**:
  - Approve Request
  - Reject Request
  - View All Requests
  - Generate Reports
  - View Analytics
  - Export Data

##### Administrator (Inherits from Manager)
- **Stereotype**: `<<actor>>`
- **Generalization**: Inherits all Manager capabilities
- **Additional Use Cases**:
  - Manage Users
  - Manage Suppliers
  - Configure System
  - Backup Data
  - View Audit Logs
  - Manage Permissions

##### External Actors

###### Supplier
- **Stereotype**: `<<actor>>`
- **Access Level**: Limited external access
- **Primary Use Cases**:
  - Confirm Order
  - Update Delivery Status

###### Email System
- **Stereotype**: `<<actor>>`
- **Type**: System actor for notifications
- **Primary Use Cases**:
  - Send Email Alerts

#### Functional Package Organization

##### Authentication & Security Package
- **Stereotype**: `<<package>>`
- **Use Cases**: Authenticate User, Logout, Manage Profile
- **Purpose**: User authentication, session management, and profile administration
- **Enhancements**: Added profile management for better user experience

##### Request Management Package
- **Stereotype**: `<<package>>`
- **Use Cases**: Create Supply Request, Edit Request, View My Requests, Track Request Status, Cancel Request, Duplicate Request
- **Purpose**: Complete request lifecycle management with enhanced functionality
- **Enhancements**: Added request duplication for efficiency

##### Approval Management Package
- **Stereotype**: `<<package>>`
- **Use Cases**: Approve Request, Reject Request, View All Requests, Delegate Approval
- **Purpose**: Request approval workflow with delegation capabilities
- **Enhancements**: Added approval delegation for workflow flexibility

##### Inventory Management Package
- **Stereotype**: `<<package>>`
- **Use Cases**: View Inventory, Manage Items, Update Stock Levels, Monitor Stock Alerts, Manage Categories, Inventory Reports
- **Purpose**: Comprehensive inventory tracking and stock management
- **Enhancements**: Added inventory-specific reporting capabilities

##### Purchase Order Management Package
- **Stereotype**: `<<package>>`
- **Use Cases**: Create Purchase Order, Send Purchase Order, Track Delivery, Receive Goods, Update PO Status, PO Reports
- **Purpose**: Complete purchase order lifecycle and supplier coordination
- **Enhancements**: Added PO-specific reporting and enhanced tracking

##### Reporting & Analytics Package
- **Stereotype**: `<<package>>`
- **Use Cases**: Generate Reports, View Analytics, Export Data, Schedule Reports
- **Purpose**: Advanced business intelligence and automated data analysis
- **Enhancements**: Added report scheduling for automated insights

##### System Administration Package
- **Stereotype**: `<<package>>`
- **Use Cases**: Manage Users, Manage Suppliers, Configure System, Backup Data, View Audit Logs, Manage Permissions, System Monitoring, Data Migration
- **Purpose**: Comprehensive system configuration and administration
- **Enhancements**: Added system monitoring and data migration capabilities

##### External Integration Package
- **Stereotype**: `<<package>>`
- **Use Cases**: Confirm Order, Update Delivery Status, Send Notifications, Send Email Alerts, Generate Stock Alerts, API Integration
- **Purpose**: External system integration and communication with API support
- **Enhancements**: Added comprehensive API integration capabilities

#### UML 2.5 Relationship Types

##### Include Relationships (<<include>>)
- **Create Request includes Edit Request**: Request creation inherently includes editing capability
- **Approve Request includes Send Notifications**: Approval automatically triggers notifications
- **Update Stock includes Generate Stock Alerts**: Stock updates include alert generation

##### Extend Relationships (<<extend>>)
- **Create Purchase Order extends Approve Request**: PO creation is an optional extension of approval
- **Send Email Alerts extends Send Notifications**: Email alerts extend basic notification functionality

##### Generalization Relationships
- **Manager generalizes Employee**: Manager inherits all Employee capabilities
- **Administrator generalizes Manager**: Administrator inherits all Manager capabilities

#### System Boundary
The system boundary uses proper UML 2.5 notation with `<<system>>` stereotype, clearly delineating:
- **Internal Processes**: All packaged use cases within the system
- **External Interfaces**: Supplier and Email System actors
- **Clear Separation**: Internal vs external functionality

## UML Notation Standards

### Sequence Diagram Notation
- **Lifelines**: Vertical dashed lines representing object existence
- **Activation Boxes**: Rectangles showing when objects are active
- **Synchronous Messages**: Solid arrows with filled arrowheads
- **Asynchronous Messages**: Solid arrows with open arrowheads
- **Return Messages**: Dashed arrows
- **Self-Messages**: Arrows that loop back to the same lifeline

### Class Diagram Notation
- **Classes**: Rectangles with three compartments (name, attributes, methods)
- **Visibility**: + (public), - (private), # (protected), ~ (package)
- **Associations**: Lines connecting classes with multiplicity
- **Inheritance**: Hollow triangle arrows
- **Composition**: Filled diamond arrows
- **Aggregation**: Hollow diamond arrows
- **Dependencies**: Dashed arrows

### Use Case Diagram Notation
- **Actors**: Stick figures representing external entities
- **Use Cases**: Ovals representing system functionality
- **System Boundary**: Rectangle enclosing system use cases
- **Associations**: Lines connecting actors to use cases
- **Include**: Dashed arrows with <<include>> stereotype
- **Extend**: Dashed arrows with <<extend>> stereotype

## Implementation Mapping

### Database Schema Mapping
The class diagram directly maps to the database schema implemented with Prisma:
- **Classes** → Database tables
- **Attributes** → Table columns
- **Associations** → Foreign key relationships
- **Enumerations** → Enum types or check constraints

### API Endpoint Mapping
Use cases map to RESTful API endpoints:
- **Create Request** → POST /api/requests
- **Approve Request** → PUT /api/requests/:id/approve
- **Manage Inventory** → CRUD operations on /api/items
- **Generate Reports** → GET /api/reports/*

### Component Architecture Mapping
Sequence diagrams inform the component architecture:
- **System** → Next.js API routes and business logic
- **Database** → Prisma ORM and SQLite/PostgreSQL
- **Notifications** → Email service integration
- **Authentication** → NextAuth.js middleware

## Maintenance and Updates

### Diagram Versioning
- All diagrams are stored in version control
- Changes are tracked with commit messages
- Major updates require documentation updates

### Consistency Checks
- Regular reviews ensure diagrams match implementation
- Automated tests validate business rules shown in diagrams
- Code reviews include diagram impact assessment

### Future Enhancements
- Additional sequence diagrams for complex workflows
- Component diagrams for technical architecture
- Deployment diagrams for infrastructure
- Activity diagrams for business processes

---

*These UML diagrams provide a comprehensive view of the Office Supplies Management System from multiple perspectives, supporting both development and maintenance activities while ensuring clear communication of system design and behavior.*
