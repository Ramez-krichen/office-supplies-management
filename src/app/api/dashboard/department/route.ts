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
      targetDepartment = requestedDepartment || user.department || null
    } else if (userRole === 'MANAGER') {
      // Managers can only view their own department
      targetDepartment = user.department || null
    }

    if (!targetDepartment) {
      return NextResponse.json({ error: 'Department not specified' }, { status: 400 })
    }

    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastQuarter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // First, try to find the department by name or code
    const department = await prisma.department.findFirst({
      where: {
        OR: [
          { name: targetDepartment },
          { code: targetDepartment }
        ]
      }
    })

    // If no formal department exists, we'll work with the department string directly
    // This handles legacy data where users have department strings but no Department records
    let departmentId: string | null = null
    let departmentName: string = targetDepartment
    
    if (department) {
      departmentId = department.id
      departmentName = department.name
    } else {
      // Check if there are users with this department string
      const usersWithDepartment = await prisma.user.count({
        where: {
          department: targetDepartment
        }
      })
      
      if (usersWithDepartment === 0) {
        return NextResponse.json({ error: 'Department not found' }, { status: 404 })
      }
    }

    // Optimize database queries by running them in parallel
    const [
      departmentRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      departmentUsers,
      totalRequests,
      totalPOSpending,
      monthlyRequests,
      monthlyPOSpending,
      quarterlyRequests,
      quarterlyPOSpending,
      topRequesters,
      recentRequests,
      averageApprovalTime
    ] = await Promise.all([
      // Basic request counts - use both department ID and department string
      prisma.request.count({
        where: departmentId ? 
          { requester: { departmentId } } : 
          { requester: { department: targetDepartment } }
      }),
      prisma.request.count({
        where: {
          status: 'PENDING',
          ...(departmentId ? 
            { requester: { departmentId } } : 
            { requester: { department: targetDepartment } })
        }
      }),
      prisma.request.count({
        where: {
          status: 'APPROVED',
          ...(departmentId ? 
            { requester: { departmentId } } : 
            { requester: { department: targetDepartment } })
        }
      }),
      prisma.request.count({
        where: {
          status: 'REJECTED',
          ...(departmentId ? 
            { requester: { departmentId } } : 
            { requester: { department: targetDepartment } })
        }
      }),

      // Department team information - use both department ID and department string
      prisma.user.findMany({
        where: departmentId ? 
          { departmentId } : 
          { department: targetDepartment },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          lastSignIn: true
        },
        orderBy: { name: 'asc' }
      }),

      // Total spending - requests
      prisma.request.findMany({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          ...(departmentId ? 
            { requester: { departmentId } } : 
            { requester: { department: targetDepartment } })
        },
        include: {
          items: {
            include: { item: true }
          }
        }
      }),

      // Total spending - purchase orders
      prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] },
          ...(departmentId ? 
            { createdBy: { departmentId } } : 
            { createdBy: { department: targetDepartment } })
        },
        _sum: { totalAmount: true }
      }),

      // Monthly spending - requests
      prisma.request.findMany({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: currentMonth },
          ...(departmentId ? 
            { requester: { departmentId } } : 
            { requester: { department: targetDepartment } })
        },
        include: {
          items: {
            include: { item: true }
          }
        }
      }),

      // Monthly spending - purchase orders
      prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] },
          createdAt: { gte: currentMonth },
          ...(departmentId ? 
            { createdBy: { departmentId } } : 
            { createdBy: { department: targetDepartment } })
        },
        _sum: { totalAmount: true }
      }),

      // Quarterly spending - requests
      prisma.request.findMany({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: lastQuarter },
          ...(departmentId ? 
            { requester: { departmentId } } : 
            { requester: { department: targetDepartment } })
        },
        include: {
          items: {
            include: { item: true }
          }
        }
      }),

      // Quarterly spending - purchase orders
      prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] },
          createdAt: { gte: lastQuarter },
          ...(departmentId ? 
            { createdBy: { departmentId } } : 
            { createdBy: { department: targetDepartment } })
        },
        _sum: { totalAmount: true }
      }),

      // Top requesters
      prisma.request.groupBy({
        by: ['requesterId'],
        where: {
          ...(departmentId ? 
            { requester: { departmentId } } : 
            { requester: { department: targetDepartment } }),
          createdAt: { gte: lastQuarter }
        },
        _count: { id: true },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 5
      }),

      // Recent requests
      prisma.request.findMany({
        where: departmentId ? 
          { requester: { departmentId } } : 
          { requester: { department: targetDepartment } },
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
      }),

      // Average approval time
      prisma.request.findMany({
        where: {
          status: { in: ['APPROVED', 'REJECTED'] },
          ...(departmentId ? 
            { requester: { departmentId } } : 
            { requester: { department: targetDepartment } }),
          createdAt: { gte: lastMonth }
        },
        select: {
          createdAt: true,
          updatedAt: true
        }
      })
    ])

    // Calculate spending totals
    const totalRequestSpending = totalRequests.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
      }, 0)
    }, 0)

    const monthlyRequestSpending = monthlyRequests.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
      }, 0)
    }, 0)

    const quarterlyRequestSpending = quarterlyRequests.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
      }, 0)
    }, 0)

    // Calculate total spending
    const totalSpending = totalRequestSpending + (totalPOSpending._sum.totalAmount || 0)
    const monthlySpending = monthlyRequestSpending + (monthlyPOSpending._sum.totalAmount || 0)
    const quarterlySpending = quarterlyRequestSpending + (quarterlyPOSpending._sum.totalAmount || 0)

    // Get user details for top requesters in parallel
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

    // Calculate average approval time
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
        value: `$${monthlySpending.toFixed(2)}`,
        change: `Quarterly: $${quarterlySpending.toFixed(2)}`,
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
      departmentInfo: {
        name: departmentName,
        totalSpending,
        monthlySpending,
        quarterlySpending
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
