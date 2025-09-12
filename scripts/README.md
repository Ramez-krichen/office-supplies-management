# Office Supplies Management Scripts

This directory contains utility scripts for the Office Supplies Management system.

## Available Scripts

### Generate User Activities

**File:** `generate-user-activities.js`

This script generates realistic user activities for all user roles in the system:

- **ADMIN**: Creates suppliers, purchase orders, updates inventory items, creates departments, and reviews audit logs
- **MANAGER**: Approves/rejects requests, creates requests, generates reports, and reviews inventory levels
- **EMPLOYEE**: Creates requests, checks request status, browses inventory, submits returns, and views department info
- **GENERAL_MANAGER**: Reviews high-priority requests, audit logs, department budgets, inventory reports, and purchase orders

#### How to Run

**Direct execution:**
```bash
node scripts/generate-user-activities.js
```

**Using the runner script (recommended):**
```bash
node scripts/run-activity-generator.js [options]
```

**Using the convenience scripts:**
```bash
# Windows
scripts\generate-activities.bat [options]

# Unix/Linux/macOS
chmod +x scripts/generate-activities.sh  # Make executable (first time only)
./scripts/generate-activities.sh [options]
```

**Available options:**
- `--role, -r`: Filter by user role (ADMIN, MANAGER, EMPLOYEE, GENERAL_MANAGER)
- `--count, -c`: Number of activities to generate per user
- `--verbose, -v`: Enable verbose output
- `--help, -h`: Show help message

**Examples:**
```bash
# Generate activities for all users
node scripts/run-activity-generator.js

# Generate activities only for admin users
node scripts/run-activity-generator.js --role ADMIN

# Generate 3 activities per user with detailed output
node scripts/run-activity-generator.js --count 3 --verbose
```

#### Requirements

- The database must be properly set up and populated with users of different roles
- Users must have the 'ACTIVE' status to be included
- The Prisma client must be properly configured

#### Output

The script will:

1. Generate appropriate activities for each user based on their role
2. Create actual database records for these activities
3. Log all activities to the audit log
4. Output progress information to the console

#### Customization

You can modify the script to:

- Change the number of activities generated per user
- Adjust the types of activities for each role
- Change the probability of request approval/rejection
- Add new types of activities