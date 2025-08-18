# Architecture Diagrams - Office Supplies Management System

## System Architecture Overview

### High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Web[Web Browser]
        Mobile[Mobile Browser]
    end
    
    subgraph "Application Layer"
        NextJS[Next.js Application]
        Auth[NextAuth.js]
        API[API Routes]
    end
    
    subgraph "Data Layer"
        Prisma[Prisma ORM]
        DB[(SQLite/PostgreSQL)]
    end
    
    subgraph "External Services"
        Email[Email Service]
        Storage[File Storage]
    end
    
    Web --> NextJS
    Mobile --> NextJS
    NextJS --> Auth
    NextJS --> API
    API --> Prisma
    Prisma --> DB
    API --> Email
    API --> Storage
```

### Component Architecture

```mermaid
graph TB
    subgraph "Pages Layer"
        Dashboard[Dashboard Page]
        Requests[Requests Page]
        Inventory[Inventory Page]
        Orders[Orders Page]
        Reports[Reports Page]
    end
    
    subgraph "Layout Components"
        Layout[Dashboard Layout]
        Sidebar[Sidebar Navigation]
        Header[Header Component]
    end
    
    subgraph "Feature Components"
        RequestForm[Request Form]
        ItemList[Item List]
        OrderCard[Order Card]
        Chart[Chart Component]
    end
    
    subgraph "UI Components"
        Button[Button]
        Input[Input Field]
        Modal[Modal Dialog]
        Table[Data Table]
    end
    
    Dashboard --> Layout
    Requests --> Layout
    Inventory --> Layout
    Orders --> Layout
    Reports --> Layout
    
    Layout --> Sidebar
    Layout --> Header
    
    Requests --> RequestForm
    Inventory --> ItemList
    Orders --> OrderCard
    Reports --> Chart
    
    RequestForm --> Button
    RequestForm --> Input
    ItemList --> Table
    OrderCard --> Modal
```

## Database Entity Relationship Diagram

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string name
        string password
        enum role
        string department
        datetime createdAt
        datetime updatedAt
    }
    
    Supplier {
        string id PK
        string name
        string email
        string phone
        string address
        string contactPerson
        datetime createdAt
        datetime updatedAt
    }
    
    Category {
        string id PK
        string name UK
        string description
        string parentId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Item {
        string id PK
        string reference UK
        string name
        string description
        string unit
        float price
        int minStock
        int currentStock
        string categoryId FK
        string supplierId FK
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    Request {
        string id PK
        string title
        string description
        enum status
        enum priority
        string requesterId FK
        string department
        float totalAmount
        string attachments
        datetime createdAt
        datetime updatedAt
    }
    
    RequestItem {
        string id PK
        string requestId FK
        string itemId FK
        int quantity
        float unitPrice
        float totalPrice
        string notes
    }
    
    Approval {
        string id PK
        string requestId FK
        string approverId FK
        enum status
        string comments
        int level
        datetime createdAt
        datetime updatedAt
    }
    
    PurchaseOrder {
        string id PK
        string orderNumber UK
        string supplierId FK
        enum status
        float totalAmount
        datetime orderDate
        datetime expectedDate
        datetime receivedDate
        string notes
        string createdById FK
        datetime createdAt
        datetime updatedAt
    }
    
    OrderItem {
        string id PK
        string purchaseOrderId FK
        string itemId FK
        int quantity
        float unitPrice
        float totalPrice
        int receivedQuantity
    }
    
    StockMovement {
        string id PK
        string itemId FK
        enum type
        int quantity
        string reason
        string reference
        string userId FK
        datetime createdAt
    }
    
    User ||--o{ Request : creates
    User ||--o{ Approval : approves
    User ||--o{ StockMovement : records
    User ||--o{ PurchaseOrder : creates
    
    Supplier ||--o{ Item : supplies
    Supplier ||--o{ PurchaseOrder : receives
    
    Category ||--o{ Item : categorizes
    Category ||--o{ Category : parent-child
    
    Item ||--o{ RequestItem : requested
    Item ||--o{ OrderItem : ordered
    Item ||--o{ StockMovement : moved
    
    Request ||--o{ RequestItem : contains
    Request ||--o{ Approval : requires
    
    PurchaseOrder ||--o{ OrderItem : contains
```

## User Flow Diagrams

### Request Creation Flow

```mermaid
flowchart TD
    Start([User Login]) --> Dashboard[Dashboard]
    Dashboard --> RequestsPage[Requests Page]
    RequestsPage --> NewRequest[Click New Request]
    NewRequest --> RequestForm[Request Form]
    RequestForm --> SelectItems[Select Items]
    SelectItems --> AddQuantity[Add Quantities]
    AddQuantity --> Review[Review Request]
    Review --> Submit[Submit Request]
    Submit --> Notification[Send Notification]
    Notification --> Confirmation[Confirmation Page]
    Confirmation --> End([End])
    
    Review --> Back[Back to Edit]
    Back --> RequestForm
```

### Approval Workflow

