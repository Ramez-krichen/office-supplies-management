import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/profile/activity - Get user's profile activity history
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get recent profile-related audit logs for the user
    const activities = await db.auditLog.findMany({
      where: {
        performedBy: session.user.id,
        action: {
          startsWith: 'PROFILE_'
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 20, // Last 20 activities
      select: {
        id: true,
        action: true,
        details: true,
        timestamp: true
      }
    })

    // Transform the activities for better frontend consumption
    const formattedActivities = activities.map(activity => {
      let details: any = {}

      try {
        details = activity.details ? JSON.parse(activity.details) : {}
      } catch (error) {
        console.error('Failed to parse activity details:', error)
        details = {}
      }

      return {
        id: activity.id,
        action: activity.action,
        timestamp: activity.timestamp,
        description: getActivityDescription(activity.action, details),
        details: {
          ipAddress: details?.ipAddress || 'Unknown',
          userAgent: details?.userAgent || 'Unknown',
          updatedFields: details?.updatedFields || [],
          passwordChanged: details?.passwordChanged || false,
          emailChanged: details?.emailChanged || false,
          warnings: details?.warnings || [],
          errors: details?.errors || []
        }
      }
    })

    return NextResponse.json({
      activities: formattedActivities,
      total: formattedActivities.length
    })
  } catch (error) {
    console.error('Error fetching profile activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile activity' },
      { status: 500 }
    )
  }
}

function getActivityDescription(action: string, details: any): string {
  switch (action) {
    case 'PROFILE_UPDATE_SUCCESS':
      const changes = []
      if (details?.updatedFields?.includes('name')) changes.push('name')
      if (details?.updatedFields?.includes('email')) changes.push('email')
      if (details?.passwordChanged) changes.push('password')
      
      if (changes.length === 0) {
        return 'Profile updated'
      }
      
      return `Updated ${changes.join(', ')}`
      
    case 'PROFILE_UPDATE_FAILED':
      return `Failed to update profile: ${details?.errors?.join(', ') || 'Unknown error'}`
      
    case 'PROFILE_VIEW':
      return 'Viewed profile'
      
    case 'PROFILE_PASSWORD_CHANGE':
      return 'Password changed successfully'
      
    case 'PROFILE_EMAIL_CHANGE':
      return 'Email address changed'
      
    case 'PROFILE_LOGIN_ATTEMPT':
      return details?.success ? 'Successful login' : 'Failed login attempt'
      
    default:
      return action.replace('PROFILE_', '').toLowerCase().replace('_', ' ')
  }
}
