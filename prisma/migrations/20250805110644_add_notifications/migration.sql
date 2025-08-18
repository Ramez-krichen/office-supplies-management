-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNREAD',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "targetRole" TEXT,
    "targetUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "readAt" DATETIME,
    "dismissedAt" DATETIME
);

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_targetRole_idx" ON "notifications"("targetRole");

-- CreateIndex
CREATE INDEX "notifications_targetUserId_idx" ON "notifications"("targetUserId");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");
