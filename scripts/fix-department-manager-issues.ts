import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface DepartmentIssue {
  departmentId: string
  departmentName: string
  departmentCode: string
  issue: 'NO_MANAGER' | 'MULTIPLE_MANAGERS' | 'SPENDING_DISCREPANCY'
  details: any
}

async function analyzeDepartmentIssues() {
  console.log('🔍 ANALYZING DEPARTMENT MANAGER ISSUES...\n')
  
  const issues: DepartmentIssue[] = []
  
  try {
    // Get all departments with their managers and users
    const departments = await prisma.department.findMany({
      include: {
        manager: {
          select: { id: true, name: true, email: true, role: true }
        },
        users: {
          where: { role: 'MANAGER', status: 'ACTIVE' },
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })

    console.log('=== CURRENT DEPARTMENT STATUS ===')
    departments.forEach(dept => {
      console.log(`\n📁 ${dept.name} (${dept.code}):`)
      console.log(`   Assigned Manager: ${dept.manager ? dept.manager.name + ' (' + dept.manager.email + ')' : '❌ NO MANAGER'}`)
      console.log(`   Managers in Dept: ${dept.users.length}`)
      if (dept.users.length > 0) {
        dept.users.forEach(user => {
          console.log(`     - ${user.name} (${user.email})`)
        })
      }
      console.log(`   Budget: $${dept.budget || 'Not set'}`)
      console.log(`   Status: ${dept.status}`)

      // Identify issues
      if (!dept.manager) {
        issues.push({
          departmentId: dept.id,
          departmentName: dept.name,
          departmentCode: dept.code,
          issue: 'NO_MANAGER',
          details: { managersInDept: dept.users.length, managers: dept.users }
        })
      }

      if (dept.users.length > 1) {
        issues.push({
          departmentId: dept.id,
          departmentName: dept.name,
          departmentCode: dept.code,
          issue: 'MULTIPLE_MANAGERS',
          details: { managersInDept: dept.users.length, managers: dept.users }
        })
      }
    })

    console.log('\n=== IDENTIFIED ISSUES ===')
    issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.departmentName} (${issue.departmentCode}):`)
      console.log(`   Issue: ${issue.issue}`)
      if (issue.issue === 'NO_MANAGER') {
        console.log(`   Details: No manager assigned, ${issue.details.managersInDept} managers in department`)
      } else if (issue.issue === 'MULTIPLE_MANAGERS') {
        console.log(`   Details: ${issue.details.managersInDept} managers in department but need to assign primary`)
        issue.details.managers.forEach((mgr: any) => {
          console.log(`     - ${mgr.name} (${mgr.email})`)
        })
      }
    })

    return { departments, issues }

  } catch (error) {
    console.error('❌ Error analyzing departments:', error)
    return { departments: [], issues: [] }
  }
}

async function checkSpendingCalculations() {
  console.log('\n🔍 CHECKING SPENDING CALCULATION DIFFERENCES...\n')
  
  try {
    const departments = await prisma.department.findMany({
      where: { status: 'ACTIVE' }
    })

    for (const dept of departments) {
      console.log(`\n📊 ${dept.name} Spending Analysis:`)
      
      // Current month calculation (like overview API)
      const now = new Date()
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      // Overview API calculation (includes APPROVED status)
      const overviewRequests = await prisma.request.findMany({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: currentMonth },
          requester: { departmentId: dept.id }
        },
        include: {
          items: { include: { item: true } }
        }
      })

      const overviewRequestSpending = overviewRequests.reduce((total, request) => {
        return total + request.items.reduce((itemTotal, requestItem) => {
          return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
        }, 0)
      }, 0)

      const overviewPOSpending = await prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] },
          createdAt: { gte: currentMonth },
          createdBy: { departmentId: dept.id }
        },
        _sum: { totalAmount: true }
      })

      const overviewTotal = overviewRequestSpending + (overviewPOSpending._sum.totalAmount || 0)

      // Admin API calculation (excludes APPROVED status from PO)
      const adminPOSpending = await prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['ORDERED', 'RECEIVED'] }, // Note: excludes APPROVED
          createdAt: { gte: currentMonth },
          createdBy: { departmentId: dept.id }
        },
        _sum: { totalAmount: true }
      })

      const adminTotal = overviewRequestSpending + (adminPOSpending._sum.totalAmount || 0)

      console.log(`   Overview API Total: $${overviewTotal.toFixed(2)}`)
      console.log(`   Admin API Total: $${adminTotal.toFixed(2)}`)
      console.log(`   Difference: $${(overviewTotal - adminTotal).toFixed(2)}`)
      
      if (Math.abs(overviewTotal - adminTotal) > 0.01) {
        console.log(`   ⚠️  SPENDING DISCREPANCY DETECTED!`)
        console.log(`   Reason: Different PO status filters (Overview includes APPROVED, Admin doesn't)`)
      }
    }

  } catch (error) {
    console.error('❌ Error checking spending calculations:', error)
  }
}

