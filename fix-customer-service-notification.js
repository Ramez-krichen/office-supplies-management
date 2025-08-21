const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixCustomerServiceNotification() {
  try {
    console.log('🔧 Fixing Customer Service Department Manager Assignment...\n')

    // Find Customer Service department
    const customerServiceDept = await prisma.department.findFirst({
      where: { 
        OR: [
          { name: { contains: 'Customer Service' } },
          { code: { contains: 'CUSTOMER' } }
        ]
      }
    })

    if (!customerServiceDept) {
      console.log('❌ Customer Service department not found')
      return
    }

    console.log('📋 Found Customer Service Department:')
    console.log('   ID:', customerServiceDept.id)
    console.log('   Name:', customerServiceDept.name)
    console.log('   Code:', customerServiceDept.code)
    console.log('')

    // Find all managers with Customer Service in their department
    const customerServiceManagers = await prisma.user.findMany({
      where: {
        role: 'MANAGER',
        department: { contains: 'Customer Service' }
      }
    })

    console.log(`📋 Found ${customerServiceManagers.length} managers with Customer Service department:`)
    customerServiceManagers.forEach((manager, index) => {
      console.log(`   ${index + 1}. ${manager.name} (${manager.email})`)
      console.log(`      Status: ${manager.status}`)
      console.log(`      Department ID: ${manager.departmentId}`)
      console.log(`      Department: ${manager.department}`)
      console.log('')
    })

    // Update departmentId for managers who don't have it set correctly
    let updatedCount = 0
    for (const manager of customerServiceManagers) {
      if (manager.departmentId !== customerServiceDept.id) {
        await prisma.user.update({
          where: { id: manager.id },
          data: { departmentId: customerServiceDept.id }
        })
        console.log(`✅ Updated ${manager.name} departmentId to ${customerServiceDept.id}`)
        updatedCount++
      }
    }

    if (updatedCount > 0) {
      console.log(`\n🔄 Updated ${updatedCount} manager(s) departmentId`)
    }

    // Now check if we have multiple active managers
    const activeManagers = await prisma.user.findMany({
      where: {
        role: 'MANAGER',
        status: 'ACTIVE',
        departmentId: customerServiceDept.id
      }
    })

    console.log(`\n📊 Active managers in Customer Service: ${activeManagers.length}`)
    activeManagers.forEach((manager, index) => {
      console.log(`   ${index + 1}. ${manager.name} - ${manager.status}`)
    })

    // If we have multiple managers, create notification
    if (activeManagers.length > 1) {
      // Check if notification already exists
      const existingNotification = await prisma.notification.findFirst({
        where: {
          type: 'MANAGER_ASSIGNMENT',
          data: {
            contains: `"departmentId":"${customerServiceDept.id}"`
          },
          status: 'UNREAD'
        }
      })

      if (!existingNotification) {
        const notificationData = {
          departmentId: customerServiceDept.id,
          departmentName: customerServiceDept.name,
          departmentCode: customerServiceDept.code,
          scenario: 'MULTIPLE_MANAGERS',
          availableManagers: activeManagers.map(m => ({
            id: m.id,
            name: m.name,
            email: m.email
          }))
        }

        await prisma.notification.create({
          data: {
            type: 'MANAGER_ASSIGNMENT',
            title: `Multiple Managers in ${customerServiceDept.name}`,
            message: `Department "${customerServiceDept.name}" has ${activeManagers.length} managers. Please select which manager should be assigned to this department.`,
            data: JSON.stringify(notificationData),
            priority: 'HIGH',
            targetRole: 'ADMIN'
          }
        })

        console.log(`\n✅ Created notification for ${customerServiceDept.name} (${activeManagers.length} managers available)`)
      } else {
        console.log(`\n📢 Notification already exists for ${customerServiceDept.name}`)
      }
    } else if (activeManagers.length === 1) {
      // Auto-assign the single manager if not already assigned
      const singleManager = activeManagers[0]
      if (customerServiceDept.managerId !== singleManager.id) {
        await prisma.department.update({
          where: { id: customerServiceDept.id },
          data: { managerId: singleManager.id }
        })

        await prisma.auditLog.create({
          data: {
            action: 'MANAGER_AUTO_ASSIGNED',
            entity: 'Department',
            entityId: customerServiceDept.id,
            performedBy: 'SYSTEM',
            details: `Manager ${singleManager.name} automatically assigned to department ${customerServiceDept.name}`
          }
        })

        console.log(`\n✅ Auto-assigned ${singleManager.name} to ${customerServiceDept.name}`)
      } else {
        console.log(`\n✅ ${singleManager.name} is already assigned to ${customerServiceDept.name}`)
      }
    } else {
      console.log(`\n⚠️  No active managers found in ${customerServiceDept.name}`)
    }

    console.log('\n🎯 Customer Service notification fix completed!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCustomerServiceNotification()