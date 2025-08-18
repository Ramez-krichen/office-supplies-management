import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { checkAccess, DASHBOARD_ACCESS } from '@/lib/server-access-control'

export async function GET() {
  try {
    const accessCheck = await checkAccess(DASHBOARD_ACCESS.EMPLOYEE)
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { user } = accessCheck

    const userId = user.id
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Get user's own requests statistics
    const myRequests = await prisma.request.count({
      where: { requesterId: userId }
    })

    const myPendingRequests = await prisma.request.count({
      where: { 
        requesterId: userId,
        status: 'PENDING' 
      }
    })

    const myApprovedRequests = await prisma.request.count({
      where: { 
        requesterId: userId,
        status: 'APPROVED' 
      }
    })

    const myRejectedRequests = await prisma.request.count({
      where: { 
        requesterId: userId,
        status: 'REJECTED' 
      }
    })

    // Get recent requests by this user
    const recentRequests = await prisma.request.findMany({
      where: { requesterId: userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            item: {
              select: {
                name: true,
                unit: true,
                price: true
              }
            }
          }
        }
      }
    })

    // Get total spending by this user
    const totalSpending = await prisma.request.aggregate({
      where: { 
        requesterId: userId,
        status: { in: ['APPROVED', 'COMPLETED'] }
      },
      _sum: {
        totalAmount: true
      }
    })

    // Get spending this month
    const monthlySpending = await prisma.request.aggregate({
      where: {
        requesterId: userId,
        status: { in: ['APPROVED', 'COMPLETED'] },
        createdAt: { gte: currentMonth }
      },
      _sum: {
        totalAmount: true
      }
    })

    // Get notifications (pending approvals, rejections, etc.)
    const notifications = await prisma.request.findMany({
      where: {
        requesterId: userId,
        status: { in: ['APPROVED', 'REJECTED'] },
        updatedAt: { gte: lastWeek }
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    })

    const stats = [
      {
        name: 'My Requests',
        value: myRequests.toString(),
        change: 'Total requests submitted',
        changeType: 'neutral' as const
      },
      {
        name: 'Pending Requests',
        value: myPendingRequests.toString(),
        change: 'Awaiting approval',
        changeType: 'neutral' as const
      },
      {
        name: 'Approved Requests',
        value: myApprovedRequests.toString(),
        change: 'Successfully approved',
        changeType: 'increase' as const
      },
      {
        name: 'Monthly Spending',
        value: `$${(monthlySpending._sum.totalAmount || 0).toFixed(2)}`,
        change: `Total: $${(totalSpending._sum.totalAmount || 0).toFixed(2)}`,
        changeType: 'neutral' as const
      }
    ]

    // Format recent requests
    const formattedRecentRequests = recentRequests.map(request => ({
      id: request.id,
      title: request.title,
      status: request.status,
      amount: `$${request.totalAmount.toFixed(2)}`,
      date: request.createdAt.toISOString().split('T')[0],
      itemCount: request.items.length
    }))

    // Format notifications
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      status: notification.status,
      date: notification.updatedAt.toISOString().split('T')[0],
      message: notification.status === 'APPROVED' 
        ? `Your request "${notification.title}" has been approved`
        : `Your request "${notification.title}" has been rejected`
    }))

    return NextResponse.json({
      stats,
      recentRequests: formattedRecentRequests,
      notifications: formattedNotifications,
      userInfo: {
        name: user.name,
        department: user.department,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Error fetching employee dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employee dashboard statistics' },
      { status: 500 }
    )
  }
}
