const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixApprovalWorkflow() {
  console.log('🔧 Fixing Approval Workflow')
  console.log('=' .repeat(50))

  try {
    // 1. Find all pending requests with problematic approval workflows
    const pendingRequests = await prisma.request.findMany({
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

    console.log(`\n📋 Found ${pendingRequests.length} pending requests`)

    for (const request of pendingRequests) {
      console.log(`\n🔍 Analyzing: ${request.title} (ID: ${request.id})`)
      
      // Group approvals by level
      const approvalsByLevel = {}
      request.approvals.forEach(approval => {
        if (!approvalsByLevel[approval.level]) {
          approvalsByLevel[approval.level] = []
        }
        approvalsByLevel[approval.level].push(approval)
      })

      console.log(`   Current approval structure:`)
      let hasIssues = false
      
      for (const [level, approvals] of Object.entries(approvalsByLevel)) {
        console.log(`   Level ${level}: ${approvals.length} approvals`)
        approvals.forEach(approval => {
          console.log(`     - ${approval.approver.name} (${approval.approver.role}): ${approval.status}`)
        })
        
        // Check for issues
        const pendingCount = approvals.filter(a => a.status === 'PENDING').length
        const approvedCount = approvals.filter(a => a.status === 'APPROVED').length
        
        if (pendingCount > 1) {
          console.log(`   ⚠️  Multiple pending approvals at level ${level}`)
          hasIssues = true
        }
        
        if (approvedCount > 0 && pendingCount > 0) {
          console.log(`   ⚠️  Mixed approved/pending at level ${level}`)
          hasIssues = true
        }
      }

      if (hasIssues) {
        console.log(`   🔧 Fixing approval workflow...`)
        
        // Strategy: Keep only one approval per level, prioritizing ADMIN > MANAGER > others
        for (const [level, approvals] of Object.entries(approvalsByLevel)) {
          if (approvals.length > 1) {
            // Sort by priority: ADMIN first, then MANAGER, then others
            const sortedApprovals = approvals.sort((a, b) => {
              const roleOrder = { 'ADMIN': 0, 'MANAGER': 1, 'EMPLOYEE': 2 }
              return (roleOrder[a.approver.role] || 3) - (roleOrder[b.approver.role] || 3)
            })
            
            // Keep the highest priority approval, remove others
            const keepApproval = sortedApprovals[0]
            const removeApprovals = sortedApprovals.slice(1)
            
            console.log(`     Keeping: ${keepApproval.approver.name} (${keepApproval.approver.role})`)
            
            for (const approval of removeApprovals) {
              console.log(`     Removing: ${approval.approver.name} (${approval.approver.role})`)
              await prisma.approval.delete({
                where: { id: approval.id }
              })
            }
          }
        }
        
        console.log(`   ✅ Approval workflow fixed`)
      } else {
        console.log(`   ✅ Approval workflow is clean`)
      }
    }

    // 2. Check for requests that should already be approved
    console.log(`\n🔍 Checking for requests that should be approved...`)
    
    const requestsToCheck = await prisma.request.findMany({
      where: { status: 'PENDING' },
      include: {
        approvals: {
          orderBy: {
            level: 'asc'
          }
        }
      }
    })

    for (const request of requestsToCheck) {
      // Group approvals by level
      const approvalsByLevel = {}
      request.approvals.forEach(approval => {
        if (!approvalsByLevel[approval.level]) {
          approvalsByLevel[approval.level] = []
        }
        approvalsByLevel[approval.level].push(approval)
      })

      // Check if all levels are approved
      let allLevelsApproved = true
      const levels = Object.keys(approvalsByLevel).sort((a, b) => parseInt(a) - parseInt(b))
      
      for (const level of levels) {
        const levelApprovals = approvalsByLevel[level]
        const hasApprovedInLevel = levelApprovals.some(approval => approval.status === 'APPROVED')
        
        if (!hasApprovedInLevel) {
          allLevelsApproved = false
          break
        }
      }

      if (allLevelsApproved && levels.length > 0) {
        console.log(`   🎯 Request "${request.title}" should be approved - updating status`)
        await prisma.request.update({
          where: { id: request.id },
          data: {
            status: 'APPROVED',
            updatedAt: new Date()
          }
        })
        console.log(`   ✅ Updated to APPROVED`)
      }
    }

    // 3. Summary
    console.log(`\n📊 Final Summary:`)
    const finalPendingCount = await prisma.request.count({
      where: { status: 'PENDING' }
    })
    const approvedCount = await prisma.request.count({
      where: { status: 'APPROVED' }
    })
    const rejectedCount = await prisma.request.count({
      where: { status: 'REJECTED' }
    })

    console.log(`   Pending: ${finalPendingCount}`)
    console.log(`   Approved: ${approvedCount}`)
    console.log(`   Rejected: ${rejectedCount}`)

    console.log(`\n✅ Approval workflow cleanup complete!`)
    console.log(`\n🎯 Test the approval buttons now:`)
    console.log(`   1. Login as admin@example.com / password123`)
    console.log(`   2. Go to Admin Dashboard`)
    console.log(`   3. Click approve/reject buttons`)
    console.log(`   4. Status should update properly now`)

  } catch (error) {
    console.error('❌ Error fixing approval workflow:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixApprovalWorkflow()
