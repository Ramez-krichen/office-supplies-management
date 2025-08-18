import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'
import { autoAssignManagerToDepartment } from '@/lib/manager-assignment'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { departmentIds, action } = body

    if (action !== 'auto-assign-all') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    let targetDepartments: string[] = []

    if (departmentIds && Array.isArray(departmentIds)) {
      // Process specific departments
      targetDepartments = departmentIds
    } else {
      // Process all departments without managers
      const departments = await prisma.department.findMany({
        where: {
          managerId: null,
          status: 'ACTIVE'
        },
        select: { id: true }
      })
      targetDepartments = departments.map(d => d.id)
    }

    const results = []
    let successCount = 0
    let notificationCount = 0
    let errorCount = 0

    // Process each department
    for (const departmentId of targetDepartments) {
      try {
        const result = await autoAssignManagerToDepartment(departmentId)
        results.push({
          departmentId,
          ...result
        })

        if (result.success) {
          if (result.action === 'ASSIGNED') {
            successCount++
          } else if (result.action === 'NOTIFICATION_SENT') {
            notificationCount++
          }
        } else {
          errorCount++
        }
      } catch (error) {
        console.error(`Error processing department ${departmentId}:`, error)
        results.push({
          departmentId,
          success: false,
          action: 'NO_ACTION',
          message: 'Processing error'
        })
        errorCount++
      }
    }

    // Create summary audit log
    await prisma.auditLog.create({
      data: {
        action: 'BULK_MANAGER_ASSIGNMENT',
        entity: 'Department',
        entityId: 'BULK',
        performedBy: session.user.id,
        details: `Processed ${targetDepartments.length} departments: ${successCount} assigned, ${notificationCount} notifications sent, ${errorCount} errors`
      }
    })

    return NextResponse.json({
      success: true,
      summary: {
        total: targetDepartments.length,
        assigned: successCount,
        notificationsSent: notificationCount,
        errors: errorCount
      },
      results
    })

  } catch (error) {
    console.error('Error in bulk manager assignment:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk manager assignment' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get departments without managers
    const departmentsWithoutManagers = await prisma.department.findMany({
      where: {
        managerId: null,
        status: 'ACTIVE'
      },
      include: {
        users: {
          where: {
            role: 'MANAGER',
            status: 'ACTIVE'
          },
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

    // Categorize departments
    const analysis = departmentsWithoutManagers.map(dept => {
      const managerCount = dept.users.length
      let category: 'NO_MANAGERS' | 'SINGLE_MANAGER' | 'MULTIPLE_MANAGERS'
      let canAutoAssign = false

      if (managerCount === 0) {
        category = 'NO_MANAGERS'
      } else if (managerCount === 1) {
        category = 'SINGLE_MANAGER'
        canAutoAssign = true
      } else {
        category = 'MULTIPLE_MANAGERS'
      }

      return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        managerCount,
        category,
        canAutoAssign,
        availableManagers: dept.users
      }
    })

    const summary = {
      total: departmentsWithoutManagers.length,
      canAutoAssign: analysis.filter(d => d.canAutoAssign).length,
      needsAttention: analysis.filter(d => !d.canAutoAssign).length,
      noManagers: analysis.filter(d => d.category === 'NO_MANAGERS').length,
      multipleManagers: analysis.filter(d => d.category === 'MULTIPLE_MANAGERS').length
    }

    return NextResponse.json({
      summary,
      departments: analysis
    })

  } catch (error) {
    console.error('Error analyzing departments for manager assignment:', error)
    return NextResponse.json(
      { error: 'Failed to analyze departments' },
      { status: 500 }
    )
  }
}
