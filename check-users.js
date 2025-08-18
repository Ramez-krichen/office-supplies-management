const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...')
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        status: true,
        createdAt: true,
        lastSignIn: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    
    console.log(`\n📊 Found ${users.length} users in database:`)
    console.log('=' .repeat(80))
    
    // Look for the specific demo accounts
    const demoEmails = [
      'admin@example.com',
      'manager@example.com',
      'employee@example.com',
      'admin@company.com',
      'manager@company.com',
      'employee@company.com'
    ]

    const demoUsers = users.filter(user => demoEmails.includes(user.email))

    // Also look for simple admin/manager/employee accounts
    const simpleAccounts = users.filter(user =>
      user.email.match(/^(admin|manager|employee)@company\.com$/) ||
      user.email.match(/^(admin|manager|employee)\d*@company\.com$/)
    )
    
    if (demoUsers.length > 0) {
      console.log('\n🎯 Demo accounts found:')
      demoUsers.forEach(user => {
        console.log(`   ✅ ${user.email} (${user.role}) - ${user.name || 'No name'}`)
        console.log(`      Department: ${user.department || 'None'}`)
        console.log(`      Status: ${user.status}`)
        console.log(`      Created: ${user.createdAt}`)
        console.log(`      Last Sign In: ${user.lastSignIn || 'Never'}`)
        console.log('')
      })
    } else {
      console.log('\n❌ No demo accounts found with expected emails!')
    }

    if (simpleAccounts.length > 0) {
      console.log('\n🔍 Simple admin/manager/employee accounts found:')
      simpleAccounts.forEach(user => {
        console.log(`   ✅ ${user.email} (${user.role}) - ${user.name || 'No name'}`)
        console.log(`      Department: ${user.department || 'None'}`)
        console.log(`      Status: ${user.status}`)
        console.log(`      Last Sign In: ${user.lastSignIn || 'Never'}`)
        console.log('')
      })
    }
    
    // Show first 10 users for reference
    console.log('\n📋 First 10 users in database:')
    users.slice(0, 10).forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.name || 'No name'}`)
    })
    
    if (users.length > 10) {
      console.log(`   ... and ${users.length - 10} more users`)
    }
    
    // Get audit logs count
    const auditLogCount = await prisma.auditLog.count()
    console.log(`\n📝 Total audit logs: ${auditLogCount}`)
    
    // Get recent audit logs
    const recentLogs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })
    
    if (recentLogs.length > 0) {
      console.log('\n🕒 Recent audit logs:')
      recentLogs.forEach(log => {
        console.log(`   ${log.timestamp}: ${log.action} ${log.entity} by ${log.user.email}`)
        if (log.details) {
          console.log(`      Details: ${log.details}`)
        }
      })
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
