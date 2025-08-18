const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkApprovedRequests() {
  try {
    console.log('🔍 Checking approved requests...\n')
    
    // Check approved requests
    const approvedCount = await prisma.request.count({
      where: { status: 'APPROVED' }
    })
    
    console.log(`✅ Approved requests: ${approvedCount}`)
    
    if (approvedCount > 0) {
      const sampleApproved = await prisma.request.findMany({
        where: { status: 'APPROVED' },
        take: 3,
        include: {
          items: {
            include: {
              item: {
                select: {
                  name: true,
                  price: true,
                  unit: true
                }
              }
            }
          },
          requester: {
            select: {
              name: true,
              department: true
            }
          }
        }
      })
      
      console.log('\nSample approved requests:')
      sampleApproved.forEach((req, index) => {
        console.log(`${index + 1}. ${req.title} - ${req.requester?.department} - ${req.items.length} items`)
        req.items.forEach(item => {
          const cost = item.totalPrice || (item.quantity * item.item.price)
          console.log(`   - ${item.item.name}: ${item.quantity} ${item.item.unit} @ $${item.item.price} = $${cost.toFixed(2)}`)
        })
      })
    } else {
      console.log('❌ No approved requests found. Creating some sample approved requests...')
      
      // Get some pending requests to approve
      const pendingRequests = await prisma.request.findMany({
        where: { status: 'PENDING' },
        take: 10,
        include: {
          items: true
        }
      })
      
      if (pendingRequests.length > 0) {
        // Approve some requests
        for (let i = 0; i < Math.min(5, pendingRequests.length); i++) {
          await prisma.request.update({
            where: { id: pendingRequests[i].id },
            data: { status: 'APPROVED' }
          })
        }
        
        console.log(`✅ Approved ${Math.min(5, pendingRequests.length)} requests`)
      } else {
        console.log('❌ No pending requests to approve')
      }
    }
    
    // Check request statuses
    const statusCounts = await prisma.request.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })
    
    console.log('\nRequest status breakdown:')
    statusCounts.forEach(status => {
      console.log(`${status.status}: ${status._count.status}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkApprovedRequests()
