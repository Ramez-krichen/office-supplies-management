const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixManagerNotificationSystem() {
  try {
    console.log('🔧 Comprehensive Manager Notification System Fix\n')
    
    // Step 1: Analyze all departments for multiple managers
    console.log('📋 Step 1: Analyzing All Departments')
    const departments = await prisma.department.findMany({
      where: { status: 'ACTIVE' },
      include: {
        manager: {
          select: { id: true, name: true, email: true }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            departmentId: true
          }
        }
      }
    })

    console.log(`Found ${departments.length} active departments\n`)
    
    let departmentsWithMultipleManagers = 0
    let notificationsNeeded = 0
    let notificationsCreated = 0
    const results = []

    for (const dept of departments) {
      console.log(`🏢 Processing ${dept.name} (${dept.code})`)
      
      // Get ALL users in this department
      const allUsers = dept.users
      
      // Filter for active managers using the EXACT same logic as notification system
      const activeManagers = allUsers.filter(user => 
        user.role === 'MANAGER' && user.status === 'ACTIVE'
      )
      
      console.log(`   Total users: ${allUsers.length}`)
      console.log(`   Active managers: ${activeManagers.length}`)
      console.log(`   Assigned manager: ${dept.manager ? dept.manager.name : 'None'}`)
      
      if (activeManagers.length > 0) {
        console.log('   Active managers:')
        activeManagers.forEach(m => {
          console.log(`     - ${m.name} (${m.email}) [ID: ${m.id}]`)
        })
      }
      
      const result = {
        departmentId: dept.id,
        departmentName: dept.name,
        departmentCode: dept.code,
        totalUsers: allUsers.length,
        activeManagers: activeManagers.length,
        managerNames: activeManagers.map(m => m.name),
        currentManager: dept.manager?.name || null,
        needsNotification: activeManagers.length > 1,
        action: 'NO_ACTION'
      }
      
      // Check if multiple managers - this should trigger notification
      if (activeManagers.length > 1) {
        departmentsWithMultipleManagers++
        notificationsNeeded++
        
        console.log(`   ⚠️  Multiple managers detected: ${activeManagers.length}`)
        
        // Check if notification already exists
        const existingNotification = await prisma.notification.findFirst({
          where: {
            type: 'MANAGER_ASSIGNMENT',
            data: {
              contains: `"departmentId":"${dept.id}"`
            },
            status: 'UNREAD'
          }
        })
        
        if (!existingNotification) {
          // Create notification
          const notificationData = {
            departmentId: dept.id,
            departmentName: dept.name,
            departmentCode: dept.code,
            scenario: 'MULTIPLE_MANAGERS',
            availableManagers: activeManagers.map(m => ({
              id: m.id,
              name: m.name,
              email: m.email
            })),
            currentManagerId: dept.managerId,
            currentManagerName: dept.manager?.name || null
          }
          
          const message = dept.managerId
            ? `Department "${dept.name}" has ${activeManagers.length} active managers but only "${dept.manager?.name}" is assigned as the primary manager. Please review and reassign if needed.`
            : `Department "${dept.name}" has ${activeManagers.length} managers. Please select which manager should be assigned to this department.`
          
          const notification = await prisma.notification.create({
            data: {
              type: 'MANAGER_ASSIGNMENT',
              title: `Multiple Managers in ${dept.name}`,
              message,
              data: JSON.stringify(notificationData),
              priority: 'HIGH',
              targetRole: 'ADMIN'
            }
          })
          
          console.log(`   ✅ Created notification: ${notification.title} [ID: ${notification.id}]`)
          notificationsCreated++
          result.action = 'NOTIFICATION_CREATED'
          
          // Create audit log
          await prisma.auditLog.create({
            data: {
              action: 'MANAGER_ASSIGNMENT_NOTIFICATION_CREATED',
              entity: 'Department',
              entityId: dept.id,
              performedBy: 'SYSTEM_FIX',
              details: `Created manager assignment notification for ${dept.name} department with ${activeManagers.length} active managers: ${activeManagers.map(m => m.name).join(', ')}`
            }
          })
          
        } else {
          console.log(`   📋 Notification already exists: ${existingNotification.title}`)
          result.action = 'NOTIFICATION_EXISTS'
        }
      } else if (activeManagers.length === 1) {
        console.log(`   ✅ Single manager: ${activeManagers[0].name}`)
      } else {
        console.log(`   ❌ No managers found`)
      }
      
      results.push(result)
      console.log('')
    }
    
    // Step 2: Summary Report
    console.log('📊 COMPREHENSIVE SUMMARY')
    console.log('=' .repeat(50))
    console.log(`Total departments analyzed: ${departments.length}`)
    console.log(`Departments with multiple managers: ${departmentsWithMultipleManagers}`)
    console.log(`Notifications needed: ${notificationsNeeded}`)
    console.log(`Notifications created: ${notificationsCreated}`)
    
    console.log('\n🚨 Departments with Multiple Managers:')
    const multiManagerDepts = results.filter(r => r.needsNotification)
    if (multiManagerDepts.length === 0) {
      console.log('   None found')
    } else {
      multiManagerDepts.forEach((dept, index) => {
        console.log(`   ${index + 1}. ${dept.departmentName} (${dept.departmentCode})`)
        console.log(`      Active managers: ${dept.activeManagers} - ${dept.managerNames.join(', ')}`)
        console.log(`      Assigned: ${dept.currentManager || 'None'}`)
        console.log(`      Action: ${dept.action}`)
      })
    }
    
    // Step 3: Specific Legal Department Analysis
    console.log('\n🔍 LEGAL DEPARTMENT DEEP DIVE')
    console.log('=' .repeat(30))
    
    const legalResult = results.find(r => 
      r.departmentCode === 'LEGAL' || 
      r.departmentName.toLowerCase().includes('legal')
    )
    
    if (legalResult) {
      console.log(`Legal Department Status:`)
      console.log(`   Name: ${legalResult.departmentName}`)
      console.log(`   Code: ${legalResult.departmentCode}`)
      console.log(`   Active managers: ${legalResult.activeManagers}`)
      console.log(`   Manager names: ${legalResult.managerNames.join(', ')}`)
      console.log(`   Assigned manager: ${legalResult.currentManager || 'None'}`)
      console.log(`   Needs notification: ${legalResult.needsNotification ? 'YES' : 'NO'}`)
      console.log(`   Action taken: ${legalResult.action}`)
      
      if (legalResult.activeManagers !== 3) {
        console.log(`\n⚠️  DISCREPANCY DETECTED:`)
        console.log(`   UI shows: 3 managers`)
        console.log(`   System detects: ${legalResult.activeManagers} managers`)
        console.log(`   This suggests a data inconsistency that needs investigation`)
      }
    } else {
      console.log('❌ Legal department not found in results')
    }
    
    // Step 4: Final Action Items
    console.log('\n📋 NEXT STEPS FOR ADMIN')
    console.log('=' .repeat(25))
    
    if (notificationsCreated > 0) {
      console.log(`1. Check your admin notification panel - ${notificationsCreated} new notifications created`)
      console.log(`2. Review each department with multiple managers`)
      console.log(`3. Decide which manager should be the primary one for each department`)
      console.log(`4. Either reassign primary managers or transfer excess managers to other departments`)
      console.log(`5. Mark notifications as read once resolved`)
    } else {
      console.log('1. All departments appear to have proper manager assignments')
      console.log('2. If you still see 3 managers in Legal department in the UI, there may be a display bug')
    }
    
    console.log('\n✅ Manager notification system analysis and fix completed!')

  } catch (error) {
    console.error('❌ Error in manager notification system fix:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixManagerNotificationSystem()