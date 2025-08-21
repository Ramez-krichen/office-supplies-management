import { PrismaClient } from '@prisma/client'
import { 
  processManagerAssignmentForDepartment,
  processAllDepartmentManagerAssignments
} from '@/lib/manager-assignment'

const prisma = new PrismaClient()

/**
 * Periodic Manager Assignment Check
 * This script should be run periodically (e.g., every hour) to ensure
 * manager assignments are up-to-date and notifications are sent when needed.
 */
async function periodicManagerAssignmentCheck() {
  try {
    console.log('🕒 Periodic Manager Assignment Check Started...\n')
    
    const startTime = new Date()
    
    // Process all departments to catch any changes
    const result = await processAllDepartmentManagerAssignments()
    
    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()
    
    console.log('📊 Processing Results:')
    console.log(`   Total Departments: ${result.totalDepartments}`)
    console.log(`   Auto-Assigned: ${result.autoAssigned}`)
    console.log(`   Notifications Created: ${result.notificationsSent}`)
    console.log(`   Errors: ${result.errors}`)
    console.log(`   Duration: ${duration}ms\n`)
    
    // Log any errors
    if (result.errors > 0) {
      console.log('❌ Errors occurred during processing:')
      result.results.forEach((r, index) => {
        if (!r.success) {
          console.log(`   ${index + 1}. ${r.message}`)
        }
      })
      console.log('')
    }
    
    // Show summary of departments with notifications
    const departmentsWithNotifications = result.results.filter(r => r.action === 'NOTIFICATION_SENT')
    if (departmentsWithNotifications.length > 0) {
      console.log('📢 Departments with new notifications:')
      departmentsWithNotifications.forEach(r => {
        console.log(`   - ${r.message}`)
      })
      console.log('')
    }
    
    // Show summary of auto-assigned departments
    const autoAssignedDepts = result.results.filter(r => r.action === 'ASSIGNED')
    if (autoAssignedDepts.length > 0) {
      console.log('✅ Auto-assigned departments:')
      autoAssignedDepts.forEach(r => {
        console.log(`   - ${r.message}`)
      })
      console.log('')
    }
    
    console.log('✅ Periodic Manager Assignment Check Completed!')
    
  } catch (error) {
    console.error('❌ Error in periodic manager assignment check:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// If running directly (not imported)
if (require.main === module) {
  periodicManagerAssignmentCheck()
}

export default periodicManagerAssignmentCheck