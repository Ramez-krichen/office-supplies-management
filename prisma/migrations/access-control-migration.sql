-- Migration script for enhanced access control system
-- This script updates the database schema to support the new role-based access control

-- Create backup of existing data (optional, for safety)
-- CREATE TABLE users_backup AS SELECT * FROM users;
-- CREATE TABLE departments_backup AS SELECT * FROM departments;

-- Update User table to use proper constraints and indexes
-- Note: SQLite doesn't support ALTER COLUMN directly, so we'll add constraints via triggers

-- Add indexes for better performance on access control queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(departmentId);

-- Add indexes for departments
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON departments(managerId);

-- Add indexes for requests (for department filtering)
CREATE INDEX IF NOT EXISTS idx_requests_department ON requests(department);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_priority ON requests(priority);
CREATE INDEX IF NOT EXISTS idx_requests_requester_id ON requests(requesterId);

-- Add indexes for approvals
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_approver_id ON approvals(approverId);

-- Add indexes for purchase orders
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by ON purchase_orders(createdById);

-- Create triggers to enforce role constraints (SQLite approach)
CREATE TRIGGER IF NOT EXISTS validate_user_role
BEFORE INSERT ON users
WHEN NEW.role NOT IN ('ADMIN', 'MANAGER', 'EMPLOYEE')
BEGIN
    SELECT RAISE(ABORT, 'Invalid user role. Must be ADMIN, MANAGER, or EMPLOYEE');
END;

CREATE TRIGGER IF NOT EXISTS validate_user_role_update
BEFORE UPDATE ON users
WHEN NEW.role NOT IN ('ADMIN', 'MANAGER', 'EMPLOYEE')
BEGIN
    SELECT RAISE(ABORT, 'Invalid user role. Must be ADMIN, MANAGER, or EMPLOYEE');
END;

-- Create trigger to enforce user status constraints
CREATE TRIGGER IF NOT EXISTS validate_user_status
BEFORE INSERT ON users
WHEN NEW.status NOT IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')
BEGIN
    SELECT RAISE(ABORT, 'Invalid user status. Must be ACTIVE, INACTIVE, or SUSPENDED');
END;

CREATE TRIGGER IF NOT EXISTS validate_user_status_update
BEFORE UPDATE ON users
WHEN NEW.status NOT IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')
BEGIN
    SELECT RAISE(ABORT, 'Invalid user status. Must be ACTIVE, INACTIVE, or SUSPENDED');
END;

-- Create trigger to enforce department status constraints
CREATE TRIGGER IF NOT EXISTS validate_department_status
BEFORE INSERT ON departments
WHEN NEW.status NOT IN ('ACTIVE', 'INACTIVE')
BEGIN
    SELECT RAISE(ABORT, 'Invalid department status. Must be ACTIVE or INACTIVE');
END;

CREATE TRIGGER IF NOT EXISTS validate_department_status_update
BEFORE UPDATE ON departments
WHEN NEW.status NOT IN ('ACTIVE', 'INACTIVE')
BEGIN
    SELECT RAISE(ABORT, 'Invalid department status. Must be ACTIVE or INACTIVE');
END;

-- Create trigger to enforce request status constraints
CREATE TRIGGER IF NOT EXISTS validate_request_status
BEFORE INSERT ON requests
WHEN NEW.status NOT IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED')
BEGIN
    SELECT RAISE(ABORT, 'Invalid request status');
END;

CREATE TRIGGER IF NOT EXISTS validate_request_status_update
BEFORE UPDATE ON requests
WHEN NEW.status NOT IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED')
BEGIN
    SELECT RAISE(ABORT, 'Invalid request status');
END;

-- Create trigger to enforce request priority constraints
CREATE TRIGGER IF NOT EXISTS validate_request_priority
BEFORE INSERT ON requests
WHEN NEW.priority NOT IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')
BEGIN
    SELECT RAISE(ABORT, 'Invalid request priority');
END;

CREATE TRIGGER IF NOT EXISTS validate_request_priority_update
BEFORE UPDATE ON requests
WHEN NEW.priority NOT IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')
BEGIN
    SELECT RAISE(ABORT, 'Invalid request priority');
END;

-- Create trigger to enforce approval status constraints
CREATE TRIGGER IF NOT EXISTS validate_approval_status
BEFORE INSERT ON approvals
WHEN NEW.status NOT IN ('PENDING', 'APPROVED', 'REJECTED')
BEGIN
    SELECT RAISE(ABORT, 'Invalid approval status');
