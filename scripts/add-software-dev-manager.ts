import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function addSoftwareDevManager() {
  try {
    console.log('👨‍💻 Adding manager for Software Development department...\n')

    // Find the Software Development department
    const softwareDevDept = await prisma.department.findFirst({
      where: { code: 'IT_DEV' }
    })

    if (!softwareDevDept) {
      console.log('❌ Software Development department not found')
      return
    }

    console.log(`📁 Found department: ${softwareDevDept.name} (${softwareDevDept.code})`)

    // Check if manager already exists
    const existingManager = await prisma.user.findFirst({
      where: {
        departmentId: softwareDevDept.id,
        role: 'MANAGER'
      }
    })

    if (existingManager) {
      console.log(`✅ Manager already exists: ${existingManager.name}`)
      
      // Auto-assign if not already assigned
      if (!softwareDevDept.managerId) {
        await prisma.department.update({
          where: { id: softwareDevDept.id },
          data: { managerId: existingManager.id }
        })
        console.log(`🔄 Auto-assigned ${existingManager.name} to ${softwareDevDept.name}`)
      }
      return
    }

    // Create a new manager for Software Development
    const hashedPassword = await bcrypt.hash('manager123', 12)
    
    const newManager = await prisma.user.create({
      data: {
        email: 'manager.dev@company.com',
        name: 'Dev Manager',
        password: hashedPassword,
        role: 'MANAGER',
        department: softwareDevDept.name,
        departmentId: softwareDevDept.id,
        status: 'ACTIVE'
      }
    })

    console.log(`✅ Created new manager: ${newManager.name} (${newManager.email})`)

    // Auto-assign the manager to the department
    await prisma.department.update({
      where: { id: softwareDevDept.id },
      data: { managerId: newManager.id }
    })

    console.log(`🔄 Auto-assigned ${newManager.name} to ${softwareDevDept.name}`)

    // Create audit log
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    if (admin) {
      await prisma.auditLog.create({
        data: {
          action: 'MANAGER_CREATED_AND_ASSIGNED',
          entity: 'Department',
          entityId: softwareDevDept.id,
          performedBy: admin.id,
          details: `Manager ${newManager.name} created and assigned to department ${softwareDevDept.name}`
        }
      })
    }

    console.log('\n🎉 Software Development department now has a manager!')
    console.log('\n💡 Login credentials for the new manager:')
    console.log(`   Email: manager.dev@company.com`)
    console.log(`   Password: manager123`)

    // Update notification if it exists
    const notification = await prisma.notification.findFirst({
      where: {
        type: 'MANAGER_ASSIGNMENT',
        data: { contains: 'IT_DEV' },
        status: 'UNREAD'
      }
    })

    if (notification) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { 
          status: 'DISMISSED',
          dismissedAt: new Date()
        }
      })
      console.log('📢 Dismissed related notification')
    }

  } catch (error) {
    console.error('Error adding Software Development manager:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSoftwareDevManager()
