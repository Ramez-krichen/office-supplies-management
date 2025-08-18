const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testApprovalAPI() {
  try {
    console.log('🔍 Testing Approval API...\n')

    // First, let's check if we have any pending requests
    const pendingRequests = await prisma.request.findMany({
      where: { status: 'PENDING' },
      include: {
        requester: {
          select: { name: true, email: true }
        },
        approvals: true
      },
      take: 5
    })

    console.log(`📋 Found ${pendingRequests.length} pending requests:`)
    pendingRequests.forEach((req, index) => {
      console.log(`   ${index + 1}. ${req.title} (ID: ${req.id}) - ${req.requester.name}`)
      console.log(`      Status: ${req.status}, Approvals: ${req.approvals.length}`)
    })

    if (pendingRequests.length === 0) {
      console.log('\n❌ No pending requests found to test with')
      return
    }

    // Get an admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      console.log('\n❌ No admin user found')
      return
    }

    console.log(`\n👤 Using admin user: ${adminUser.name} (${adminUser.email})`)

    // Test the approval logic directly
    const testRequest = pendingRequests[0]
    console.log(`\n🧪 Testing approval for request: ${testRequest.title}`)

    // Check current approvals
    const currentApprovals = await prisma.approval.findMany({
      where: { requestId: testRequest.id }
    })

    console.log(`📝 Current approvals for request ${testRequest.id}:`)
    currentApprovals.forEach(approval => {
      console.log(`   - Approver: ${approval.approverId}, Status: ${approval.status}, Level: ${approval.level}`)
    })

    // Try to find or create an approval for the admin
    let currentApproval = currentApprovals.find(
      approval => approval.status === 'PENDING' && approval.approverId === adminUser.id
    )

    if (!currentApproval) {
      // Find any pending approval
      const anyPendingApproval = currentApprovals.find(
        approval => approval.status === 'PENDING'
      )

      if (anyPendingApproval) {
        console.log(`🔄 Creating/updating approval for admin...`)
        currentApproval = await prisma.approval.upsert({
          where: {
            requestId_approverId_level: {
              requestId: testRequest.id,
              approverId: adminUser.id,
              level: anyPendingApproval.level
            }
          },
          update: {
            status: 'PENDING'
          },
          create: {
            requestId: testRequest.id,
            approverId: adminUser.id,
            level: anyPendingApproval.level,
            status: 'PENDING'
          }
        })
        console.log(`✅ Approval created/updated: ${currentApproval.id}`)
      } else {
        console.log(`🔄 Creating new approval for admin...`)
        currentApproval = await prisma.approval.create({
          data: {
            requestId: testRequest.id,
            approverId: adminUser.id,
            level: 1,
            status: 'PENDING'
          }
        })
        console.log(`✅ New approval created: ${currentApproval.id}`)
      }
    }

    console.log(`\n✅ Test completed successfully!`)
    console.log(`📊 Summary:`)
    console.log(`   - Request ID: ${testRequest.id}`)
    console.log(`   - Admin ID: ${adminUser.id}`)
    console.log(`   - Approval ID: ${currentApproval.id}`)
    console.log(`   - Ready for API test`)

  } catch (error) {
    console.error('❌ Error testing approval API:', error)
    if (error.code) {
      console.error(`   Error code: ${error.code}`)
    }
    if (error.meta) {
      console.error(`   Error meta:`, error.meta)
    }
  } finally {
    await prisma.$disconnect()
  }
}

testApprovalAPI()
