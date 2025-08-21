import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationService } from '@/lib/notification-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const notifications = await notificationService.getUserNotifications(
      session.user.id,
      {
        status: status || undefined,
        category: category || undefined,
        limit,
        offset,
      }
    )

    // Get counts for different statuses
    const unreadCount = await notificationService.getUserNotifications(
      session.user.id,
      { status: 'UNREAD', limit: 1000 }
    )

    return NextResponse.json({
      notifications,
      unreadCount: unreadCount.length,
      total: notifications.length,
    })
  } catch (error) {
    console.error('Error fetching user notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
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

    // Only admins and managers can create notifications
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      type,
      title,
      message,
      data,
      priority,
      targetRole,
      targetUserId,
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

    const notificationId = await notificationService.createNotification({
      type,
      title,
      message,
      data,
      priority: priority || 'MEDIUM',
      targetRole,
      targetUserId,
      category: category || 'GENERAL',
      actionUrl,
      actionLabel,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      metadata,
    })

    return NextResponse.json({ id: notificationId, success: true }, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}