async function generateMissingManagers() {
  console.log('\n👥 GENERATING MISSING MANAGERS...\n')
  
  try {
    const departmentsWithoutManagers = await prisma.department.findMany({
      where: {
        managerId: null,
        status: 'ACTIVE'
      },
      include: {
        users: {
          where: { role: 'MANAGER', status: 'ACTIVE' }
        }
      }
    })

    const managersCreated = []

    for (const dept of departmentsWithoutManagers) {
      if (dept.users.length === 0) {
        // Create a new manager for this department
        const managerEmail = `${dept.code.toLowerCase()}.manager@company.com`
        const managerName = `${dept.name} Manager`
        
        console.log(`📝 Creating manager for ${dept.name}: ${managerName}`)
        
        const newManager = await prisma.user.create({
          data: {
            email: managerEmail,
            name: managerName,
            password: '$2a$10$defaulthashedpassword', // Default password - should be changed
            role: 'MANAGER',
            departmentId: dept.id,
            department: dept.name,
            status: 'ACTIVE',
            permissions: 'department_read,department_write,requests_read,requests_write,reports_read'
          }
        })

        // Assign the new manager to the department
        await prisma.department.update({
          where: { id: dept.id },
          data: { managerId: newManager.id }
        })

        managersCreated.push({
          departmentName: dept.name,
          managerName: newManager.name,
          managerEmail: newManager.email,
          managerId: newManager.id
        })

        console.log(`✅ Created and assigned manager: ${newManager.name} to ${dept.name}`)
      } else if (dept.users.length === 1) {
        // Auto-assign the single manager
        const manager = dept.users[0]
        
        await prisma.department.update({
          where: { id: dept.id },
          data: { managerId: manager.id }
        })

        console.log(`✅ Auto-assigned existing manager: ${manager.name} to ${dept.name}`)
      }
    }

    return managersCreated

  } catch (error) {
    console.error('❌ Error generating managers:', error)
    return []
  }
}

async function fixMultipleManagerIssues() {
  console.log('\n🔧 FIXING MULTIPLE MANAGER ISSUES...\n')
  
  try {
    // Find departments with multiple managers
    const departments = await prisma.department.findMany({
      include: {
        manager: true,
        users: {
          where: { role: 'MANAGER', status: 'ACTIVE' }
        }
      }
    })

    const multipleManagerDepts = departments.filter(d => d.users.length > 1)
    
    for (const dept of multipleManagerDepts) {
      console.log(`\n🔍 ${dept.name} has ${dept.users.length} managers:`)
      dept.users.forEach((mgr, index) => {
        console.log(`   ${index + 1}. ${mgr.name} (${mgr.email}) ${dept.managerId === mgr.id ? '👑 ASSIGNED' : ''}`)
      })

      // If no manager is assigned, assign the first one
      if (!dept.managerId && dept.users.length > 0) {
        const primaryManager = dept.users[0]
        
        await prisma.department.update({
          where: { id: dept.id },
          data: { managerId: primaryManager.id }
        })

        console.log(`✅ Assigned primary manager: ${primaryManager.name} to ${dept.name}`)
      }
    }

  } catch (error) {
    console.error('❌ Error fixing multiple manager issues:', error)
  }
}

