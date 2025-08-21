-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_notification_deliveries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notificationId" TEXT NOT NULL,
    "deliveryType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" DATETIME,
    "deliveredAt" DATETIME,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "notification_deliveries_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_notification_deliveries" ("attemptCount", "createdAt", "deliveredAt", "deliveryType", "errorMessage", "id", "lastAttemptAt", "notificationId", "status", "updatedAt") SELECT "attemptCount", "createdAt", "deliveredAt", "deliveryType", "errorMessage", "id", "lastAttemptAt", "notificationId", "status", "updatedAt" FROM "notification_deliveries";
DROP TABLE "notification_deliveries";
ALTER TABLE "new_notification_deliveries" RENAME TO "notification_deliveries";
CREATE INDEX "notification_deliveries_notificationId_idx" ON "notification_deliveries"("notificationId");
CREATE INDEX "notification_deliveries_status_idx" ON "notification_deliveries"("status");
CREATE INDEX "notification_deliveries_deliveryType_idx" ON "notification_deliveries"("deliveryType");
CREATE TABLE "new_notification_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "requestStatusChanges" BOOLEAN NOT NULL DEFAULT true,
    "managerAssignments" BOOLEAN NOT NULL DEFAULT true,
    "systemAlerts" BOOLEAN NOT NULL DEFAULT true,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_notification_preferences" ("createdAt", "emailEnabled", "id", "inAppEnabled", "managerAssignments", "requestStatusChanges", "systemAlerts", "updatedAt", "userId", "weeklyDigest") SELECT "createdAt", "emailEnabled", "id", "inAppEnabled", "managerAssignments", "requestStatusChanges", "systemAlerts", "updatedAt", "userId", "weeklyDigest" FROM "notification_preferences";
DROP TABLE "notification_preferences";
ALTER TABLE "new_notification_preferences" RENAME TO "notification_preferences";
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");
CREATE TABLE "new_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNREAD',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "targetRole" TEXT,
    "targetUserId" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "expiresAt" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "readAt" DATETIME,
    "dismissedAt" DATETIME
);
INSERT INTO "new_notifications" ("actionLabel", "actionUrl", "category", "createdAt", "data", "dismissedAt", "expiresAt", "id", "message", "metadata", "priority", "readAt", "status", "targetRole", "targetUserId", "title", "type", "updatedAt") SELECT "actionLabel", "actionUrl", coalesce("category", 'GENERAL') AS "category", "createdAt", "data", "dismissedAt", "expiresAt", "id", "message", "metadata", "priority", "readAt", "status", "targetRole", "targetUserId", "title", "type", "updatedAt" FROM "notifications";
DROP TABLE "notifications";
ALTER TABLE "new_notifications" RENAME TO "notifications";
CREATE INDEX "notifications_status_idx" ON "notifications"("status");
CREATE INDEX "notifications_targetRole_idx" ON "notifications"("targetRole");
CREATE INDEX "notifications_targetUserId_idx" ON "notifications"("targetUserId");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");
CREATE INDEX "notifications_category_idx" ON "notifications"("category");
CREATE INDEX "notifications_expiresAt_idx" ON "notifications"("expiresAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