END;

CREATE TRIGGER IF NOT EXISTS validate_approval_status_update
BEFORE UPDATE ON approvals
WHEN NEW.status NOT IN ('PENDING', 'APPROVED', 'REJECTED')
BEGIN
    SELECT RAISE(ABORT, 'Invalid approval status');
END;

-- Create trigger to enforce purchase order status constraints
CREATE TRIGGER IF NOT EXISTS validate_purchase_order_status
BEFORE INSERT ON purchase_orders
WHEN NEW.status NOT IN ('DRAFT', 'PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED')
BEGIN
    SELECT RAISE(ABORT, 'Invalid purchase order status');
END;

CREATE TRIGGER IF NOT EXISTS validate_purchase_order_status_update
BEFORE UPDATE ON purchase_orders
WHEN NEW.status NOT IN ('DRAFT', 'PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED')
BEGIN
    SELECT RAISE(ABORT, 'Invalid purchase order status');
END;

-- Create trigger to ensure only one admin exists
CREATE TRIGGER IF NOT EXISTS enforce_single_admin
BEFORE INSERT ON users
WHEN NEW.role = 'ADMIN' AND (SELECT COUNT(*) FROM users WHERE role = 'ADMIN') >= 1
BEGIN
    SELECT RAISE(ABORT, 'Only one admin account is allowed in the system');
END;

-- Create trigger to prevent changing admin role
CREATE TRIGGER IF NOT EXISTS prevent_admin_role_change
BEFORE UPDATE ON users
WHEN OLD.role = 'ADMIN' AND NEW.role != 'ADMIN'
BEGIN
    SELECT RAISE(ABORT, 'Cannot change the role of the admin account');
END;

-- Create trigger to ensure managers have departments
CREATE TRIGGER IF NOT EXISTS enforce_manager_department
BEFORE INSERT ON users
WHEN NEW.role = 'MANAGER' AND (NEW.department IS NULL OR NEW.department = '')
BEGIN
    SELECT RAISE(ABORT, 'Managers must be assigned to a department');
END;

CREATE TRIGGER IF NOT EXISTS enforce_manager_department_update
BEFORE UPDATE ON users
WHEN NEW.role = 'MANAGER' AND (NEW.department IS NULL OR NEW.department = '')
BEGIN
    SELECT RAISE(ABORT, 'Managers must be assigned to a department');
END;

-- Update existing data to ensure consistency (if needed)
-- This section would contain any data migration logic

-- Example: Ensure all existing users have valid roles
UPDATE users SET role = 'EMPLOYEE' WHERE role NOT IN ('ADMIN', 'MANAGER', 'EMPLOYEE');

-- Example: Ensure all existing users have valid status
UPDATE users SET status = 'ACTIVE' WHERE status NOT IN ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- Example: Ensure all existing departments have valid status
UPDATE departments SET status = 'ACTIVE' WHERE status NOT IN ('ACTIVE', 'INACTIVE');

-- Example: Ensure all existing requests have valid status
UPDATE requests SET status = 'PENDING' WHERE status NOT IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- Example: Ensure all existing requests have valid priority
UPDATE requests SET priority = 'MEDIUM' WHERE priority NOT IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- Create audit log entry for migration
INSERT INTO audit_logs (action, entity, entityId, performedBy, timestamp, details)
VALUES (
    'SYSTEM_MIGRATION',
    'ACCESS_CONTROL',
    'SYSTEM',
    'SYSTEM',
    datetime('now'),
    'Enhanced access control system migration completed'
);

-- Verify migration success
-- These queries should return 0 if migration was successful
SELECT 'Invalid user roles found: ' || COUNT(*) FROM users WHERE role NOT IN ('ADMIN', 'MANAGER', 'EMPLOYEE');
SELECT 'Invalid user status found: ' || COUNT(*) FROM users WHERE status NOT IN ('ACTIVE', 'INACTIVE', 'SUSPENDED');
SELECT 'Invalid department status found: ' || COUNT(*) FROM departments WHERE status NOT IN ('ACTIVE', 'INACTIVE');
SELECT 'Multiple admin accounts found: ' || COUNT(*) FROM users WHERE role = 'ADMIN' AND (SELECT COUNT(*) FROM users WHERE role = 'ADMIN') > 1;

-- Migration completed successfully
SELECT 'Access control migration completed at: ' || datetime('now');
