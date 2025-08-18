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
    const where: any = {
      status: 'ACTIVE'
    }

    // For managers and employees, only show their own department
    if ((userRole === 'MANAGER' || userRole === 'EMPLOYEE') && user.department) {
      where.name = user.department
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

    // Format departments with additional info
    const departmentList = await Promise.all(
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

        return {
          id: dept.id,
          value: dept.name,
          label: dept.name,
          code: dept.code,
          description: dept.description,
          userCount: dept._count.users,
          activeUserCount,
          requestCount,
          manager: dept.manager
        }
      })
    )

    const validDepartments = departmentList

    return NextResponse.json({
      departments: validDepartments,
      total: validDepartments.length
    })

  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    )
  }
}
