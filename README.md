# Office Supplies Management System

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.13.0-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

A production-ready, enterprise-grade web application for comprehensive office supplies management. Built with modern technologies to streamline procurement processes, enhance operational efficiency, and provide real-time insights into organizational spending patterns.

## ✨ Key Features

### 🏢 Enterprise Management
- **Multi-Department Support**: Comprehensive department-based organization and reporting
- **Advanced User Management**: Role-based access control (Admin, Manager, Employee) with granular permissions
- **Audit Trail & Compliance**: Complete activity logging with 1000+ audit records for regulatory compliance
- **Demand Forecasting**: AI-powered demand prediction with 720+ forecast data points

### 📦 Inventory & Procurement
- **Real-time Inventory Tracking**: Live stock monitoring with automated low-stock alerts and 2000+ stock movements
- **Advanced Purchase Order Management**: Complete order lifecycle from creation to delivery with supplier integration
- **Supplier Relationship Management**: Comprehensive supplier database with performance tracking and contact management
- **Returns Management**: Streamlined return processing with reason tracking and inventory adjustments

### 🔄 Workflow Automation
- **Multi-level Approval Workflows**: Configurable approval chains with automated notifications
- **Request Management**: Employee request creation with approval tracking (760+ historical requests)
- **Automated Stock Updates**: Real-time inventory adjustments based on orders and returns
- **Smart Notifications**: Role-based notification system for critical actions

### 📊 Analytics & Reporting
- **Advanced Dashboard**: Real-time KPIs and performance metrics with role-specific views
- **Quick Reports**: Instant report generation for spending, inventory, and performance analysis
- **Historical Data Analysis**: 10 years of comprehensive test data for trend analysis
- **Department-wise Insights**: Detailed spending and consumption patterns by department

### 🔒 Security & Performance
- **Enterprise Security**: JWT authentication, bcrypt password hashing, and SQL injection protection
- **WCAG 2.1 AA Compliance**: Full accessibility support with keyboard navigation and screen reader compatibility
- **Mobile-First Design**: Responsive UI optimized for all devices with touch-friendly navigation
- **Performance Optimized**: Database indexing, query optimization, and bundle optimization

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15.3.3 with App Router
- **UI Library**: React 19.0.0 with TypeScript 5.0+
- **Styling**: Tailwind CSS 3.4+ with custom components
- **UI Components**: Radix UI, Headless UI, Lucide React icons
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Context API with optimized re-renders

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **Database**: SQLite (development) / PostgreSQL (production-ready)
- **ORM**: Prisma 6.13.0 with advanced query optimization
- **Authentication**: NextAuth.js 4.24+ with JWT and session management
- **Validation**: Zod schemas for type-safe API validation

