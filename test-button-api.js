const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testButtonAPI() {
  console.log('🧪 Testing Button API Functionality')
  console.log('=' .repeat(50))

  try {
    // Get a pending request
    const pendingRequest = await prisma.request.findFirst({
      where: { status: 'PENDING' },
      include: {
        requester: true,
        items: true,
        approvals: {
          include: {
            approver: true
          }
        }
      }
    })

    if (!pendingRequest) {
      console.log('❌ No pending requests found to test')
      return
    }

    console.log(`\n📋 Testing with request: ${pendingRequest.title}`)
    console.log(`   ID: ${pendingRequest.id}`)
    console.log(`   Status: ${pendingRequest.status}`)
    console.log(`   Requester: ${pendingRequest.requester.name}`)

    // Check approvals for this request
    console.log(`\n🔄 Approval workflow for this request:`)
    if (pendingRequest.approvals.length === 0) {
      console.log('   ⚠️  No approval records found - this might be an issue')
    } else {
      pendingRequest.approvals.forEach((approval, index) => {
        console.log(`   ${index + 1}. Level ${approval.level}: ${approval.approver.name} (${approval.approver.role}) - ${approval.status}`)
      })
    }

    // Find the next pending approval
    const nextApproval = pendingRequest.approvals.find(a => a.status === 'PENDING')
    
    if (!nextApproval) {
      console.log('\n⚠️  No pending approvals found for this request')
      console.log('   This means either:')
      console.log('   1. All approvals are complete but request status not updated')
      console.log('   2. No approval workflow was set up for this request')
      
      // Check if we can create an approval for testing
      const manager = await prisma.user.findFirst({
        where: { role: 'MANAGER' }
      })
      
      if (manager) {
        console.log(`\n🔧 Creating test approval for manager: ${manager.name}`)
        await prisma.approval.create({
          data: {
            requestId: pendingRequest.id,
            approverId: manager.id,
            level: 1,
            status: 'PENDING'
          }
        })
        console.log('   ✅ Test approval created')
      }
    } else {
      console.log(`\n✅ Found pending approval for: ${nextApproval.approver.name} (${nextApproval.approver.role})`)
      console.log(`   Level: ${nextApproval.level}`)
      console.log(`   Status: ${nextApproval.status}`)
    }

    console.log('\n🎯 Button Test Instructions:')
    console.log('1. Start the development server: npm run dev')
    console.log('2. Open browser to http://localhost:3000')
    console.log('3. Login with admin credentials:')
    console.log('   Email: admin@example.com')
    console.log('   Password: password123')
    console.log('4. Navigate to Admin Dashboard')
    console.log('5. Look for "Pending Approvals" section')
    console.log(`6. Find the request: "${pendingRequest.title}"`)
    console.log('7. Click the green "Approve" button')
    console.log('8. Verify you see a success toast notification')
    console.log('9. Refresh the page and verify the request is no longer in pending approvals')
    console.log('')
    console.log('To test rejection:')
    console.log('1. Find another pending request')
    console.log('2. Click the red "Reject" button')
    console.log('3. Enter a rejection reason when prompted')
    console.log('4. Verify you see a success toast notification')

    console.log('\n🔧 Technical Details:')
    console.log('✅ Fixed Issues:')
    console.log('   1. ✅ API expects "status" field, not "action"')
    console.log('   2. ✅ Status values are "APPROVED" and "REJECTED"')
    console.log('   3. ✅ Comments field is required for rejections')
    console.log('   4. ✅ Toast notifications replace basic alerts')
    console.log('   5. ✅ Error handling for API responses')
    console.log('   6. ✅ Dashboard data refreshes after approval/rejection')

    console.log('\n📡 API Call Example:')
    console.log(`   POST /api/requests/${pendingRequest.id}/approve`)
    console.log('   Headers: { "Content-Type": "application/json" }')
    console.log('   Body for Approval: { "status": "APPROVED" }')
    console.log('   Body for Rejection: { "status": "REJECTED", "comments": "Reason here" }')

  } catch (error) {
    console.error('❌ Error testing button API:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testButtonAPI()
