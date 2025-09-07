import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Manual Manager Assignment Trigger Started...')

    // Get all active departments with their managers
    const departments = await prisma.department.findMany({
      where: { status: 'ACTIVE' },
      include: {
        manager: {
          select: { id: true, name: true, email: true }
        },
        users: {
          where: {
            role: 'MANAGER',
            status: 'ACTIVE'
          },
          select: {
            id: true,
            name: true,
            email: true,
            departmentId: true
          }
        }
      }
    })

    let notificationsCreated = 0
    let autoAssigned = 0
    const results = []

    for (const dept of departments) {
      console.log(`🏢 Processing ${dept.name} (${dept.code})`)
      console.log(`   Current Manager: ${dept.manager ? dept.manager.name : 'None'}`)
      console.log(`   Available Managers: ${dept.users.length}`)

      const result = {
        departmentId: dept.id,
        departmentName: dept.name,
        currentManager: dept.manager?.name || null,
        availableManagers: dept.users.length,
        action: 'NO_ACTION',
        message: 'No action needed'
      }

      if (dept.users.length === 1 && !dept.managerId) {
        // Auto-assign single manager
        const manager = dept.users[0]
        
        await prisma.department.update({
          where: { id: dept.id },
          data: { managerId: manager.id }
        })

        await prisma.auditLog.create({
          data: {
            action: 'MANAGER_AUTO_ASSIGNED',
            entity: 'Department',
            entityId: dept.id,
            performedBy: session.user.id,
            details: `Manager ${manager.name} automatically assigned to department ${dept.name} via manual trigger`
          }
        })

        result.action = 'AUTO_ASSIGNED'
        result.message = `Auto-assigned ${manager.name}`
        autoAssigned++

      } else if (dept.users.length > 1) {
        // Check if notification already exists
        const existingNotification = await prisma.notification.findFirst({
          where: {
            type: 'MANAGER_ASSIGNMENT',
            data: {
              contains: `"departmentId":"${dept.id}"`
            },
            status: 'UNREAD'
          }
        })

        if (!existingNotification) {
          const notificationData = {
            departmentId: dept.id,
            departmentName: dept.name,
            departmentCode: dept.code,
            scenario: 'MULTIPLE_MANAGERS',
            availableManagers: dept.users,
            currentManagerId: dept.managerId,
            currentManagerName: dept.manager?.name || null
          }

          const message = dept.managerId
            ? `Department "${dept.name}" has ${dept.users.length} active managers but only "${dept.manager?.name}" is assigned as the primary manager. Please review and reassign if needed.`
            : `Department "${dept.name}" has ${dept.users.length} managers. Please select which manager should be assigned to this department.`

          await prisma.notification.create({
            data: {
              type: 'MANAGER_ASSIGNMENT',
              title: `Multiple Managers in ${dept.name}`,
              message,
              data: JSON.stringify(notificationData),
              priority: 'HIGH',
              targetRole: 'ADMIN'
            }
          })

          result.action = 'NOTIFICATION_CREATED'
          result.message = `Created notification for ${dept.users.length} managers`
          notificationsCreated++
        } else {
          result.action = 'NOTIFICATION_EXISTS'
          result.message = 'Notification already exists'
        }

      } else if (dept.users.length === 0) {
        // Check if notification already exists for no managers
        const existingNotification = await prisma.notification.findFirst({
          where: {
            type: 'MANAGER_ASSIGNMENT',
            data: {
              contains: `"departmentId":"${dept.id}"`
            },
            status: 'UNREAD'
          }
        })

        if (!existingNotification) {
          const notificationData = {
            departmentId: dept.id,
            departmentName: dept.name,
            departmentCode: dept.code,
            scenario: 'NO_MANAGERS',
            availableManagers: []
          }

          await prisma.notification.create({
            data: {
              type: 'MANAGER_ASSIGNMENT',
              title: `No Manager Available for ${dept.name}`,
              message: `Department "${dept.name}" has no managers. Please create a new manager or reassign an existing manager from another department.`,
              data: JSON.stringify(notificationData),
              priority: 'HIGH',
              targetRole: 'ADMIN'
            }
          })

          result.action = 'NOTIFICATION_CREATED'
          result.message = 'Created notification for no managers'
          notificationsCreated++
        } else {
          result.action = 'NOTIFICATION_EXISTS'
          result.message = 'Notification already exists'
        }
      }

      results.push(result)
    }

    // Create audit log for manual trigger
    await prisma.auditLog.create({
      data: {
        action: 'MANUAL_MANAGER_ASSIGNMENT_TRIGGER',
        entity: 'System',
        entityId: 'MANUAL_TRIGGER',
        performedBy: session.user.id,
        details: `Manual manager assignment trigger: ${autoAssigned} auto-assigned, ${notificationsCreated} notifications created`
      }
    })

    console.log('✅ Manual Manager Assignment Trigger Completed')

    return NextResponse.json({
      success: true,
      summary: {
        totalDepartments: departments.length,
        autoAssigned,
        notificationsCreated,
        message: `Processed ${departments.length} departments: ${autoAssigned} auto-assigned, ${notificationsCreated} notifications created`
      },
      results
    })

  } catch (error) {
    console.error('❌ Error in manual manager assignment trigger:', error)
    return NextResponse.json(
      { error: 'Failed to trigger manager assignments' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get overview of departments needing attention
    const departments = await prisma.department.findMany({
      where: { status: 'ACTIVE' },
      include: {
        manager: {
          select: { id: true, name: true }
        },
        users: {
          where: {
            role: 'MANAGER',
            status: 'ACTIVE'
          },
          select: { id: true, name: true }
        }
      }
    })

    const analysis = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      currentManager: dept.manager?.name || null,
      availableManagers: dept.users.length,
      needsAttention: dept.users.length !== 1 || !dept.managerId,
      category: dept.users.length === 0 ? 'NO_MANAGERS' : 
                dept.users.length === 1 ? 'SINGLE_MANAGER' : 'MULTIPLE_MANAGERS'
    }))

    const summary = {
      total: departments.length,
      needsAttention: analysis.filter(d => d.needsAttention).length,
      noManagers: analysis.filter(d => d.category === 'NO_MANAGERS').length,
      singleManager: analysis.filter(d => d.category === 'SINGLE_MANAGER').length,
      multipleManagers: analysis.filter(d => d.category === 'MULTIPLE_MANAGERS').length
    }

    return NextResponse.json({
      summary,
      departments: analysis
    })

  } catch (error) {
    console.error('❌ Error getting manager assignment overview:', error)
    return NextResponse.json(
      { error: 'Failed to get overview' },
      { status: 500 }
    )
  }
}