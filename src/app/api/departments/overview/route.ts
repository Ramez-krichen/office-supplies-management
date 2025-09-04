import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { checkAccess } from '@/lib/server-access-control'

export async function GET() {
  try {
    const accessCheck = await checkAccess({ allowedRoles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] })
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { user, userRole } = accessCheck

    // Build where clause based on user role and department restrictions
    const where: any = {
      status: 'ACTIVE'
    }

    // For managers and employees, only show their own department
    if ((userRole === 'MANAGER' || userRole === 'EMPLOYEE') && user.departmentId) {
      where.id = user.departmentId
    }

    // Get departments from the Department table
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
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Calculate metrics for each department
    const departmentsWithMetrics = await Promise.all(
      departments.map(async (dept) => {
        // Get active user count
        const activeUserCount = await prisma.user.count({
          where: {
            departmentId: dept.id,
            status: 'ACTIVE'
          }
        })

        // Get request count for this department (check both old and new department fields)
        const requestCount = await prisma.request.count({
          where: {
            OR: [
              { requester: { department: dept.name } },
              { requester: { departmentId: dept.id } }
            ]
          }
        })

        // Get current month spending
        const now = new Date()
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        
        const monthlyRequests = await prisma.request.aggregate({
          where: {
            status: { in: ['APPROVED', 'COMPLETED'] },
            createdAt: { gte: currentMonth },
            requester: { departmentId: dept.id }
          },
          _sum: { totalAmount: true }
        })

        // Get monthly purchase orders spending by users in this department
        const deptUsers = await prisma.user.findMany({
          where: { departmentId: dept.id },
          select: { id: true }
        })
        
        const deptUserIds = deptUsers.map(u => u.id)
        const monthlyPOSpending = await prisma.purchaseOrder.aggregate({
          where: {
            status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] },
            createdAt: { gte: currentMonth },
            createdById: { in: deptUserIds }
          },
          _sum: { totalAmount: true }
        })

        const monthlyRequestSpending = monthlyRequests._sum.totalAmount || 0
        const monthlyPOTotal = monthlyPOSpending._sum.totalAmount || 0
        const monthlySpending = monthlyRequestSpending + monthlyPOTotal

        const budget = dept.budget || 0 // Use actual budget or 0 for consistency
        const budgetUtilization = budget > 0 ? (monthlySpending / budget) * 100 : 0

        return {
          id: dept.id,
          code: dept.code,
          name: dept.name,
          description: dept.description,
          budget: dept.budget, // Use actual budget value
          status: dept.status,
          manager: dept.manager,
          metrics: {
            userCount: dept._count.users,
            activeUsers: activeUserCount,
            monthlySpending,
            budgetUtilization: Math.round(budgetUtilization * 100) / 100,
            requestCount
          }
        }
      })
    )

    return NextResponse.json({
      departments: departmentsWithMetrics,
      total: departmentsWithMetrics.length
    })

  } catch (error) {
    console.error('Error fetching departments overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch departments overview' },
      { status: 500 }
    )
  }
}
