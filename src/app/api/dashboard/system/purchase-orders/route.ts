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

    // Get detailed purchase order data
    const [allOrders, recentOrders, ordersByStatus] = await Promise.all([
      // All purchase orders with details
      prisma.purchaseOrder.findMany({
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          orderDate: true,
          expectedDate: true,
          createdAt: true,
          supplier: {
            select: {
              name: true,
              email: true
            }
          },
          items: {
            select: {
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              item: {
                select: {
                  name: true,
                  category: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100 // Limit for performance
      }),

      // Recent orders (last 7 days)
      prisma.purchaseOrder.findMany({
        where: {
          createdAt: {
            gte: oneWeekAgo
          }
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          supplier: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),

      // Orders grouped by status
      prisma.purchaseOrder.groupBy({
        by: ['status'],
        _count: {
          id: true
        },
        _sum: {
          totalAmount: true
        }
      })
    ])

    // Calculate total spending
    const totalSpending = allOrders.reduce((total: number, order: any) => {
      return total + (order.totalAmount || 0)
    }, 0)

    // Group by supplier
    const supplierGroups = allOrders.reduce((acc: any, order: any) => {
      const supplier = order.supplier?.name || 'Unknown Supplier'
      if (!acc[supplier]) {
        acc[supplier] = {
          orders: [],
          totalAmount: 0,
          count: 0
        }
      }
      acc[supplier].orders.push(order)
      acc[supplier].totalAmount += order.totalAmount || 0
      acc[supplier].count += 1
      return acc
    }, {})

    // Group by month for trend analysis
    const monthlyData = allOrders.reduce((acc: any, order: any) => {
      const month = new Date(order.createdAt).toISOString().slice(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          count: 0,
          totalAmount: 0
        }
      }
      acc[month].count += 1
      acc[month].totalAmount += order.totalAmount || 0
      return acc
    }, {})

    return NextResponse.json({
      summary: {
        total: allOrders.length,
        recent: recentOrders.length,
        totalSpending: Math.round(totalSpending),
        byStatus: ordersByStatus.reduce((acc: any, item: any) => {
          acc[item.status] = {
            count: item._count.id,
            totalAmount: item._sum.totalAmount || 0
          }
          return acc
        }, {}),
        topSuppliers: Object.entries(supplierGroups)
          .sort(([,a]: any, [,b]: any) => b.totalAmount - a.totalAmount)
          .slice(0, 5)
          .map(([name, data]: any) => ({ name, ...data }))
      },
      orders: {
        all: allOrders,
        recent: recentOrders,
        bySupplier: supplierGroups,
        monthlyTrend: monthlyData
      }
    })

  } catch (error) {
    console.error('Error fetching purchase order details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase order details' },
      { status: 500 }
    )
  }
}