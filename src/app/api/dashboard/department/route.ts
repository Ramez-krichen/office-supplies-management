import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { checkAccess, DASHBOARD_ACCESS } from '@/lib/server-access-control'

export async function GET(request: Request) {
  try {
    const accessCheck = await checkAccess(DASHBOARD_ACCESS.DEPARTMENT)
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { user, userRole } = accessCheck

    // Get department from query params or use user's department
    const { searchParams } = new URL(request.url)
    const requestedDepartment = searchParams.get('department')
    
    // Determine which department to show
    let targetDepartment: string | null = null
    if (userRole === 'ADMIN') {
      // Admins can view any department
      targetDepartment = requestedDepartment || user.department
    } else if (userRole === 'MANAGER') {
      // Managers can only view their own department
      targetDepartment = user.department
    }

    if (!targetDepartment) {
      return NextResponse.json({ error: 'Department not specified' }, { status: 400 })
    }

    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastQuarter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // First, find the department by name or code
    const department = await prisma.department.findFirst({
      where: {
        OR: [
          { name: targetDepartment },
          { code: targetDepartment }
        ]
      }
    })

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    // Department-specific statistics using departmentId
    const departmentRequests = await prisma.request.count({
      where: {
        requester: { departmentId: department.id }
      }
    })

    const pendingRequests = await prisma.request.count({
      where: {
        status: 'PENDING',
        requester: { departmentId: department.id }
      }
    })

    const approvedRequests = await prisma.request.count({
      where: {
        status: 'APPROVED',
        requester: { departmentId: department.id }
      }
    })

    const rejectedRequests = await prisma.request.count({
      where: {
        status: 'REJECTED',
        requester: { departmentId: department.id }
      }
    })

    // Department team information using the new departmentId relationship
    const departmentUsers = await prisma.user.findMany({
      where: { departmentId: department.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastSignIn: true
      },
      orderBy: { name: 'asc' }
    })

    // Department spending analysis
    const totalRequests = await prisma.request.findMany({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        requester: { departmentId: department.id }
      },
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    })

    const totalRequestSpending = totalRequests.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
      }, 0)
    }, 0)

    // Get total purchase orders spending for this department
    const totalPOSpending = await prisma.purchaseOrder.aggregate({
      where: {
        status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] },
        createdBy: { departmentId: department.id }
      },
      _sum: { totalAmount: true }
    })

    const totalSpending = {
      _sum: {
        totalAmount: totalRequestSpending + (totalPOSpending._sum.totalAmount || 0)
      }
    }

    const monthlyRequests = await prisma.request.findMany({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        createdAt: { gte: currentMonth },
        requester: { departmentId: department.id }
      },
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    })

    const monthlyRequestSpending = monthlyRequests.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
      }, 0)
    }, 0)

    // Get monthly purchase orders spending for this department
    const monthlyPOSpending = await prisma.purchaseOrder.aggregate({
      where: {
        status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] },
        createdAt: { gte: currentMonth },
        createdBy: { departmentId: department.id }
      },
      _sum: { totalAmount: true }
    })

    const monthlySpending = {
      _sum: {
        totalAmount: monthlyRequestSpending + (monthlyPOSpending._sum.totalAmount || 0)
      }
    }

    const quarterlyRequests = await prisma.request.findMany({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        createdAt: { gte: lastQuarter },
        requester: { departmentId: department.id }
      },
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    })

    const quarterlyRequestSpending = quarterlyRequests.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
      }, 0)
    }, 0)

    // Get quarterly purchase orders spending for this department
    const quarterlyPOSpending = await prisma.purchaseOrder.aggregate({
      where: {
        status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] },
        createdAt: { gte: lastQuarter },
        createdBy: { departmentId: department.id }
      },
      _sum: { totalAmount: true }
    })

    const quarterlySpending = {
      _sum: {
        totalAmount: quarterlyRequestSpending + (quarterlyPOSpending._sum.totalAmount || 0)
      }
    }

    // Department requests by status over time
    const requestsByMonth = await prisma.request.groupBy({
      by: ['status'],
      where: {
        requester: { departmentId: department.id },
        createdAt: { gte: lastQuarter }
      },
      _count: { id: true }
    })

    // Top requesters in department
    const topRequesters = await prisma.request.groupBy({
      by: ['requesterId'],
      where: {
        requester: { departmentId: department.id },
        createdAt: { gte: lastQuarter }
      },
      _count: { id: true },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5
    })

    // Get user details for top requesters
    const topRequesterDetails = await Promise.all(
      topRequesters.map(async (requester) => {
        const user = await prisma.user.findUnique({
          where: { id: requester.requesterId },
          select: { name: true, email: true }
        })
        return {
          name: user?.name || 'Unknown',
          email: user?.email || '',
          requestCount: requester._count.id,
          totalSpending: requester._sum.totalAmount || 0
        }
      })
    )

    // Recent department activity
    const recentRequests = await prisma.request.findMany({
      where: {
        requester: { departmentId: department.id }
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: {
          select: {
            name: true,
            email: true
          }
        },
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

    // Department performance metrics
    const averageApprovalTime = await prisma.request.findMany({
      where: {
        status: { in: ['APPROVED', 'REJECTED'] },
        requester: { departmentId: department.id },
        createdAt: { gte: lastMonth }
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    })

    const avgApprovalHours = averageApprovalTime.length > 0
      ? averageApprovalTime.reduce((sum, req) => {
          const hours = (req.updatedAt.getTime() - req.createdAt.getTime()) / (1000 * 60 * 60)
          return sum + hours
        }, 0) / averageApprovalTime.length
      : 0

    const stats = [
      {
        name: 'Total Requests',
        value: departmentRequests.toString(),
        change: `${pendingRequests} pending`,
        changeType: 'neutral' as const
      },
      {
        name: 'Team Members',
        value: departmentUsers.length.toString(),
        change: `${departmentUsers.filter(u => u.status === 'ACTIVE').length} active`,
        changeType: 'neutral' as const
      },
      {
        name: 'Approval Rate',
        value: departmentRequests > 0 
          ? `${Math.round((approvedRequests / departmentRequests) * 100)}%`
          : '0%',
        change: `${rejectedRequests} rejected`,
        changeType: 'neutral' as const
      },
      {
        name: 'Monthly Spending',
        value: `$${(monthlySpending._sum.totalAmount || 0).toFixed(2)}`,
        change: `Quarterly: $${(quarterlySpending._sum.totalAmount || 0).toFixed(2)}`,
        changeType: 'neutral' as const
      },
      {
        name: 'Avg Approval Time',
        value: `${Math.round(avgApprovalHours)}h`,
        change: 'This month',
        changeType: 'neutral' as const
      }
    ]

    // Format recent requests
    const formattedRecentRequests = recentRequests.map(request => ({
      id: request.id,
      title: request.title,
      requester: request.requester?.name || 'Unknown User',
      status: request.status,
      amount: `$${request.totalAmount.toFixed(2)}`,
      date: request.createdAt.toISOString().split('T')[0],
      priority: request.priority,
      itemCount: request.items.length
    }))

    return NextResponse.json({
      stats,
      recentRequests: formattedRecentRequests,
      departmentUsers,
      topRequesters: topRequesterDetails,
      requestsByStatus: requestsByMonth,
      departmentInfo: {
        name: department.name,
        totalSpending: totalSpending._sum.totalAmount || 0,
        monthlySpending: monthlySpending._sum.totalAmount || 0,
        quarterlySpending: quarterlySpending._sum.totalAmount || 0
      }
    })
  } catch (error) {
    console.error('Error fetching department dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch department dashboard statistics' },
      { status: 500 }
    )
  }
}
