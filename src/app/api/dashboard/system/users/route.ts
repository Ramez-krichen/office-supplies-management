import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { checkAccess, DASHBOARD_ACCESS } from '@/lib/server-access-control'

export async function GET() {
  try {
    const accessCheck = await checkAccess(DASHBOARD_ACCESS.ADMIN)
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get detailed user data
    const [totalUsers, activeUsers, inactiveUsers, recentUsers] = await Promise.all([
      // All users with basic info
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          lastSignIn: true,
          createdAt: true,
          departmentRef: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),

      // Active users (signed in within last 30 days)
      prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          lastSignIn: {
            gte: oneMonthAgo
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          lastSignIn: true,
          departmentRef: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          lastSignIn: 'desc'
        }
      }),

      // Inactive users (not signed in for 30 days)
      prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          lastSignIn: {
            lt: oneMonthAgo
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          lastSignIn: true,
          departmentRef: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          lastSignIn: 'asc'
        }
      }),

      // Recent users (created in last 7 days)
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: oneWeekAgo
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          departmentRef: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ])

    // Calculate overactive users (simplified - users who signed in recently)
    const overactiveUsers = activeUsers.filter((user) =>
      user.lastSignIn && user.lastSignIn >= oneWeekAgo
    )

    return NextResponse.json({
      summary: {
        total: totalUsers.length,
        active: activeUsers.length,
        inactive: inactiveUsers.length,
        overactive: overactiveUsers.length,
        recent: recentUsers.length
      },
      users: {
        all: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        overactive: overactiveUsers,
        recent: recentUsers
      }
    })

  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}