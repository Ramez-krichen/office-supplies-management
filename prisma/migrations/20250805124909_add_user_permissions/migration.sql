-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "departmentId" TEXT,
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "permissions" TEXT NOT NULL DEFAULT '',
    "lastSignIn" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("createdAt", "department", "departmentId", "email", "id", "lastSignIn", "name", "password", "role", "status", "updatedAt") SELECT "createdAt", "department", "departmentId", "email", "id", "lastSignIn", "name", "password", "role", "status", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_departmentId_idx" ON "users"("departmentId");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_status_idx" ON "users"("status");
CREATE INDEX "users_email_idx" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "approvals_status_idx" ON "approvals"("status");

-- CreateIndex
CREATE INDEX "approvals_approverId_idx" ON "approvals"("approverId");

-- CreateIndex
CREATE INDEX "departments_status_idx" ON "departments"("status");

-- CreateIndex
CREATE INDEX "purchase_orders_createdById_idx" ON "purchase_orders"("createdById");

-- CreateIndex
CREATE INDEX "requests_department_idx" ON "requests"("department");
