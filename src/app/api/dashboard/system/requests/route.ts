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

    // Get detailed request data
    const [allRequests, recentRequests, requestsByStatus] = await Promise.all([
      // All requests with details
      prisma.request.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          totalAmount: true,
          createdAt: true,
          updatedAt: true,
          requester: {
            select: {
              name: true,
              email: true,
              departmentRef: {
                select: {
                  name: true
                }
              }
            }
          },
          items: {
            select: {
              quantity: true,
              totalPrice: true,
              item: {
                select: {
                  name: true,
                  price: true
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

      // Recent requests (last 7 days)
      prisma.request.findMany({
        where: {
          createdAt: {
            gte: oneWeekAgo
          }
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          requester: {
            select: {
              name: true,
              departmentRef: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),

      // Requests grouped by status
      prisma.request.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      })
    ])

    // Calculate total value of requests
    const totalValue = allRequests.reduce((total, request) => {
      return total + (request.totalAmount || 0)
    }, 0)

    // Group by priority
    const priorityGroups = allRequests.reduce((acc: any, request) => {
      const priority = request.priority || 'MEDIUM'
      if (!acc[priority]) acc[priority] = []
      acc[priority].push(request)
      return acc
    }, {})

    // Group by department
    const departmentGroups = allRequests.reduce((acc: any, request) => {
      const dept = request.requester.departmentRef?.name || 'No Department'
      if (!acc[dept]) acc[dept] = []
      acc[dept].push(request)
      return acc
    }, {})

    return NextResponse.json({
      summary: {
        total: allRequests.length,
        recent: recentRequests.length,
        totalValue: Math.round(totalValue),
        byStatus: requestsByStatus.reduce((acc: any, item) => {
          acc[item.status] = item._count.id
          return acc
        }, {}),
        byPriority: Object.keys(priorityGroups).reduce((acc: any, key) => {
          acc[key] = priorityGroups[key].length
          return acc
        }, {}),
        byDepartment: Object.keys(departmentGroups).reduce((acc: any, key) => {
          acc[key] = departmentGroups[key].length
          return acc
        }, {})
      },
      requests: {
        all: allRequests,
        recent: recentRequests,
        byPriority: priorityGroups,
        byDepartment: departmentGroups
      }
    })

  } catch (error) {
    console.error('Error fetching request details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request details' },
      { status: 500 }
    )
  }
}