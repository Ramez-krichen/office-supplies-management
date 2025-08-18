-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastSignIn" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "contactPerson" TEXT,
    "contactTitle" TEXT,
    "website" TEXT,
    "taxId" TEXT,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEcoFriendly" BOOLEAN NOT NULL DEFAULT false,
    "ecoRating" INTEGER,
    "carbonFootprint" REAL,
    "recyclable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "items_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "requesterId" TEXT NOT NULL,
    "department" TEXT,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "attachments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "request_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "notes" TEXT,
    CONSTRAINT "request_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "request_items_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "approvals_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "reference" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_movements_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" DATETIME,
    "receivedDate" DATETIME,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "purchase_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseOrderId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "order_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,
    CONSTRAINT "audit_logs_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "returns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "returnNumber" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "description" TEXT,
    "requesterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "returnDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedDate" DATETIME,
    "processedBy" TEXT,
    "refundAmount" REAL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "returns_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "returns_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "returns_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "demand_forecasts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "predictedDemand" INTEGER NOT NULL,
    "actualDemand" INTEGER DEFAULT 0,
    "confidence" REAL NOT NULL,
    "algorithm" TEXT NOT NULL,
    "factors" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "demand_forecasts_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "items_reference_key" ON "items"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "request_items_requestId_itemId_key" ON "request_items"("requestId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "approvals_requestId_approverId_level_key" ON "approvals"("requestId", "approverId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_orderNumber_key" ON "purchase_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_purchaseOrderId_itemId_key" ON "order_items"("purchaseOrderId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "returns_returnNumber_key" ON "returns"("returnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "demand_forecasts_itemId_period_periodType_key" ON "demand_forecasts"("itemId", "period", "periodType");