### Development & Deployment
- **Language**: TypeScript with strict type checking
- **Linting**: ESLint with Next.js configuration
- **Testing**: Comprehensive test suite with 100+ test scenarios
- **Performance**: Bundle optimization, code splitting, and caching strategies

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0 or higher ([Download](https://nodejs.org/))
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Git**: For version control ([Download](https://git-scm.com/))
- **Database**: SQLite (included) or PostgreSQL for production

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd office-supplies-management
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your configuration (optional for development)
# The application works out-of-the-box with default SQLite settings
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Initialize database schema
npx prisma db push

# Seed with comprehensive test data (10 years of data)
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

🎉 **Application is now running!** Open [http://localhost:3000](http://localhost:3000) to access the system.

## 🔐 Demo Accounts

The system comes pre-loaded with demo accounts for immediate testing:

| Role | Email | Password | Department | Access Level |
|------|-------|----------|------------|--------------|
| **Admin** | admin@example.com | admin123 | IT | Full system access, user management |
| **Manager** | manager@example.com | manager123 | Operations | Department oversight, approvals |
| **Employee** | employee@example.com | employee123 | Sales | Request creation, personal dashboard |

### Additional Test Data

The seeded database includes:
- **61 Users** across different roles and departments
- **38 Items** with realistic pricing and stock levels
- **10 Suppliers** with complete contact information
- **760 Requests** spanning 10 years for workflow testing
- **455 Purchase Orders** with supplier relationships
- **2000+ Stock Movements** for inventory tracking
- **500+ Returns** with various processing scenarios
- **720 Demand Forecasts** for planning analysis
- **1000+ Audit Logs** for compliance demonstration

## 📁 Project Structure

```text
office-supplies-management/
├── 📁 docs/                           # Comprehensive Documentation
│   ├── CONCEPTION.md                  # System architecture & design
│   ├── ARCHITECTURE_DIAGRAMS.md       # Visual system architecture
│   ├── TECHNICAL_SPECIFICATIONS.md    # Detailed technical requirements
│   ├── PROJECT_PLAN.md               # Development roadmap
│   ├── USER_MANUAL.md                # Complete user guide
│   ├── ACCESS_CONTROL_GUIDE.md       # Security & permissions guide
│   └── uml/                          # Professional UML diagrams
│       ├── sequence-diagram-request-approval.drawio
│       ├── class-diagram-domain-model.drawio
│       └── use-case-diagram-system-overview.drawio
├── 📁 prisma/                         # Database Management
│   ├── schema.prisma                  # Database schema definition
│   ├── migrations/                    # Database migration history
│   └── comprehensive-seed.ts          # Advanced data seeding
├── 📁 scripts/                        # Automation & Utilities
│   ├── seed.ts                       # Primary database seeding
│   ├── generate-historical-data.ts   # Historical data generation
│   ├── check-database-status.ts      # Database health checks
│   └── requirements.txt              # Python dependencies for analytics
├── 📁 src/                           # Application Source Code
│   ├── 📁 app/                       # Next.js App Router
│   │   ├── 📁 api/                   # RESTful API Endpoints
│   │   │   ├── auth/                 # Authentication APIs
│   │   │   ├── dashboard/            # Dashboard data APIs
│   │   │   ├── requests/             # Request management APIs
│   │   │   ├── purchase-orders/      # Purchase order APIs
│   │   │   ├── suppliers/            # Supplier management APIs
│   │   │   ├── items/                # Inventory APIs
│   │   │   ├── users/                # User management APIs
│   │   │   ├── reports/              # Analytics & reporting APIs
│   │   │   ├── audit-logs/           # Audit trail APIs
│   │   │   ├── returns/              # Returns management APIs
│   │   │   └── demand-forecast/      # Demand forecasting APIs
│   │   ├── 📁 dashboard/             # Role-based Dashboards
│   │   │   ├── admin/                # Admin dashboard
│   │   │   ├── manager/              # Manager dashboard
│   │   │   ├── employee/             # Employee dashboard
│   │   │   └── department/           # Department-specific views
│   │   ├── 📁 admin/                 # Administrative Interface
│   │   ├── auth/signin/              # Authentication pages
│   │   ├── requests/                 # Request management UI
│   │   ├── inventory/                # Inventory management UI
│   │   ├── suppliers/                # Supplier management UI
│   │   ├── orders/                   # Purchase order UI
│   │   ├── reports/                  # Analytics & reporting UI
│   │   ├── users/                    # User management UI
│   │   ├── audit-logs/               # Audit trail interface
│   │   ├── returns/                  # Returns management UI
│   │   ├── demand-forecast/          # Demand forecasting UI
│   │   └── quick-reports/            # Quick reporting tools
│   ├── 📁 components/                # Reusable React Components
│   │   ├── layout/                   # Layout & navigation components
│   │   ├── providers/                # Context providers & state management
│   │   ├── ui/                       # Base UI components
│   │   └── forms/                    # Form components with validation
│   ├── 📁 lib/                       # Core Utilities & Configuration
│   │   ├── auth.ts                   # NextAuth.js configuration
│   │   ├── db.ts                     # Prisma database client
│   │   ├── utils.ts                  # Helper functions
│   │   └── validations.ts            # Zod validation schemas
│   ├── 📁 types/                     # TypeScript Type Definitions
│   ├── 📁 hooks/                     # Custom React hooks
│   └── 📁 data/                      # Static data & constants
├── 📁 public/                         # Static Assets
└── 📄 Configuration Files
    ├── package.json                   # Dependencies & scripts
    ├── tsconfig.json                  # TypeScript configuration
    ├── tailwind.config.mjs            # Tailwind CSS configuration
    ├── next.config.ts                 # Next.js configuration
    └── eslint.config.mjs              # ESLint configuration
```

## 🗄️ Database Schema

The application features a robust, production-ready database schema with comprehensive relationships:

### Core Entities

- **👥 Users**: Multi-role authentication (Admin/Manager/Employee) with department assignments
- **🏢 Departments**: Organizational structure with manager assignments and spending tracking
- **🏪 Suppliers**: Complete supplier management with contact information and performance metrics
- **📦 Categories**: Hierarchical item categorization for organized inventory management
- **📋 Items**: Comprehensive product catalog with stock tracking, pricing, and eco-friendly attributes
- **📝 Requests**: Advanced request workflow with multi-level approval chains and priority handling
- **🛒 Purchase Orders**: Complete order lifecycle management with supplier integration
- **✅ Approvals**: Sophisticated approval system with role-based authorization
- **📊 Stock Movements**: Detailed inventory transaction history for audit trails
- **🔄 Returns**: Return processing with reason tracking and inventory adjustments
- **📈 Demand Forecasts**: AI-powered demand prediction for inventory planning
- **📋 Audit Logs**: Comprehensive activity logging for compliance and security

### Advanced Features

- **Relationship Integrity**: Foreign key constraints ensuring data consistency
- **Performance Optimization**: Strategic indexing on frequently queried fields
- **Audit Trail**: Complete activity tracking with user attribution and timestamps
- **Soft Deletes**: Data preservation with status-based deactivation
- **Extensible Design**: Schema designed for future feature additions

## 🔧 Available Scripts

### Development Commands

```bash
# Application Management
npm run dev              # Start development server with hot reload
npm run build            # Build optimized production bundle
npm run start            # Start production server
npm run lint             # Run ESLint with Next.js configuration

# Database Management
npm run db:seed          # Seed with comprehensive test data (10 years)
npm run db:fixed-seed    # Seed with fixed, consistent test data
npm run db:reset         # Reset database and reseed with fresh data
npm run db:fixed-reset   # Reset with fixed seed data
npm run db:cleanup-admins # Clean up duplicate admin users

# Database Tools
npx prisma studio        # Open Prisma Studio (database GUI)
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema changes to database
npx prisma migrate dev   # Create and apply new migration
```

### Utility Scripts

```bash
# Data Generation & Analysis
tsx scripts/generate-historical-data.ts    # Generate historical data
tsx scripts/check-database-status.ts       # Verify database health
tsx scripts/comprehensive-test.ts          # Run comprehensive tests
tsx scripts/analyze-departments.ts         # Analyze department data
```

## 🚀 Production Deployment

### Environment Configuration

```bash
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/office_supplies"

# Authentication & Security
NEXTAUTH_SECRET="your-super-secure-secret-key-here"
NEXTAUTH_URL="https://your-domain.com"

# Application Settings
APP_NAME="Office Supplies Management"
APP_VERSION="0.1.0"
NODE_ENV="production"
```

### Deployment Options

#### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Configure environment variables in Vercel dashboard
# Set up PostgreSQL database (Vercel Postgres or external)
```

#### Option 2: Docker Deployment

```bash
# Build Docker image
docker build -t office-supplies-management .

# Run with environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e NEXTAUTH_SECRET="your-secret" \
  office-supplies-management
```

#### Option 3: Traditional Hosting

```bash
# Build the application
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start npm --name "office-supplies" -- start
```

### Database Migration for Production

```bash
# For PostgreSQL production database
npx prisma migrate deploy

# Generate Prisma client for production
npx prisma generate

# Optional: Seed production data
npm run db:seed
```

## 📚 Comprehensive Documentation

Extensive documentation is available in the `docs/` directory, providing complete system insights:

### Core Documentation

- **[📋 Conception Document](docs/CONCEPTION.md)**: System overview, architecture, and design principles
- **[🏗️ Architecture Diagrams](docs/ARCHITECTURE_DIAGRAMS.md)**: Visual system architecture with Mermaid diagrams
- **[⚙️ Technical Specifications](docs/TECHNICAL_SPECIFICATIONS.md)**: Detailed technical requirements and implementation
- **[📅 Project Plan](docs/PROJECT_PLAN.md)**: Development roadmap, milestones, and sprint planning
- **[📖 User Manual](docs/USER_MANUAL.md)**: Complete user guide with step-by-step instructions
- **[🔐 Access Control Guide](docs/ACCESS_CONTROL_GUIDE.md)**: Security and permissions documentation

### Professional UML Diagrams

Industry-standard UML diagrams created with draw.io are available in the `docs/uml/` directory:

- **[🔄 Sequence Diagram](docs/uml/sequence-diagram-request-approval.drawio)**: Request approval workflow interactions
- **[📊 Class Diagram](docs/uml/class-diagram-domain-model.drawio)**: Domain model with entities and relationships
- **[👥 Use Case Diagram](docs/uml/use-case-diagram-system-overview.drawio)**: System functionality by user roles
- **[📚 UML Documentation](docs/uml/UML_DIAGRAMS_DOCUMENTATION.md)**: Comprehensive diagram explanations

### Additional Resources

- **[✅ Production Readiness](PRODUCTION_READINESS.md)**: Deployment checklist and production guidelines
- **[🧪 Comprehensive Test Report](COMPREHENSIVE_TEST_REPORT.md)**: Detailed testing results and validation
- **[🔑 Access Control Documentation](ACCESS_CONTROL_DOCUMENTATION.md)**: Security implementation details

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository** and create your feature branch
2. **Follow coding standards**: TypeScript, ESLint configuration, and existing patterns
3. **Write tests** for new functionality
4. **Update documentation** for any new features or changes
5. **Submit a pull request** with a clear description of changes

```bash
# Development workflow
git checkout -b feature/your-feature-name
npm run lint                    # Ensure code quality
npm run build                   # Verify build success
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Help

### Documentation Resources

- 📖 **[User Manual](docs/USER_MANUAL.md)** - Complete usage guide
- ⚙️ **[Technical Specifications](docs/TECHNICAL_SPECIFICATIONS.md)** - Implementation details
- 🔐 **[Access Control Guide](docs/ACCESS_CONTROL_GUIDE.md)** - Security and permissions

### Getting Help

- 🐛 **Bug Reports**: Open an issue on GitHub with detailed reproduction steps
- 💡 **Feature Requests**: Submit enhancement proposals through GitHub issues
- 📧 **Direct Support**: Contact the development team for urgent matters
- 💬 **Community**: Join discussions in GitHub Discussions

## 🎯 Development Roadmap

### ✅ Phase 1: Core System (Completed)

- [x] **Authentication & Authorization**: Multi-role system with JWT
- [x] **Request Management**: Complete workflow with multi-level approvals
- [x] **Inventory Management**: Real-time stock tracking with automated alerts
- [x] **Supplier Management**: Comprehensive supplier database with performance tracking
- [x] **Purchase Order Management**: Complete order lifecycle management
- [x] **User Management**: Role-based access control with department assignments
- [x] **Audit Trail**: Comprehensive activity logging for compliance
- [x] **Returns Management**: Return processing with inventory adjustments
- [x] **Demand Forecasting**: AI-powered demand prediction capabilities

### ✅ Phase 2: Advanced Features (Completed)

- [x] **Performance Optimization**: Database indexing and query optimization
- [x] **Mobile Responsiveness**: Touch-friendly interface for all devices
- [x] **Accessibility Compliance**: WCAG 2.1 AA standards implementation
- [x] **Advanced Reporting**: Quick reports and analytics dashboard
- [x] **Department Management**: Multi-department support with spending tracking
- [x] **Security Hardening**: Enhanced security measures and validation

### 🚀 Phase 3: Future Enhancements

- [ ] **Advanced Analytics**: Interactive charts and graphs with drill-down capabilities
- [ ] **Email Notifications**: Automated alerts for approvals, low stock, and deadlines
- [ ] **File Management**: Document upload and attachment system
- [ ] **Mobile Application**: Native iOS and Android applications
- [ ] **ERP Integration**: API connectors for popular ERP systems
- [ ] **Workflow Automation**: Advanced approval workflows with conditional logic
- [ ] **AI-Powered Insights**: Machine learning for spending optimization
- [ ] **Multi-language Support**: Internationalization for global deployment

---

## 🏆 Project Status

**Current Version**: 0.1.0
**Status**: Production Ready
**Last Updated**: August 2025
**Test Coverage**: Comprehensive (100+ test scenarios)
**Performance**: Optimized for enterprise use
**Security**: Enterprise-grade with audit compliance

---



*Developed during Summer 2025 Internship Program*
