import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { checkAccess, DASHBOARD_ACCESS } from '@/lib/server-access-control'

export async function GET() {
  try {
    const accessCheck = await checkAccess(DASHBOARD_ACCESS.ADMIN)
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { user } = accessCheck

    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // System-wide statistics
    const totalRequests = await prisma.request.count()
    const pendingRequests = await prisma.request.count({
      where: { status: 'PENDING' }
    })
    const totalUsers = await prisma.user.count()
    const activeUsers = await prisma.user.count({
      where: { status: 'ACTIVE' }
    })
    const totalItems = await prisma.item.count()
    
    // Get items where current stock is less than or equal to minimum stock
    const itemsWithStock = await prisma.item.findMany({
      select: {
        id: true,
        currentStock: true,
        minStock: true
      }
    })
    
    const lowStockItems = itemsWithStock.filter(item =>
      item.currentStock <= item.minStock
    ).length

    // Purchase orders statistics
    const activePurchaseOrders = await prisma.purchaseOrder.count({
      where: { status: { in: ['PENDING', 'APPROVED', 'ORDERED'] } }
    })

    // Financial statistics
    const totalSpending = await prisma.request.aggregate({
      where: { status: { in: ['APPROVED', 'COMPLETED'] } },
      _sum: { totalAmount: true }
    })

    const monthlySpending = await prisma.request.aggregate({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        createdAt: { gte: currentMonth }
      },
      _sum: { totalAmount: true }
    })

    // Department breakdown
    const departmentStats = await prisma.request.groupBy({
      by: ['department'],
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        department: { not: null }
      },
      _count: { id: true },
      _sum: { totalAmount: true }
    })

    // Recent system activity
    const recentRequests = await prisma.request.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: {
          select: {
            name: true,
            email: true,
            department: true
          }
        }
      }
    })

    // User activity
    const recentUsers = await prisma.user.findMany({
      where: { lastSignIn: { gte: lastWeek } },
      orderBy: { lastSignIn: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        role: true,
        lastSignIn: true
      }
    })

    // Get pending requests that need approval (admin can approve all)
    const pendingRequestsForApproval = await prisma.request.findMany({
      where: {
        status: 'PENDING'
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

    // System alerts (low stock, pending approvals, etc.)
    const systemAlerts = []
    
    if (lowStockItems > 0) {
      systemAlerts.push({
        type: 'warning',
        message: `${lowStockItems} items are running low on stock`,
        action: 'View Inventory'
      })
    }
    
    if (pendingRequests > 10) {
      systemAlerts.push({
        type: 'info',
        message: `${pendingRequests} requests are pending approval`,
        action: 'Review Requests'
      })
    }

    const stats = [
      {
        name: 'Total Requests',
        value: totalRequests.toString(),
        change: `${pendingRequests} pending`,
        changeType: 'neutral' as const
      },
      {
        name: 'Active Users',
        value: activeUsers.toString(),
        change: `${totalUsers} total users`,
        changeType: 'neutral' as const
      },
      {
        name: 'Low Stock Items',
        value: lowStockItems.toString(),
        change: `${totalItems} total items`,
        changeType: lowStockItems > 0 ? 'decrease' as const : 'neutral' as const
      },
      {
        name: 'Active Orders',
        value: activePurchaseOrders.toString(),
        change: 'Purchase orders in progress',
        changeType: 'neutral' as const
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
      requester: request.requester?.name || 'Unknown User',
      department: request.requester?.department || 'Unknown',
      status: request.status,
      amount: `$${request.totalAmount.toFixed(2)}`,
      date: request.createdAt.toISOString().split('T')[0],
      priority: request.priority
    }))

    // Format department stats
    const formattedDepartmentStats = departmentStats.map(dept => ({
      department: dept.department || 'Unknown',
      requestCount: dept._count.id,
      totalSpending: dept._sum.totalAmount || 0
    })).sort((a, b) => b.totalSpending - a.totalSpending)

    // Format pending approvals
    const formattedPendingApprovals = pendingRequestsForApproval.map(request => {
      const totalAmount = request.items.reduce((sum, item) => {
        return sum + (item.quantity * item.item.price)
      }, 0)

      return {
        id: request.id,
        title: request.title,
        requester: request.requester?.name || 'Unknown User',
        amount: `$${totalAmount.toFixed(2)}`,
        date: request.createdAt.toISOString().split('T')[0],
        priority: request.priority,
        itemCount: request.items.length
      }
    })

    return NextResponse.json({
      stats,
      recentRequests: formattedRecentRequests,
      departmentStats: formattedDepartmentStats,
      recentUsers,
      systemAlerts,
      pendingApprovals: formattedPendingApprovals,
      systemInfo: {
        adminName: user?.name || 'Admin',
        totalDepartments: new Set(departmentStats.map(d => d.department)).size,
        systemHealth: 'Good' // Could be calculated based on various metrics
      }
    })
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin dashboard statistics' },
      { status: 500 }
    )
  }
}
