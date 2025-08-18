const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testButtonFunctionality() {
  console.log('🔧 Testing Button Functionality')
  console.log('=' .repeat(50))

  try {
    // 1. Check if there are pending requests
    const pendingRequests = await prisma.request.findMany({
      where: { status: 'PENDING' },
      include: {
        requester: true,
        items: true,
        approvals: {
          include: {
            approver: true
          }
        }
      },
      take: 5
    })

    console.log(`\n📋 Found ${pendingRequests.length} pending requests`)
    
    if (pendingRequests.length === 0) {
      console.log('⚠️  No pending requests found. Creating test requests...')
      
      // Get users
      const employee = await prisma.user.findFirst({
        where: { role: 'EMPLOYEE' }
      })
      
      if (!employee) {
        console.log('❌ No employee found to create test request')
        return
      }

      // Create test requests
      for (let i = 1; i <= 3; i++) {
        const testRequest = await prisma.request.create({
          data: {
            title: `Test Request ${i} for Button Testing`,
            description: `Test request ${i} to verify approve/reject buttons work`,
            department: employee.department,
            requesterId: employee.id,
            status: 'PENDING',
            priority: i === 1 ? 'HIGH' : i === 2 ? 'MEDIUM' : 'LOW',
            totalAmount: 100.00 * i,
            items: {
              create: [
                {
                  name: `Test Item ${i}`,
                  quantity: 5,
                  unitPrice: 20.00 * i,
                  totalPrice: 100.00 * i,
                  unit: 'pieces'
                }
              ]
            }
          },
          include: {
            requester: true,
            items: true
          }
        })

        console.log(`✅ Created test request: ${testRequest.title} (ID: ${testRequest.id})`)
        pendingRequests.push(testRequest)
      }
    }

    // 2. Display pending requests
    console.log('\n📝 Pending Requests for Testing:')
    pendingRequests.forEach((request, index) => {
      console.log(`\n${index + 1}. ${request.title}`)
      console.log(`   ID: ${request.id}`)
      console.log(`   Requester: ${request.requester.name}`)
      console.log(`   Department: ${request.department}`)
      console.log(`   Total Amount: $${request.totalAmount}`)
      console.log(`   Priority: ${request.priority}`)
      console.log(`   Status: ${request.status}`)
    })

    // 3. Check managers/admins
    const approvers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MANAGER'] }
      }
    })

    console.log(`\n👥 Found ${approvers.length} users who can approve:`)
    approvers.forEach(approver => {
      console.log(`   - ${approver.name} (${approver.role}) - ${approver.email}`)
    })

    // 4. Test API endpoint manually
    console.log('\n🧪 Manual API Test Instructions:')
    console.log('To test the buttons manually, use these curl commands:')
    console.log('')
    
    if (pendingRequests.length > 0) {
      const testRequest = pendingRequests[0]
      console.log('APPROVE TEST:')
      console.log(`curl -X POST http://localhost:3000/api/requests/${testRequest.id}/approve \\`)
      console.log(`  -H "Content-Type: application/json" \\`)
      console.log(`  -d '{"status": "APPROVED"}'`)
      console.log('')
      
      if (pendingRequests.length > 1) {
        const testRequest2 = pendingRequests[1]
        console.log('REJECT TEST:')
        console.log(`curl -X POST http://localhost:3000/api/requests/${testRequest2.id}/approve \\`)
        console.log(`  -H "Content-Type: application/json" \\`)
        console.log(`  -d '{"status": "REJECTED", "comments": "Test rejection"}'`)
      }
    }

    // 5. Check if there are any approval records
    const approvals = await prisma.approval.findMany({
      where: {
        requestId: { in: pendingRequests.map(r => r.id) }
      },
      include: {
        approver: true,
        request: true
      }
    })

    console.log(`\n🔄 Found ${approvals.length} approval records`)
    if (approvals.length === 0) {
      console.log('⚠️  No approval workflow set up. Creating approval records...')
      
      // Create approval records for each pending request
      const manager = await prisma.user.findFirst({
        where: { role: 'MANAGER' }
      })
      
      if (manager) {
        for (const request of pendingRequests) {
          await prisma.approval.create({
            data: {
              requestId: request.id,
              approverId: manager.id,
              level: 1,
              status: 'PENDING'
            }
          })
        }
        console.log(`✅ Created approval records for ${pendingRequests.length} requests`)
      }
    }

    console.log('\n🎯 Button Testing Steps:')
    console.log('1. Start the development server: npm run dev')
    console.log('2. Open browser to http://localhost:3000')
    console.log('3. Login as Admin: admin@example.com / password123')
    console.log('4. Go to Admin Dashboard')
    console.log('5. Look for "Pending Approvals" section')
    console.log('6. Click green "Approve" button on any request')
    console.log('7. Click red "Reject" button and provide reason')
    console.log('8. Check browser console for any JavaScript errors')
    console.log('9. Check network tab for API calls')
    console.log('')
    console.log('Alternative: Login as Manager: manager@example.com / password123')

    console.log('\n🔍 Debugging Tips:')
    console.log('- Open browser Developer Tools (F12)')
    console.log('- Check Console tab for JavaScript errors')
    console.log('- Check Network tab to see if API calls are made')
    console.log('- Verify the request ID is being passed correctly')
    console.log('- Check if toast notifications appear')

  } catch (error) {
    console.error('❌ Error testing button functionality:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testButtonFunctionality()