```mermaid
flowchart TD
    RequestSubmitted[Request Submitted] --> CheckApprover{Requires Approval?}
    CheckApprover -->|Yes| NotifyApprover[Notify Approver]
    CheckApprover -->|No| AutoApprove[Auto Approve]
    
    NotifyApprover --> ApproverReview[Approver Reviews]
    ApproverReview --> ApprovalDecision{Decision}
    
    ApprovalDecision -->|Approve| Approved[Mark Approved]
    ApprovalDecision -->|Reject| Rejected[Mark Rejected]
    ApprovalDecision -->|Request Changes| RequestChanges[Request Changes]
    
    Approved --> NextLevel{More Levels?}
    NextLevel -->|Yes| NotifyNextApprover[Notify Next Approver]
    NextLevel -->|No| FinalApproval[Final Approval]
    
    NotifyNextApprover --> ApproverReview
    
    Rejected --> NotifyRequester[Notify Requester]
    RequestChanges --> NotifyRequester
    FinalApproval --> CreatePO[Create Purchase Order]
    AutoApprove --> CreatePO
    
    CreatePO --> End([End])
    NotifyRequester --> End
```

### Inventory Management Flow

```mermaid
flowchart TD
    Start([Inventory Check]) --> CheckStock{Stock Level}
    CheckStock -->|Below Minimum| LowStockAlert[Generate Low Stock Alert]
    CheckStock -->|Above Minimum| Normal[Normal Status]
    
    LowStockAlert --> NotifyManager[Notify Manager]
    NotifyManager --> ReviewAlert[Manager Reviews]
    ReviewAlert --> CreateOrder{Create Order?}
    
    CreateOrder -->|Yes| GeneratePO[Generate Purchase Order]
    CreateOrder -->|No| AdjustMinimum[Adjust Minimum Level]
    
    GeneratePO --> SendToSupplier[Send to Supplier]
    SendToSupplier --> TrackDelivery[Track Delivery]
    TrackDelivery --> ReceiveGoods[Receive Goods]
    ReceiveGoods --> UpdateStock[Update Stock Levels]
    
    AdjustMinimum --> UpdateItem[Update Item Settings]
    UpdateStock --> End([End])
    UpdateItem --> End
    Normal --> End
```

## Security Architecture

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant NextJS
    participant NextAuth
    participant Database
    
    User->>Browser: Enter credentials
    Browser->>NextJS: POST /api/auth/signin
    NextJS->>NextAuth: Validate credentials
    NextAuth->>Database: Query user
    Database-->>NextAuth: User data
    NextAuth->>NextAuth: Verify password
    NextAuth-->>NextJS: JWT token
    NextJS-->>Browser: Set secure cookie
    Browser-->>User: Redirect to dashboard
    
    Note over Browser,NextJS: Subsequent requests include JWT
    Browser->>NextJS: API request with cookie
    NextJS->>NextAuth: Verify JWT
    NextAuth-->>NextJS: User session
    NextJS-->>Browser: Authorized response
```

### Authorization Matrix

```mermaid
graph TB
    subgraph "Roles"
        Admin[Admin]
        Manager[Manager]
        Employee[Employee]
    end
    
    subgraph "Permissions"
        UserMgmt[User Management]
        Settings[System Settings]
        Reports[All Reports]
        Approve[Approve Requests]
        ViewAll[View All Data]
        CreateReq[Create Requests]
        ViewOwn[View Own Data]
    end
    
    Admin --> UserMgmt
    Admin --> Settings
    Admin --> Reports
    Admin --> Approve
    Admin --> ViewAll
    Admin --> CreateReq
    Admin --> ViewOwn
    
    Manager --> Reports
    Manager --> Approve
    Manager --> ViewAll
    Manager --> CreateReq
    Manager --> ViewOwn
    
    Employee --> CreateReq
    Employee --> ViewOwn
```

## Deployment Architecture

### Production Deployment

```mermaid
graph TB
    subgraph "CDN Layer"
        CloudFlare[CloudFlare CDN]
    end
    
    subgraph "Application Layer"
        LB[Load Balancer]
        App1[Next.js Instance 1]
        App2[Next.js Instance 2]
        App3[Next.js Instance 3]
    end
    
    subgraph "Data Layer"
        PrimaryDB[(Primary Database)]
        ReadReplica[(Read Replica)]
        Redis[(Redis Cache)]
    end
    
    subgraph "External Services"
        EmailSvc[Email Service]
        FileSvc[File Storage]
        Monitor[Monitoring]
    end
    
    Users --> CloudFlare
    CloudFlare --> LB
    LB --> App1
    LB --> App2
    LB --> App3
    
    App1 --> PrimaryDB
    App1 --> ReadReplica
    App1 --> Redis
    App2 --> PrimaryDB
    App2 --> ReadReplica
    App2 --> Redis
    App3 --> PrimaryDB
    App3 --> ReadReplica
    App3 --> Redis
    
    App1 --> EmailSvc
    App1 --> FileSvc
    App1 --> Monitor
```

### CI/CD Pipeline

```mermaid
flowchart LR
    Dev[Developer] --> Commit[Git Commit]
    Commit --> GitHub[GitHub Repository]
    GitHub --> Trigger[Webhook Trigger]
    Trigger --> Build[Build Process]
    Build --> Test[Run Tests]
    Test --> Quality[Quality Checks]
    Quality --> Deploy[Deploy to Staging]
    Deploy --> E2E[E2E Tests]
    E2E --> Approve[Manual Approval]
    Approve --> Prod[Deploy to Production]
    Prod --> Monitor[Monitor & Alert]
    
    Test -->|Fail| Notify[Notify Developer]
    Quality -->|Fail| Notify
    E2E -->|Fail| Notify
    Notify --> Dev
```

---

*These diagrams provide a comprehensive visual representation of the system architecture, data relationships, user flows, security model, and deployment strategy for the Office Supplies Management System.*
