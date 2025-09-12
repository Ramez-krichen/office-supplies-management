/**
 * Refresh Activities for Employee 48
 * 
 * This script creates fresh activities for Employee 48 to ensure they appear in the UI.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Find Employee 48
    const employee48 = await prisma.user.findFirst({
      where: { email: 'employee48@company.com' }
    });

    if (!employee48) {
      console.error('Employee 48 not found');
      return;
    }

    console.log(`Found Employee 48: ${employee48.id}`);

    // Delete existing activities for Employee 48 to avoid duplicates
    const deleted = await prisma.auditLog.deleteMany({
      where: {
        performedBy: employee48.id,
        action: 'USER_ACTIVITY'
      }
    });

    console.log(`Deleted ${deleted.count} existing activities`);

    // Create fresh activities with current timestamps
    const activities = [
      'Submitted supply request for office materials',
      'Updated personal profile information',
      'Viewed inventory status for department supplies',
      'Requested new office equipment',
      'Checked department budget allocation',
      'Reviewed pending supply requests',
      'Submitted feedback on office layout',
      'Accessed department reports'
    ];

    // Create activities with timestamps spread over the last 7 days
    const now = new Date();
    
    for (let i = 0; i < activities.length; i++) {
      // Create timestamp between now and 7 days ago
      const daysAgo = Math.floor(Math.random() * 7);
      const hoursAgo = Math.floor(Math.random() * 24);
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(timestamp.getHours() - hoursAgo);
      
      await prisma.auditLog.create({
        data: {
          action: 'USER_ACTIVITY',
          entity: 'SYSTEM',
          entityId: 'system',
          performedBy: employee48.id,
          details: activities[i],
          timestamp: timestamp
        }
      });
      console.log(`Created activity: ${activities[i]} (${timestamp.toISOString()})`);
    }

    console.log('Successfully created fresh activities for Employee 48');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();