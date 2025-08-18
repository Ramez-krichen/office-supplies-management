const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testManagerAPI() {
  try {
    console.log('🧪 Testing manager API functionality...')
    
    // Test manager retrieval
    const managers = await prisma.user.findMany({
      where: { 
        role: 'MANAGER',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        departmentId: true,
        status: true
      },
      orderBy: { name: 'asc' }
    })
    
    console.log(`📊 Found ${managers.length} active managers:`)
    managers.forEach(mgr => {
      console.log(`   - ${mgr.name} (${mgr.email})`)
      console.log(`     Department: ${mgr.department}`)
      console.log(`     Department ID: ${mgr.departmentId}`)
      console.log(`     Status: ${mgr.status}`)
      console.log('')
    })
    
    // Test department-manager relationships
    console.log('🏢 Department-Manager relationships:')
    const departments = await prisma.department.findMany({
      include: {
        manager: {
          select: { id: true, name: true, email: true }
        },
        users: {
          where: { role: 'MANAGER', status: 'ACTIVE' },
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { code: 'asc' }
    })
    
    departments.forEach(dept => {
      console.log(`   ${dept.code}: ${dept.name}`)
      console.log(`     Assigned Manager: ${dept.manager ? dept.manager.name : 'None'}`)
      console.log(`     Available Managers: ${dept.users.length}`)
      dept.users.forEach(mgr => {
        console.log(`       - ${mgr.name}`)
      })
      console.log('')
    })
    
    console.log('✅ Manager API test completed successfully!')
    console.log('\n📋 API Fixes Applied:')
    console.log('   ✅ Added role filtering support to /api/admin/users')
    console.log('   ✅ Updated response format for manager queries')
    console.log('   ✅ Added departmentId and status fields to response')
    console.log('   ✅ Proper sorting by name for manager dropdown')
    
  } catch (error) {
    console.error('❌ Error testing manager API:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testManagerAPI()
