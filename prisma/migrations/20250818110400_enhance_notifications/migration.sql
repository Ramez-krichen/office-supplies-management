-- Enhanced Notification System Migration

-- Create notification preferences table
CREATE TABLE "notification_preferences" (
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
    FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Create notification delivery table to track email/in-app delivery
CREATE TABLE "notification_deliveries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notificationId" TEXT NOT NULL,
    "deliveryType" TEXT NOT NULL, -- EMAIL, IN_APP, PUSH
    "status" TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, SENT, DELIVERED, FAILED
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" DATETIME,
    "deliveredAt" DATETIME,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("notificationId") REFERENCES "notifications" ("id") ON DELETE CASCADE
);

-- Add new columns to existing notifications table
ALTER TABLE "notifications" ADD COLUMN "category" TEXT DEFAULT 'GENERAL';
ALTER TABLE "notifications" ADD COLUMN "actionUrl" TEXT;
ALTER TABLE "notifications" ADD COLUMN "actionLabel" TEXT;
ALTER TABLE "notifications" ADD COLUMN "expiresAt" DATETIME;
ALTER TABLE "notifications" ADD COLUMN "metadata" TEXT; -- JSON field for additional data

-- Create indexes for better performance
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");
CREATE INDEX "notification_deliveries_notificationId_idx" ON "notification_deliveries"("notificationId");
CREATE INDEX "notification_deliveries_status_idx" ON "notification_deliveries"("status");
CREATE INDEX "notification_deliveries_deliveryType_idx" ON "notification_deliveries"("deliveryType");
CREATE INDEX "notifications_category_idx" ON "notifications"("category");
CREATE INDEX "notifications_expiresAt_idx" ON "notifications"("expiresAt");

-- Create unique constraint for user preferences
CREATE UNIQUE INDEX "notification_preferences_userId_unique" ON "notification_preferences"("userId");