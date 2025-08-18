import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notification = await prisma.notification.findUnique({
      where: { id: params.id }
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this notification
    if (notification.targetRole !== 'ADMIN' && notification.targetUserId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(notification)

  } catch (error) {
    console.error('Error fetching notification:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    // Validate status
    if (status && !['UNREAD', 'READ', 'DISMISSED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
    if (status) {
      updateData.status = status
      if (status === 'READ') {
        updateData.readAt = new Date()
      } else if (status === 'DISMISSED') {
        updateData.dismissedAt = new Date()
      }
    }

    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(notification)

  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.notification.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Notification deleted successfully' })

  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
