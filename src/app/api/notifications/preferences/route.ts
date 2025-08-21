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

    const preferences = await notificationService.getUserPreferences(session.user.id)

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      emailEnabled,
      inAppEnabled,
      requestStatusChanges,
      managerAssignments,
      systemAlerts,
      weeklyDigest,
    } = body

    // Validate boolean fields
    const booleanFields = {
      emailEnabled,
      inAppEnabled,
      requestStatusChanges,
      managerAssignments,
      systemAlerts,
      weeklyDigest,
    }

    for (const [key, value] of Object.entries(booleanFields)) {
      if (value !== undefined && typeof value !== 'boolean') {
        return NextResponse.json(
          { error: `${key} must be a boolean value` },
          { status: 400 }
        )
      }
    }

    const updatedPreferences = await notificationService.updateUserPreferences(
      session.user.id,
      {
        emailEnabled,
        inAppEnabled,
        requestStatusChanges,
        managerAssignments,
        systemAlerts,
        weeklyDigest,
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedPreferences,
    })
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}