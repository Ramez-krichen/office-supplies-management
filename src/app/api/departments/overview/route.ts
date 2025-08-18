import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control'

export async function GET() {
  try {
    const accessCheck = await checkAccess({ allowedRoles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] })
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { user, userRole } = accessCheck

    // Build where clause based on user role and department restrictions
    const where: any = {}

    // For managers and employees, only show their own department
    if ((userRole === 'MANAGER' || userRole === 'EMPLOYEE') && user.department) {
      where.name = user.department
    }

    // Get departments with their relationships
    const departments = await prisma.department.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            role: true,
            status: true
          }
        },
        _count: {
          select: {
            users: true,
            children: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Calculate additional metrics for each department
    const departmentsWithMetrics = await Promise.all(
      departments.map(async (dept) => {
        // Get request count
        const requestCount = await prisma.request.count({
          where: {
            requester: { departmentId: dept.id }
          }
        })

        // Get current month spending
        const now = new Date()
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        
        const monthlyRequests = await prisma.request.findMany({
          where: {
            status: { in: ['APPROVED', 'COMPLETED'] },
            createdAt: { gte: currentMonth },
            requester: { departmentId: dept.id }
          },
          include: {
            items: { include: { item: true } }
          }
        })

        const monthlyRequestSpending = monthlyRequests.reduce((total, request) => {
          return total + request.items.reduce((itemTotal, requestItem) => {
            return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
          }, 0)
        }, 0)

        // Get monthly purchase orders spending
        const monthlyPOSpending = await prisma.purchaseOrder.aggregate({
          where: {
            status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] },
            createdAt: { gte: currentMonth },
            createdBy: { departmentId: dept.id }
          },
          _sum: { totalAmount: true }
        })

        const monthlySpending = monthlyRequestSpending + (monthlyPOSpending._sum.totalAmount || 0)
        const budgetUtilization = dept.budget ? (monthlySpending / dept.budget) * 100 : 0

        return {
          id: dept.id,
          code: dept.code,
          name: dept.name,
          description: dept.description,
          budget: dept.budget,
          status: dept.status,
          metrics: {
            userCount: dept._count.users,
            activeUsers: dept.users.filter(u => u.status === 'ACTIVE').length,
            monthlySpending,
            budgetUtilization: Math.round(budgetUtilization * 100) / 100,
            requestCount
          }
        }
      })
    )

    return NextResponse.json({
      departments: departmentsWithMetrics,
      total: departments.length
    })

  } catch (error) {
    console.error('Error fetching departments overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch departments overview' },
      { status: 500 }
    )
  }
}
