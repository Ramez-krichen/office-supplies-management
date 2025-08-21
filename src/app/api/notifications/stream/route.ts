import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationService } from '@/lib/notification-service'

// Store active connections
const connections = new Map<string, ReadableStreamDefaultController>()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        // Store the connection
        connections.set(userId, controller)

        // Send initial connection message
        controller.enqueue(`data: ${JSON.stringify({
          type: 'connected',
          message: 'Real-time notifications connected',
          timestamp: new Date().toISOString()
        })}\n\n`)

        // Send initial notification count
        notificationService.getUserNotifications(userId, { status: 'UNREAD' })
          .then(notifications => {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'unread_count',
              count: notifications.length,
              timestamp: new Date().toISOString()
            })}\n\n`)
          })
          .catch(error => {
            console.error('Error fetching initial notifications:', error)
          })

        // Set up periodic heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`)
          } catch (error) {
            clearInterval(heartbeat)
            connections.delete(userId)
          }
        }, 30000) // Send heartbeat every 30 seconds

        // Clean up on close
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat)
          connections.delete(userId)
          try {
            controller.close()
          } catch (error) {
            // Connection already closed
          }
        })
      },
      cancel() {
        connections.delete(userId)
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    })
  } catch (error) {
    console.error('Error setting up notification stream:', error)
    return NextResponse.json(
      { error: 'Failed to establish notification stream' },
      { status: 500 }
    )
  }
}

// Function to broadcast notification to specific user
export function broadcastToUser(userId: string, notification: any) {
  const controller = connections.get(userId)
  if (controller) {
    try {
      controller.enqueue(`data: ${JSON.stringify({
        type: 'notification',
        notification,
        timestamp: new Date().toISOString()
      })}\n\n`)
    } catch (error) {
      console.error('Error broadcasting to user:', error)
      connections.delete(userId)
    }
  }
}

// Function to broadcast to all connected users
export function broadcastToAll(notification: any) {
  connections.forEach((controller, userId) => {
    try {
      controller.enqueue(`data: ${JSON.stringify({
        type: 'notification',
        notification,
        timestamp: new Date().toISOString()
      })}\n\n`)
    } catch (error) {
      console.error('Error broadcasting to all users:', error)
      connections.delete(userId)
    }
  })
}

// Function to update unread count for a user
export function updateUnreadCount(userId: string, count: number) {
  const controller = connections.get(userId)
  if (controller) {
    try {
      controller.enqueue(`data: ${JSON.stringify({
        type: 'unread_count',
        count,
        timestamp: new Date().toISOString()
      })}\n\n`)
    } catch (error) {
      console.error('Error updating unread count:', error)
      connections.delete(userId)
    }
  }
}