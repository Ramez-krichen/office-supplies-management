import { db as prisma } from '@/lib/db'
import nodemailer from 'nodemailer'
import { Notification, User } from '@prisma/client'

export interface NotificationData {
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  targetRole?: string
  targetUserId?: string
  category?: string
  actionUrl?: string
  actionLabel?: string
  expiresAt?: Date
  metadata?: Record<string, unknown>
}

export interface NotificationPreferences {
  emailEnabled: boolean
  inAppEnabled: boolean
  requestStatusChanges: boolean
  managerAssignments: boolean
  systemAlerts: boolean
  weeklyDigest: boolean
}

export class NotificationService {
  private static instance: NotificationService
  private emailTransporter: nodemailer.Transporter | null = null

  private constructor() {
    this.initializeEmailTransporter()
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private initializeEmailTransporter() {
    try {
      // Configure email transporter (you'll need to set these environment variables)
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    } catch (error) {
      console.error('Failed to initialize email transporter:', error)
    }
  }

  /**
   * Create a new notification
   */
  async createNotification(notificationData: NotificationData): Promise<string> {
    try {
      const notification = await prisma.notification.create({
        data: {
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data ? JSON.stringify(notificationData.data) : null,
          priority: notificationData.priority || 'MEDIUM',
          targetRole: notificationData.targetRole,
          targetUserId: notificationData.targetUserId,
          category: notificationData.category || 'GENERAL',
          actionUrl: notificationData.actionUrl,
          actionLabel: notificationData.actionLabel,
          expiresAt: notificationData.expiresAt,
          metadata: notificationData.metadata ? JSON.stringify(notificationData.metadata) : null,
        },
      })

      // Schedule delivery based on user preferences
      await this.scheduleNotificationDelivery(notification.id)

      return notification.id
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  /**
   * Schedule notification delivery based on user preferences
   */
  private async scheduleNotificationDelivery(notificationId: string) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      })

      if (!notification) return

      // Get target users
      const targetUsers = await this.getTargetUsers(notification)

      for (const user of targetUsers) {
        const preferences = await this.getUserPreferences(user.id)

        // Schedule in-app notification if enabled
        if (preferences.inAppEnabled) {
          await prisma.notificationDelivery.create({
            data: {
              notificationId,
              deliveryType: 'IN_APP',
              status: 'DELIVERED', // In-app notifications are immediately available
              deliveredAt: new Date(),
            },
          })
        }

        // Schedule email notification if enabled
        if (preferences.emailEnabled && this.shouldSendEmailForType(notification.type, preferences)) {
          await prisma.notificationDelivery.create({
            data: {
              notificationId,
              deliveryType: 'EMAIL',
              status: 'PENDING',
            },
          })

          // Send email immediately (in production, you might want to queue this)
          await this.sendEmailNotification(notificationId, user)
        }
      }
    } catch (error) {
      console.error('Error scheduling notification delivery:', error)
    }
  }

  /**
   * Get target users for a notification
   */
  private async getTargetUsers(notification: Notification) {
    const users = []

    if (notification.targetUserId) {
      const user = await prisma.user.findUnique({
        where: { id: notification.targetUserId },
        select: { id: true, email: true, name: true },
      })
      if (user) users.push(user)
    }

    if (notification.targetRole) {
      const roleUsers = await prisma.user.findMany({
        where: { 
          role: notification.targetRole,
          status: 'ACTIVE'
        },
        select: { id: true, email: true, name: true },
      })
      users.push(...roleUsers)
    }

    return users
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const preferences = await prisma.notificationPreferences.findUnique({
        where: { userId },
      })

      if (!preferences) {
        // Create default preferences if they don't exist
        const defaultPreferences = await prisma.notificationPreferences.create({
          data: {
            userId,
            emailEnabled: true,
            inAppEnabled: true,
            requestStatusChanges: true,
            managerAssignments: true,
            systemAlerts: true,
            weeklyDigest: false,
          },
        })
        return defaultPreferences
      }

      return preferences
    } catch (error) {
      console.error('Error getting user preferences:', error)
      // Return default preferences on error
      return {
        emailEnabled: true,
        inAppEnabled: true,
        requestStatusChanges: true,
        managerAssignments: true,
        systemAlerts: true,
        weeklyDigest: false,
      }
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>) {
    try {
      return await prisma.notificationPreferences.upsert({
        where: { userId },
        update: preferences,
        create: {
          userId,
          emailEnabled: preferences.emailEnabled ?? true,
          inAppEnabled: preferences.inAppEnabled ?? true,
          requestStatusChanges: preferences.requestStatusChanges ?? true,
          managerAssignments: preferences.managerAssignments ?? true,
          systemAlerts: preferences.systemAlerts ?? true,
          weeklyDigest: preferences.weeklyDigest ?? false,
        },
      })
    } catch (error) {
      console.error('Error updating user preferences:', error)
      throw error
    }
  }

  /**
   * Check if email should be sent for notification type based on preferences
   */
  private shouldSendEmailForType(type: string, preferences: NotificationPreferences): boolean {
    switch (type) {
      case 'REQUEST_STATUS_CHANGE':
        return preferences.requestStatusChanges
      case 'MANAGER_ASSIGNMENT':
        return preferences.managerAssignments
      case 'SYSTEM_ALERT':
        return preferences.systemAlerts
      default:
        return true
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notificationId: string, user: Pick<User, 'id' | 'email' | 'name'>) {
    if (!this.emailTransporter) {
      console.warn('Email transporter not configured')
      return
    }

    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      })

      if (!notification) return

      const emailHtml = this.generateEmailTemplate(notification, user)

      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@company.com',
        to: user.email,
        subject: notification.title,
        html: emailHtml,
      })

      // Update delivery status
      await prisma.notificationDelivery.updateMany({
        where: {
          notificationId,
          deliveryType: 'EMAIL',
          status: 'PENDING',
        },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Error sending email notification:', error)
      
      // Update delivery status to failed
      await prisma.notificationDelivery.updateMany({
        where: {
          notificationId,
          deliveryType: 'EMAIL',
          status: 'PENDING',
        },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          attemptCount: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      })
    }
  }

  /**
   * Generate email template
   */
  private generateEmailTemplate(notification: Notification, user: Pick<User, 'id' | 'email' | 'name'>): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${notification.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .content { padding: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .priority-high { border-left: 4px solid #dc3545; }
          .priority-urgent { border-left: 4px solid #fd7e14; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${notification.title}</h2>
            <p><strong>Priority:</strong> ${notification.priority}</p>
          </div>
          <div class="content ${notification.priority === 'HIGH' ? 'priority-high' : notification.priority === 'URGENT' ? 'priority-urgent' : ''}">
            <p>Hello ${user.name || user.email},</p>
            <p>${notification.message}</p>
            ${notification.actionUrl ? `<a href="${notification.actionUrl}" class="button">${notification.actionLabel || 'View Details'}</a>` : ''}
          </div>
          <div class="footer">
            <p>This is an automated notification from the Office Supplies Management System.</p>
            <p>If you no longer wish to receive these emails, you can update your notification preferences in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    try {
      return await prisma.notification.updateMany({
        where: {
          id: notificationId,
          OR: [
            { targetUserId: userId },
            { targetRole: { in: await this.getUserRoles(userId) } }
          ]
        },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  /**
   * Mark notification as dismissed
   */
  async markAsDismissed(notificationId: string, userId: string) {
    try {
      return await prisma.notification.updateMany({
        where: {
          id: notificationId,
          OR: [
            { targetUserId: userId },
            { targetRole: { in: await this.getUserRoles(userId) } }
          ]
        },
        data: {
          status: 'DISMISSED',
          dismissedAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Error marking notification as dismissed:', error)
      throw error
    }
  }

  /**
   * Get user roles (helper method)
   */
  private async getUserRoles(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    return user ? [user.role] : []
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, options: {
    status?: string
    category?: string
    limit?: number
    offset?: number
  } = {}) {
    try {
      const userRoles = await this.getUserRoles(userId)
      
      const where: any = {
        OR: [
          { targetUserId: userId },
          { targetRole: { in: userRoles } }
        ],
        AND: [
          {
            OR: [
              { expiresAt: { gt: new Date() } },
              { expiresAt: null }
            ]
          }
        ]
      }

      if (options.status) {
        where.status = options.status
      }

      if (options.category) {
        where.category = options.category
      }

      return await prisma.notification.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: options.limit || 50,
        skip: options.offset || 0,
        include: {
          deliveries: {
            where: { deliveryType: 'IN_APP' }
          }
        }
      })
    } catch (error) {
      console.error('Error getting user notifications:', error)
      throw error
    }
  }

  /**
   * Bulk mark notifications as read
   */
  async bulkMarkAsRead(notificationIds: string[], userId: string) {
    try {
      const userRoles = await this.getUserRoles(userId)
      
      return await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          OR: [
            { targetUserId: userId },
            { targetRole: { in: userRoles } }
          ]
        },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
      })
    } catch (error) {
      console.error('Error bulk marking notifications as read:', error)
      throw error
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications() {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })
      
      console.log(`Cleaned up ${result.count} expired notifications`)
      return result.count
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error)
      throw error
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()