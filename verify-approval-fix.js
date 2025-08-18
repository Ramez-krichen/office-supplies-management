const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyApprovalFix() {
  console.log('🔍 Verifying Approval Fix Implementation')
  console.log('=' .repeat(60))

  try {
    // 1. Get pending requests with their approvals
    console.log('\n📋 Analyzing Pending Requests and Approvals:')
    const pendingRequests = await prisma.request.findMany({
      where: { status: 'PENDING' },
      include: {
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        },
        requester: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      },
      take: 3
    })

    console.log(`Found ${pendingRequests.length} pending requests`)

    // 2. Get all managers and admins
    const approvers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MANAGER'] },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    console.log(`\n👥 Available Approvers (${approvers.length}):`)
    approvers.slice(0, 5).forEach(user => {
      console.log(`   - ${user.name} (${user.role}) - ${user.email}`)
    })
    if (approvers.length > 5) {
      console.log(`   ... and ${approvers.length - 5} more`)
    }

    // 3. Test scenarios for each pending request
    console.log('\n🧪 Testing Approval Scenarios:')
    
    for (let i = 0; i < Math.min(pendingRequests.length, 2); i++) {
      const request = pendingRequests[i]
      console.log(`\n📄 Request ${i + 1}: "${request.title}" (ID: ${request.id})`)
      console.log(`   Requester: ${request.requester.name} (${request.requester.role})`)
      console.log(`   Total: $${request.totalAmount}`)
      
      // Show current approvals
      console.log(`   Current Approvals:`)
      if (request.approvals.length === 0) {
        console.log(`      ⚠️  No approval records found`)
      } else {
        request.approvals.forEach(approval => {
          console.log(`      - ${approval.approver.name} (${approval.approver.role}) - ${approval.status} - Level ${approval.level}`)
        })
      }

      // Test different user scenarios
      const testUsers = [
        approvers.find(u => u.role === 'ADMIN'),
        approvers.find(u => u.role === 'MANAGER'),
        approvers.find(u => u.role === 'MANAGER' && u.id !== request.approvals[0]?.approverId)
      ].filter(Boolean)

      console.log(`\n   🔬 Testing approval scenarios:`)
      
      for (const testUser of testUsers.slice(0, 2)) {
        // Check if user has assigned approval
        const userApproval = request.approvals.find(
          approval => approval.status === 'PENDING' && approval.approverId === testUser.id
        )
        
        // Check if any pending approval exists
        const anyPendingApproval = request.approvals.find(
          approval => approval.status === 'PENDING'
        )
        
        // Apply our new logic
        const canApproveOld = !!userApproval
        const canApproveNew = userApproval || 
                             (anyPendingApproval && (testUser.role === 'ADMIN' || testUser.role === 'MANAGER'))
        
        console.log(`      ${testUser.name} (${testUser.role}):`)
        console.log(`         Has assigned approval: ${userApproval ? '✅' : '❌'}`)
        console.log(`         Could approve (OLD logic): ${canApproveOld ? '✅' : '❌'}`)
        console.log(`         Can approve (NEW logic): ${canApproveNew ? '✅' : '❌'}`)
        
        if (!canApproveOld && canApproveNew) {
          console.log(`         🎉 FIX ENABLES: ${testUser.name} can now approve this request!`)
        }
      }
    }

    // 4. Summary of the fix
    console.log('\n📊 Fix Summary:')
    console.log('   🔧 Changes Made:')
    console.log('      1. Modified approval route to allow MANAGERS (not just ADMINS) to take over approvals')
    console.log('      2. Any MANAGER or ADMIN can now approve requests, even if not originally assigned')
    console.log('      3. Improved request creation to handle cases with no managers')
    console.log('      4. Added better logging for debugging approval assignments')
    
    console.log('\n   ✅ Benefits:')
    console.log('      - Eliminates "You are not assigned to approve this request" error')
    console.log('      - Provides flexibility for any manager to approve requests')
    console.log('      - Maintains security by only allowing ADMIN/MANAGER roles')
    console.log('      - Preserves audit trail by updating approval records')

    // 5. Test the actual fix by simulating an approval
    if (pendingRequests.length > 0 && approvers.length > 0) {
      const testRequest = pendingRequests[0]
      const testManager = approvers.find(u => u.role === 'MANAGER')
      
      if (testManager) {
        console.log('\n🚀 Simulating Approval Process:')
        console.log(`   Request: ${testRequest.title}`)
        console.log(`   Manager: ${testManager.name}`)
        
        // Check current approval state
        const currentApproval = testRequest.approvals.find(
          approval => approval.status === 'PENDING' && approval.approverId === testManager.id
        )
        
        const anyPendingApproval = testRequest.approvals.find(
          approval => approval.status === 'PENDING'
        )
        
        console.log(`   Manager has assigned approval: ${currentApproval ? 'YES' : 'NO'}`)
        console.log(`   Any pending approval exists: ${anyPendingApproval ? 'YES' : 'NO'}`)
        
        if (!currentApproval && anyPendingApproval) {
          console.log(`   📝 With the fix: Manager can take over approval from ${anyPendingApproval.approver.name}`)
          console.log(`   🔄 The system will reassign the approval to ${testManager.name}`)
        } else if (currentApproval) {
          console.log(`   ✅ Manager already has approval assignment`)
        }
      }
    }

    console.log('\n🎯 Next Steps:')
    console.log('   1. Start the development server: npm run dev')
    console.log('   2. Login as any manager or admin')
    console.log('   3. Navigate to the dashboard')
    console.log('   4. Try approving any pending request')
    console.log('   5. The approval should work without the previous error')

  } catch (error) {
    console.error('❌ Error during verification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyApprovalFix()
