import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { autoAssignManagerToDepartment } from '@/lib/manager-assignment'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all departments with their relationships
    const departments = await prisma.department.findMany({
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            code: true
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

        const monthlyPOSpending = await prisma.purchaseOrder.aggregate({
          where: {
            status: { in: ['ORDERED', 'RECEIVED'] },
            createdAt: { gte: currentMonth },
            createdBy: { departmentId: dept.id }
          },
          _sum: { totalAmount: true }
        })

        const monthlySpending = monthlyRequestSpending + (monthlyPOSpending._sum.totalAmount || 0)
        const budgetUtilization = dept.budget ? (monthlySpending / dept.budget) * 100 : 0

        return {
          ...dept,
          metrics: {
            requestCount,
            monthlySpending,
            budgetUtilization: Math.round(budgetUtilization * 100) / 100,
            activeUsers: dept.users.filter(u => u.status === 'ACTIVE').length
          }
        }
      })
    )

    return NextResponse.json({
      departments: departmentsWithMetrics,
      total: departments.length
    })

  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, name, description, parentId, managerId, budget } = body

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existingDept = await prisma.department.findUnique({
      where: { code }
    })

    if (existingDept) {
      return NextResponse.json(
        { error: 'Department code already exists' },
        { status: 409 }
      )
    }

    // Validate manager exists and is a manager
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId }
      })

      if (!manager || manager.role !== 'MANAGER') {
        return NextResponse.json(
          { error: 'Invalid manager selected' },
          { status: 400 }
        )
      }
    }

    // Create department
    const department = await prisma.department.create({
      data: {
        code,
        name,
        description,
        parentId,
        managerId,
        budget: budget ? parseFloat(budget) : null
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    // If no manager was explicitly assigned, try automatic assignment
    let managerAssignmentResult = null
    if (!managerId) {
      try {
        managerAssignmentResult = await autoAssignManagerToDepartment(department.id)

        // If a manager was automatically assigned, fetch updated department data
        if (managerAssignmentResult.success && managerAssignmentResult.action === 'ASSIGNED') {
          const updatedDepartment = await prisma.department.findUnique({
            where: { id: department.id },
            include: {
              manager: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              parent: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          })

          return NextResponse.json({
            ...updatedDepartment,
            managerAssignment: managerAssignmentResult
          }, { status: 201 })
        }
      } catch (error) {
        console.error('Error in automatic manager assignment:', error)
        // Continue without failing the department creation
      }
    }

    return NextResponse.json({
      ...department,
      managerAssignment: managerAssignmentResult
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating department:', error)
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    )
  }
}
