import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Employees don't have access to dashboard stats (including low stock alerts)
    if (session.user.role === 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden - Employees cannot access dashboard statistics' }, { status: 403 })
    }

    // Get current date for comparisons
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get pending requests count
    const pendingRequests = await prisma.request.count({
      where: { status: 'PENDING' }
    })

    const pendingRequestsYesterday = await prisma.request.count({
      where: {
        status: 'PENDING',
        createdAt: { lte: yesterday }
      }
    })

    // Get low stock items count (items where currentStock <= 10 or 0)
    const lowStockItems = await prisma.item.count({
      where: {
        currentStock: {
          lte: 10
        }
      }
    })

    const lowStockItemsLastWeek = await prisma.item.count({
      where: {
        currentStock: {
          lte: 10
        },
        updatedAt: { lte: lastWeek }
      }
    })

    // Get active orders count
    const activeOrders = await prisma.purchaseOrder.count({
      where: {
        status: {
          in: ['DRAFT', 'SENT', 'CONFIRMED']
        }
      }
    })

    const activeOrdersYesterday = await prisma.purchaseOrder.count({
      where: {
        status: {
          in: ['DRAFT', 'SENT', 'CONFIRMED']
        },
        createdAt: { lte: yesterday }
      }
    })

    // Get total items count
    const totalItems = await prisma.item.count()

    const totalItemsLastMonth = await prisma.item.count({
      where: {
        createdAt: { lte: lastMonth }
      }
    })

    // Get recent requests with user and items
    const recentRequests = await prisma.request.findMany({
      take: 5,
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

    // Calculate changes
    const pendingChange = pendingRequests - pendingRequestsYesterday
    const lowStockChange = lowStockItems - lowStockItemsLastWeek
    const activeOrdersChange = activeOrders - activeOrdersYesterday
    const totalItemsChange = totalItems - totalItemsLastMonth

    // Format stats
    const stats = [
      {
        name: 'Pending Requests',
        value: pendingRequests.toString(),
        change: `${pendingChange >= 0 ? '+' : ''}${pendingChange} from yesterday`,
        changeType: pendingChange >= 0 ? 'increase' : 'decrease'
      },
      {
        name: 'Low Stock Items',
        value: lowStockItems.toString(),
        change: `${lowStockChange >= 0 ? '+' : ''}${lowStockChange} from last week`,
        changeType: lowStockChange >= 0 ? 'increase' : 'decrease'
      },
      {
        name: 'Active Orders',
        value: activeOrders.toString(),
        change: `${activeOrdersChange >= 0 ? '+' : ''}${activeOrdersChange} from yesterday`,
        changeType: activeOrdersChange >= 0 ? 'increase' : 'decrease'
      },
      {
        name: 'Total Items',
        value: totalItems.toString(),
        change: `${totalItemsChange >= 0 ? '+' : ''}${totalItemsChange} from last month`,
        changeType: totalItemsChange >= 0 ? 'increase' : 'decrease'
      }
    ]

    // Format recent requests
    const formattedRecentRequests = recentRequests.map(request => ({
      id: request.id,
      title: request.title,
      requester: request.requester?.name || 'Unknown User',
      status: request.status,
      amount: `$${request.totalAmount.toFixed(2)}`,
      date: request.createdAt.toISOString().split('T')[0]
    }))

    return NextResponse.json({
      stats,
      recentRequests: formattedRecentRequests
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}