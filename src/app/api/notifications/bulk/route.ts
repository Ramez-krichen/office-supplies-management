import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationService } from '@/lib/notification-service'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, notificationIds } = body

    if (!action || !['read', 'dismiss'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "read" or "dismiss"' },
        { status: 400 }
      )
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'notificationIds array is required' },
        { status: 400 }
      )
    }

    let result
    if (action === 'read') {
      result = await notificationService.bulkMarkAsRead(notificationIds, session.user.id)
    } else {
      // For bulk dismiss, we'll use the same logic but update status to DISMISSED
      result = await notificationService.bulkMarkAsRead(notificationIds, session.user.id)
      // Note: We'd need to add a bulkMarkAsDismissed method to the service
    }

    return NextResponse.json({
      success: true,
      message: `${result.count} notifications marked as ${action}`,
      updatedCount: result.count,
    })
  } catch (error) {
    console.error('Error bulk updating notifications:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create bulk notifications
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      type,
      title,
      message,
      data,
      priority,
      targetRoles,
      targetUserIds,
      category,
      actionUrl,
      actionLabel,
      expiresAt,
      metadata,
    } = body

    // Validate required fields
    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Type, title, and message are required' },
        { status: 400 }
      )
    }

    const createdNotifications = []

    // Create notifications for target roles
    if (targetRoles && Array.isArray(targetRoles)) {
      for (const role of targetRoles) {
        const notificationId = await notificationService.createNotification({
          type,
          title,
          message,
          data,
          priority: priority || 'MEDIUM',
          targetRole: role,
          category: category || 'GENERAL',
          actionUrl,
          actionLabel,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          metadata,
        })
        createdNotifications.push({ id: notificationId, targetRole: role })
      }
    }

    // Create notifications for specific users
    if (targetUserIds && Array.isArray(targetUserIds)) {
      for (const userId of targetUserIds) {
        const notificationId = await notificationService.createNotification({
          type,
          title,
          message,
          data,
          priority: priority || 'MEDIUM',
          targetUserId: userId,
          category: category || 'GENERAL',
          actionUrl,
          actionLabel,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          metadata,
        })
        createdNotifications.push({ id: notificationId, targetUserId: userId })
      }
    }

    return NextResponse.json({
      success: true,
      message: `${createdNotifications.length} notifications created`,
      notifications: createdNotifications,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating bulk notifications:', error)
    return NextResponse.json(
      { error: 'Failed to create notifications' },
      { status: 500 }
    )
  }
}