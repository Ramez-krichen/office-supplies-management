import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { checkAccess, DASHBOARD_ACCESS } from '@/lib/server-access-control'

export async function GET() {
  try {
    const accessCheck = await checkAccess(DASHBOARD_ACCESS.MANAGER)
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { user, userRole } = accessCheck
    const userDepartment = user.department
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Department filter for managers (admins see all departments)
    const departmentFilter = userRole === 'MANAGER' && userDepartment
      ? { department: userDepartment }
      : {}

    // Get department requests statistics
    const departmentRequests = await prisma.request.count({
      where: {
        ...departmentFilter,
        requester: userDepartment ? { department: userDepartment } : undefined
      }
    })

    const pendingApprovals = await prisma.request.count({
      where: {
        status: 'PENDING',
        ...departmentFilter,
        requester: userDepartment ? { department: userDepartment } : undefined
      }
    })

    const approvedThisWeek = await prisma.request.count({
      where: {
        status: 'APPROVED',
        updatedAt: { gte: lastWeek },
        ...departmentFilter,
        requester: userDepartment ? { department: userDepartment } : undefined
      }
    })

    const rejectedThisWeek = await prisma.request.count({
      where: {
        status: 'REJECTED',
        updatedAt: { gte: lastWeek },
        ...departmentFilter,
        requester: userDepartment ? { department: userDepartment } : undefined
      }
    })

    // Get department spending
    const departmentSpending = await prisma.request.aggregate({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        ...departmentFilter,
        requester: userDepartment ? { department: userDepartment } : undefined
      },
      _sum: {
        totalAmount: true
      }
    })

    const monthlySpending = await prisma.request.aggregate({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        createdAt: { gte: currentMonth },
        ...departmentFilter,
        requester: userDepartment ? { department: userDepartment } : undefined
      },
      _sum: {
        totalAmount: true
      }
    })

    // Get recent department requests
    const recentRequests = await prisma.request.findMany({
      where: {
        ...departmentFilter,
        requester: userDepartment ? { department: userDepartment } : undefined
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: {
          select: {
            name: true,
            email: true,
            department: true
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

    // Get team members in department
    const teamMembers = await prisma.user.count({
      where: userDepartment ? { department: userDepartment } : {}
    })

    // Get pending requests that need approval
    const pendingRequestsForApproval = await prisma.request.findMany({
      where: {
        status: 'PENDING',
        ...departmentFilter,
        requester: userDepartment ? { department: userDepartment } : undefined
      },
      take: 5,
      orderBy: { createdAt: 'asc' },
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

    const stats = [
      {
        name: 'Department Requests',
        value: departmentRequests.toString(),
        change: `${userDepartment || 'All'} department`,
        changeType: 'neutral' as const
      },
      {
        name: 'Pending Approvals',
        value: pendingApprovals.toString(),
        change: 'Awaiting your review',
        changeType: pendingApprovals > 0 ? 'increase' as const : 'neutral' as const
      },
      {
        name: 'Team Members',
        value: teamMembers.toString(),
        change: `In ${userDepartment || 'all'} department`,
        changeType: 'neutral' as const
      },
      {
        name: 'Monthly Spending',
        value: `$${(monthlySpending._sum.totalAmount || 0).toFixed(2)}`,
        change: `Total: $${(departmentSpending._sum.totalAmount || 0).toFixed(2)}`,
        changeType: 'neutral' as const
      }
    ]

    // Format recent requests
    const formattedRecentRequests = recentRequests.map(request => ({
      id: request.id,
      title: request.title,
      requester: request.requester?.name || 'Unknown User',
      department: request.requester?.department || 'Unknown',
      status: request.status,
      amount: `$${request.totalAmount.toFixed(2)}`,
      date: request.createdAt.toISOString().split('T')[0],
      priority: request.priority
    }))

    // Format pending approvals
    const formattedPendingApprovals = pendingRequestsForApproval.map(request => ({
      id: request.id,
      title: request.title,
      requester: request.requester?.name || 'Unknown User',
      amount: `$${request.totalAmount.toFixed(2)}`,
      date: request.createdAt.toISOString().split('T')[0],
      priority: request.priority,
      itemCount: request.items.length
    }))

    return NextResponse.json({
      stats,
      recentRequests: formattedRecentRequests,
      pendingApprovals: formattedPendingApprovals,
      departmentInfo: {
        name: userDepartment || 'All Departments',
        managerName: user.name,
        role: userRole
      }
    })
  } catch (error) {
    console.error('Error fetching manager dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch manager dashboard statistics' },
      { status: 500 }
    )
  }
}