async function createAdminNotifications() {
  console.log('\n📢 CREATING ADMIN NOTIFICATIONS...\n')
  
  try {
    // Check for existing unread manager assignment notifications
    const existingNotifications = await prisma.notification.findMany({
      where: {
        type: 'MANAGER_ASSIGNMENT',
        status: 'UNREAD'
      }
    })

    console.log(`Found ${existingNotifications.length} existing unread manager assignment notifications`)

    // Get departments that still need attention
    const departments = await prisma.department.findMany({
      include: {
        manager: true,
        users: {
          where: { role: 'MANAGER', status: 'ACTIVE' }
        }
      }
    })

    let notificationsCreated = 0

    for (const dept of departments) {
      // Check if notification already exists for this department
      const hasExistingNotification = existingNotifications.some(notif => {
        try {
          const data = JSON.parse(notif.data || '{}')
          return data.departmentId === dept.id
        } catch {
          return false
        }
      })

      if (!hasExistingNotification && dept.users.length > 1) {
        // Create notification for multiple managers
        const notificationData = {
          departmentId: dept.id,
          departmentName: dept.name,
          departmentCode: dept.code,
          scenario: 'MULTIPLE_MANAGERS',
          availableManagers: dept.users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email
          }))
        }

        await prisma.notification.create({
          data: {
            type: 'MANAGER_ASSIGNMENT',
            title: `Multiple Managers Available for ${dept.name}`,
            message: `Department "${dept.name}" has ${dept.users.length} managers. Please review the manager assignment.`,
            data: JSON.stringify(notificationData),
            priority: 'HIGH',
            targetRole: 'ADMIN',
            category: 'MANAGER_ASSIGNMENT',
            actionUrl: `/admin/departments`,
            actionLabel: 'Manage Departments'
          }
        })

        notificationsCreated++
        console.log(`📧 Created notification for ${dept.name} (${dept.users.length} managers)`)
      }
    }

    console.log(`✅ Created ${notificationsCreated} new admin notifications`)

  } catch (error) {
    console.error('❌ Error creating admin notifications:', error)
  }
}

async function fixSpendingCalculationDiscrepancy() {
  console.log('\n💰 FIXING SPENDING CALCULATION DISCREPANCY...\n')
  
  console.log('The spending discrepancy is caused by different status filters in the API endpoints:')
  console.log('- Overview API includes APPROVED status in PO calculations')
  console.log('- Admin API excludes APPROVED status in PO calculations')
  console.log('\nThis needs to be fixed in the API code for consistency.')
  
  // The fix will be applied to the API endpoints directly
}

async function main() {
  console.log('🚀 STARTING DEPARTMENT MANAGER ISSUE RESOLUTION...\n')
  
  try {
    // Step 1: Analyze current issues
    const { departments, issues } = await analyzeDepartmentIssues()
    
    // Step 2: Check spending calculation differences
    await checkSpendingCalculations()
    
    // Step 3: Generate missing managers
    const managersCreated = await generateMissingManagers()
    
    // Step 4: Fix multiple manager issues
    await fixMultipleManagerIssues()
    
    // Step 5: Create admin notifications
    await createAdminNotifications()
    
    // Step 6: Note spending calculation fix needed
    await fixSpendingCalculationDiscrepancy()
    
    console.log('\n🎉 RESOLUTION SUMMARY:')
    console.log(`📊 Departments analyzed: ${departments.length}`)
    console.log(`⚠️  Issues identified: ${issues.length}`)
    console.log(`👥 New managers created: ${managersCreated.length}`)
    
    if (managersCreated.length > 0) {
      console.log('\n📝 New Managers Created:')
      managersCreated.forEach(mgr => {
        console.log(`   - ${mgr.managerName} (${mgr.managerEmail}) for ${mgr.departmentName}`)
      })
      console.log('\n⚠️  NOTE: All new managers have default passwords and should be updated!')
    }
    
    console.log('\n✅ Department manager issues have been resolved!')
    console.log('🔧 API spending calculation fix still needed in code.')

  } catch (error) {
    console.error('❌ Error in main execution:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}

export { analyzeDepartmentIssues, generateMissingManagers, fixMultipleManagerIssues }