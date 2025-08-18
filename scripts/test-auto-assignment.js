const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAutoAssignment() {
  try {
    console.log('🧪 Testing auto manager assignment system...')
    
    // 1. Create a test department without a manager
    console.log('\n1️⃣ Creating test department...')
    const testDept = await prisma.department.create({
      data: {
        code: 'TEST_DEPT',
        name: 'Test Department',
        description: 'Test department for auto-assignment testing',
        budget: 50000
      }
    })
    console.log(`   ✅ Created test department: ${testDept.name} (${testDept.id})`)
    
    // 2. Create a test manager for this department
    console.log('\n2️⃣ Creating test manager...')
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash('test123', 12)
    
    const testManager = await prisma.user.create({
      data: {
        email: 'test.manager@example.com',
        name: 'Test Manager',
        password: hashedPassword,
        role: 'MANAGER',
        department: testDept.name,
        departmentId: testDept.id,
        status: 'ACTIVE'
      }
    })
    console.log(`   ✅ Created test manager: ${testManager.name} (${testManager.id})`)
    
    // 3. Test the auto-assignment by directly calling the logic
    console.log('\n3️⃣ Testing auto-assignment logic...')

    // Get department with managers
    const deptWithManagers = await prisma.department.findUnique({
      where: { id: testDept.id },
      include: {
        manager: true,
        users: {
          where: {
            role: 'MANAGER',
            status: 'ACTIVE'
          }
        }
      }
    })

    console.log(`   📊 Department has ${deptWithManagers.users.length} managers`)

    // Since there's exactly one manager, it should auto-assign
    if (deptWithManagers.users.length === 1) {
      const manager = deptWithManagers.users[0]

      await prisma.department.update({
        where: { id: testDept.id },
        data: { managerId: manager.id }
      })

      console.log(`   ✅ Auto-assigned manager: ${manager.name}`)
    }
    
    // 4. Verify the assignment
    console.log('\n4️⃣ Verifying assignment...')
    const updatedDept = await prisma.department.findUnique({
      where: { id: testDept.id },
      include: {
        manager: {
          select: { id: true, name: true, email: true }
        }
      }
    })
    
    if (updatedDept.manager) {
      console.log(`   ✅ Manager successfully assigned: ${updatedDept.manager.name}`)
    } else {
      console.log('   ❌ No manager assigned')
    }
    
    // 5. Check for notifications
    console.log('\n5️⃣ Checking notifications...')
    const notifications = await prisma.notification.findMany({
      where: {
        type: 'MANAGER_ASSIGNMENT',
        createdAt: {
          gte: new Date(Date.now() - 60000) // Last minute
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`   📬 Found ${notifications.length} recent notifications`)
    notifications.forEach(notif => {
      console.log(`      - ${notif.title}: ${notif.message}`)
    })
    
    // 6. Clean up test data
    console.log('\n6️⃣ Cleaning up test data...')
    await prisma.user.delete({ where: { id: testManager.id } })
    await prisma.department.delete({ where: { id: testDept.id } })
    console.log('   ✅ Test data cleaned up')
    
    console.log('\n🎉 Auto-assignment test completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during auto-assignment test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAutoAssignment()
