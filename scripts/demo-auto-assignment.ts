import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function demoAutoAssignment() {
  try {
    console.log('🎬 Demo: Manager Auto-Assignment System\n')

    // Step 1: Find a department that currently has a manager
    const departmentWithManager = await prisma.department.findFirst({
      where: {
        managerId: { not: null }
      },
      include: {
        manager: true,
        users: {
          where: { role: 'MANAGER', status: 'ACTIVE' },
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!departmentWithManager) {
      console.log('❌ No departments with managers found for demo')
      return
    }

    console.log(`📁 Selected department: ${departmentWithManager.name}`)
    console.log(`👤 Current manager: ${departmentWithManager.manager?.name}`)
    console.log(`📊 Available managers in dept: ${departmentWithManager.users.length}\n`)

    // Step 2: Remove the manager assignment to simulate the scenario
    console.log('🔄 Step 1: Removing manager assignment to simulate new department...')
    await prisma.department.update({
      where: { id: departmentWithManager.id },
      data: { managerId: null }
    })
    console.log('✅ Manager assignment removed\n')

    // Step 3: Trigger auto-assignment using our API
    console.log('🤖 Step 2: Triggering auto-assignment logic...')
    
    // Simulate the auto-assignment logic
    const updatedDept = await prisma.department.findUnique({
      where: { id: departmentWithManager.id },
      include: {
        users: {
          where: { role: 'MANAGER', status: 'ACTIVE' },
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!updatedDept) {
      console.log('❌ Department not found')
      return
    }

    const availableManagers = updatedDept.users
    console.log(`📊 Found ${availableManagers.length} available managers`)

    if (availableManagers.length === 1) {
      // Auto-assign the single manager
      const manager = availableManagers[0]
      
      await prisma.department.update({
        where: { id: departmentWithManager.id },
        data: { managerId: manager.id }
      })

      // Get admin for audit log
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
      
      if (admin) {
        await prisma.auditLog.create({
          data: {
            action: 'MANAGER_AUTO_ASSIGNED',
            entity: 'Department',
            entityId: departmentWithManager.id,
            performedBy: admin.id,
            details: `Manager ${manager.name} automatically assigned to department ${departmentWithManager.name} (Demo)`
          }
        })
      }

      console.log(`✅ AUTO-ASSIGNED: ${manager.name} → ${departmentWithManager.name}`)
      console.log('🎯 Result: Single manager was automatically assigned!')

    } else if (availableManagers.length > 1) {
      // Create notification for multiple managers
      const notificationData = {
        departmentId: departmentWithManager.id,
        departmentName: departmentWithManager.name,
        departmentCode: departmentWithManager.code,
        scenario: 'MULTIPLE_MANAGERS',
        availableManagers
      }

      await prisma.notification.create({
        data: {
          type: 'MANAGER_ASSIGNMENT',
          title: `Multiple Managers Available for ${departmentWithManager.name}`,
          message: `Department "${departmentWithManager.name}" has ${availableManagers.length} managers. Please select which manager should be assigned to this department.`,
          data: JSON.stringify(notificationData),
          priority: 'HIGH',
          targetRole: 'ADMIN'
        }
      })

      console.log(`📢 NOTIFICATION CREATED: Multiple managers (${availableManagers.length}) available`)
      console.log('🎯 Result: Admin notification sent for manual selection!')

    } else {
      // Create notification for no managers
      const notificationData = {
        departmentId: departmentWithManager.id,
        departmentName: departmentWithManager.name,
        departmentCode: departmentWithManager.code,
        scenario: 'NO_MANAGERS',
        availableManagers: []
      }

      await prisma.notification.create({
        data: {
          type: 'MANAGER_ASSIGNMENT',
          title: `No Manager Available for ${departmentWithManager.name}`,
          message: `Department "${departmentWithManager.name}" has no managers. Please create a new manager or reassign an existing manager from another department.`,
          data: JSON.stringify(notificationData),
          priority: 'HIGH',
          targetRole: 'ADMIN'
        }
      })

      console.log(`📢 NOTIFICATION CREATED: No managers available`)
      console.log('🎯 Result: Admin notification sent to create/reassign managers!')
    }

    console.log('\n🎉 Demo completed successfully!')
    console.log('\n💡 To see the results:')
    console.log('   1. Go to http://localhost:3000/admin')
    console.log('   2. Look for the notification bell icon (🔔) in the header')
    console.log('   3. Click it to see manager assignment notifications')
    console.log('   4. Or visit: http://localhost:3000/admin/test-manager-assignment')

  } catch (error) {
    console.error('Error in demo:', error)
  } finally {
    await prisma.$disconnect()
  }
}

demoAutoAssignment()
