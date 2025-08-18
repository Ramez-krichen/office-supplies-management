const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugApprovalLogic() {
  console.log('🔍 Debugging Approval Logic')
  console.log('=' .repeat(50))

  try {
    // 1. Get a pending request with its approvals
    const pendingRequest = await prisma.request.findFirst({
      where: { status: 'PENDING' },
      include: {
        approvals: {
          include: {
            approver: true
          },
          orderBy: {
            level: 'asc'
          }
        },
        requester: true
      }
    })

    if (!pendingRequest) {
      console.log('❌ No pending requests found')
      return
    }

    console.log(`\n📋 Analyzing Request: ${pendingRequest.title}`)
    console.log(`   ID: ${pendingRequest.id}`)
    console.log(`   Status: ${pendingRequest.status}`)
    console.log(`   Requester: ${pendingRequest.requester.name}`)

    console.log(`\n🔄 Current Approvals:`)
    if (pendingRequest.approvals.length === 0) {
      console.log('   ⚠️  No approval records found!')
      
      // Create a test approval
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      })
      
      if (admin) {
        console.log(`\n🔧 Creating approval record for admin: ${admin.name}`)
        await prisma.approval.create({
          data: {
            requestId: pendingRequest.id,
            approverId: admin.id,
            level: 1,
            status: 'PENDING'
          }
        })
        console.log('   ✅ Approval record created')
      }
    } else {
      pendingRequest.approvals.forEach((approval, index) => {
        console.log(`   ${index + 1}. Level ${approval.level}: ${approval.approver.name} (${approval.approver.role})`)
        console.log(`      Status: ${approval.status}`)
        console.log(`      Approver ID: ${approval.approverId}`)
        console.log(`      Approval ID: ${approval.id}`)
      })
    }

    // 2. Simulate the approval logic
    console.log(`\n🧪 Simulating Approval Logic:`)
    
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!admin) {
      console.log('❌ No admin user found')
      return
    }

    console.log(`\n👤 Testing with Admin: ${admin.name} (ID: ${admin.id})`)

    // Refresh the request data
    const refreshedRequest = await prisma.request.findUnique({
      where: { id: pendingRequest.id },
      include: {
        approvals: {
          orderBy: {
            level: 'asc'
          }
        }
      }
    })

    console.log(`\n🔍 Current approval logic check:`)
    
    // Find current approval for this admin
    let currentApproval = refreshedRequest.approvals.find(
      approval => approval.status === 'PENDING' && approval.approverId === admin.id
    )
    
    console.log(`   Current approval for admin: ${currentApproval ? 'Found' : 'Not found'}`)
    
    if (!currentApproval) {
      // Find any pending approval
      const anyPendingApproval = refreshedRequest.approvals.find(
        approval => approval.status === 'PENDING'
      )
      console.log(`   Any pending approval: ${anyPendingApproval ? 'Found' : 'Not found'}`)
      
      if (anyPendingApproval) {
        console.log(`   Would reassign approval level ${anyPendingApproval.level} to admin`)
        currentApproval = anyPendingApproval // Simulate the assignment
      }
    }

    if (currentApproval) {
      console.log(`   Using approval: Level ${currentApproval.level}, Status: ${currentApproval.status}`)
      
      // Check if this would be the last approval
      const isLastApproval = refreshedRequest.approvals.every(
        approval => approval.id === currentApproval.id || approval.status !== 'PENDING'
      )
      
      console.log(`   Is last approval needed: ${isLastApproval}`)
      console.log(`   Total approvals: ${refreshedRequest.approvals.length}`)
      console.log(`   Pending approvals: ${refreshedRequest.approvals.filter(a => a.status === 'PENDING').length}`)
      
      if (isLastApproval) {
        console.log(`   ✅ Would update request status to APPROVED`)
      } else {
        console.log(`   ⏳ Request would still need more approvals`)
      }
    } else {
      console.log(`   ❌ No approval found - would return 403 error`)
    }

    // 3. Test the actual API call simulation
    console.log(`\n🚀 API Call Simulation:`)
    console.log(`   URL: POST /api/requests/${pendingRequest.id}/approve`)
    console.log(`   Body: { "status": "APPROVED" }`)
    console.log(`   User: ${admin.name} (${admin.role})`)

    console.log(`\n💡 Recommendations:`)
    if (refreshedRequest.approvals.length === 0) {
      console.log(`   - No approval workflow set up for this request`)
      console.log(`   - The API should create approval records automatically`)
    } else if (refreshedRequest.approvals.filter(a => a.status === 'PENDING').length > 1) {
      console.log(`   - Multiple pending approvals found`)
      console.log(`   - This might prevent the request from being approved`)
    } else {
      console.log(`   - Approval workflow looks correct`)
      console.log(`   - The request should be approved successfully`)
    }

  } catch (error) {
    console.error('❌ Error debugging approval logic:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugApprovalLogic()
