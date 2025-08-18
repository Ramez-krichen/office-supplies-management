const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testApprovalFix() {
  console.log('🧪 Testing Approval Button Fix')
  console.log('=' .repeat(50))

  try {
    // 1. Check if there are pending requests
    const pendingRequests = await prisma.request.findMany({
      where: { status: 'PENDING' },
      include: {
        items: true,
        requester: true,
        approvals: {
          include: {
            approver: true
          }
        }
      },
      take: 3
    })

    console.log(`\n📋 Found ${pendingRequests.length} pending requests`)

    if (pendingRequests.length === 0) {
      console.log('⚠️  No pending requests found. Creating a test request...')
      
      // Find a user to create a request
      const user = await prisma.user.findFirst({
        where: { role: 'EMPLOYEE' }
      })
      
      if (!user) {
        console.log('❌ No employee user found to create test request')
        return
      }

      // Create a test request
      const testRequest = await prisma.request.create({
        data: {
          title: 'Test Request for Approval Fix',
          description: 'This is a test request to verify approval functionality',
          department: user.department || 'IT',
          priority: 'MEDIUM',
          status: 'PENDING',
          requesterId: user.id,
          totalAmount: 50.00,
          items: {
            create: [
              {
                name: 'Test Item',
                description: 'Test item for approval',
                quantity: 1,
                unitPrice: 50.00,
                totalPrice: 50.00,
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

      console.log(`✅ Created test request: ${testRequest.title} (ID: ${testRequest.id})`)
      pendingRequests.push(testRequest)
    }

    // 2. Check if there are managers/admins who can approve
    const approvers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MANAGER'] }
      }
    })

    console.log(`\n👥 Found ${approvers.length} users who can approve requests:`)
    approvers.forEach(approver => {
      console.log(`   - ${approver.name} (${approver.role}) - ${approver.email}`)
    })

    // 3. Ensure approval records exist for pending requests
    for (const request of pendingRequests) {
      const existingApprovals = await prisma.approval.findMany({
        where: { requestId: request.id }
      })

      if (existingApprovals.length === 0) {
        // Create approval record
        const manager = approvers.find(a => a.role === 'MANAGER') || approvers[0]
        if (manager) {
          await prisma.approval.create({
            data: {
              requestId: request.id,
              approverId: manager.id,
              level: 1,
              status: 'PENDING'
            }
          })
          console.log(`✅ Created approval record for request ${request.id}`)
        }
      }
    }

    console.log('\n🎯 Testing Instructions:')
    console.log('1. Open browser to http://localhost:3000')
    console.log('2. Login as Admin: admin@example.com / password123')
    console.log('   OR Login as Manager: manager@example.com / password123')
    console.log('3. Go to Admin Dashboard or Manager Dashboard')
    console.log('4. Look for "Pending Approvals" section')
    console.log('5. Click green "Approve" button on any request')
    console.log('6. Check browser console for logs (should show session check)')
    console.log('7. Verify no "Failed to fetch" errors occur')
    console.log('8. Check that success toast appears')
    console.log('9. Verify request status updates')

    console.log('\n📝 Available Test Requests:')
    pendingRequests.forEach((request, index) => {
      console.log(`\n${index + 1}. ${request.title}`)
      console.log(`   ID: ${request.id}`)
      console.log(`   Requester: ${request.requester.name}`)
      console.log(`   Department: ${request.department}`)
      console.log(`   Total Amount: $${request.totalAmount}`)
      console.log(`   Status: ${request.status}`)
    })

    console.log('\n✅ Test setup complete!')
    console.log('The approval buttons should now work without "Failed to fetch" errors.')
    console.log('The fixes include:')
    console.log('- Session validation before API calls')
    console.log('- Proper credentials handling with same-origin')
    console.log('- Better error handling for 401/403 responses')
    console.log('- Network error detection and user-friendly messages')

  } catch (error) {
    console.error('❌ Error setting up test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testApprovalFix()
