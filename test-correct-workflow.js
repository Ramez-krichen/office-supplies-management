const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCorrectWorkflow() {
  console.log('🔄 Testing Correct Approval Workflow')
  console.log('=' .repeat(50))

  try {
    // 1. Create a test request to demonstrate the workflow
    const employee = await prisma.user.findFirst({
      where: { role: 'EMPLOYEE' }
    })
    
    const manager = await prisma.user.findFirst({
      where: { role: 'MANAGER' }
    })
    
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!employee || !manager || !admin) {
      console.log('❌ Missing required users for test')
      return
    }

    console.log(`\n👥 Test Users:`)
    console.log(`   Employee: ${employee.name} (${employee.email})`)
    console.log(`   Manager: ${manager.name} (${manager.email})`)
    console.log(`   Admin: ${admin.name} (${admin.email})`)

    // Create a test request
    const testRequest = await prisma.request.create({
      data: {
        title: 'Test Workflow Request',
        description: 'Testing the correct PENDING → IN_PROGRESS → APPROVED workflow',
        department: employee.department || 'IT',
        priority: 'MEDIUM',
        status: 'PENDING',
        requesterId: employee.id,
        totalAmount: 100.00,
        items: {
          create: [
            {
              name: 'Test Item for Workflow',
              description: 'Test item to verify approval workflow',
              quantity: 1,
              unitPrice: 100.00,
              totalPrice: 100.00,
              category: 'Office Supplies'
            }
          ]
        }
      },
      include: {
        items: true,
        requester: true
      }
    })

    console.log(`\n📋 Created Test Request:`)
    console.log(`   ID: ${testRequest.id}`)
    console.log(`   Title: ${testRequest.title}`)
    console.log(`   Status: ${testRequest.status}`)
    console.log(`   Amount: $${testRequest.totalAmount}`)

    // Create multi-level approval workflow
    const approval1 = await prisma.approval.create({
      data: {
        requestId: testRequest.id,
        approverId: manager.id,
        level: 1,
        status: 'PENDING'
      }
    })

    const approval2 = await prisma.approval.create({
      data: {
        requestId: testRequest.id,
        approverId: admin.id,
        level: 2,
        status: 'PENDING'
      }
    })

    console.log(`\n🔄 Created Approval Workflow:`)
    console.log(`   Level 1: ${manager.name} (${manager.role}) - PENDING`)
    console.log(`   Level 2: ${admin.name} (${admin.role}) - PENDING`)

    console.log(`\n🎯 Expected Workflow:`)
    console.log(`   1. Initial Status: PENDING`)
    console.log(`   2. Manager approves → Status: IN_PROGRESS`)
    console.log(`   3. Admin approves → Status: APPROVED`)
    console.log(`   4. OR any rejection → Status: REJECTED`)

    console.log(`\n🧪 Test the workflow:`)
    console.log(`   1. Login as admin@example.com / password123`)
    console.log(`   2. Go to Admin Dashboard`)
    console.log(`   3. Find the test request: "${testRequest.title}"`)
    console.log(`   4. Click "Approve" as admin (Level 2)`)
    console.log(`   5. Expected: Status should change to IN_PROGRESS (not APPROVED)`)
    console.log(`   6. Then approve Level 1 (manager approval)`)
    console.log(`   7. Expected: Status should change to APPROVED`)

    console.log(`\n📊 Current Database Status:`)
    const statusCounts = await prisma.request.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    statusCounts.forEach(({ status, _count }) => {
      console.log(`   ${status}: ${_count.status}`)
    })

    console.log(`\n✅ Test request created successfully!`)
    console.log(`   Request ID: ${testRequest.id}`)
    console.log(`   Use this to test the corrected workflow.`)

  } catch (error) {
    console.error('❌ Error creating test workflow:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCorrectWorkflow()
