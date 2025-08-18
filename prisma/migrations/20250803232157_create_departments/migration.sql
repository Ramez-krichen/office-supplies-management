-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "managerId" TEXT,
    "budget" REAL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "departments_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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
    "lastSignIn" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("createdAt", "department", "email", "id", "lastSignIn", "name", "password", "role", "status", "updatedAt") SELECT "createdAt", "department", "email", "id", "lastSignIn", "name", "password", "role", "status", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_departmentId_idx" ON "users"("departmentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_code_idx" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_parentId_idx" ON "departments"("parentId");

-- CreateIndex
CREATE INDEX "departments_managerId_idx" ON "departments"("managerId");

-- CreateIndex
CREATE INDEX "items_categoryId_idx" ON "items"("categoryId");

-- CreateIndex
CREATE INDEX "items_supplierId_idx" ON "items"("supplierId");

-- CreateIndex
CREATE INDEX "items_currentStock_idx" ON "items"("currentStock");

-- CreateIndex
CREATE INDEX "items_isActive_idx" ON "items"("isActive");

-- CreateIndex
CREATE INDEX "items_name_idx" ON "items"("name");

-- CreateIndex
CREATE INDEX "items_createdAt_idx" ON "items"("createdAt");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "purchase_orders_supplierId_idx" ON "purchase_orders"("supplierId");

-- CreateIndex
CREATE INDEX "purchase_orders_orderDate_idx" ON "purchase_orders"("orderDate");

-- CreateIndex
CREATE INDEX "purchase_orders_createdAt_idx" ON "purchase_orders"("createdAt");

-- CreateIndex
CREATE INDEX "requests_status_idx" ON "requests"("status");

-- CreateIndex
CREATE INDEX "requests_requesterId_idx" ON "requests"("requesterId");

-- CreateIndex
CREATE INDEX "requests_createdAt_idx" ON "requests"("createdAt");

-- CreateIndex
CREATE INDEX "requests_priority_idx" ON "requests"("priority");

-- CreateIndex
CREATE INDEX "stock_movements_itemId_idx" ON "stock_movements"("itemId");

-- CreateIndex
CREATE INDEX "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_type_idx" ON "stock_movements"("type");
