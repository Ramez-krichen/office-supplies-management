// Check recent audit logs for auto-receive activities
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecentAudit() {
  console.log('📋 Checking Recent Audit Logs...\n');
  
  try {
    await prisma.$connect();
    
    // Get recent audit logs from today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: startOfDay
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 20
    });
    
    console.log(`Found ${recentLogs.length} audit logs from today:`);
    console.log('================================================================================\n');
    
    recentLogs.forEach((log, index) => {
      const time = log.timestamp.toTimeString().split(' ')[0];
      console.log(`${index + 1}. ${time} - ${log.action} ${log.entity}`);
      console.log(`   By: ${log.user.name} (${log.user.email})`);
      console.log(`   Details: ${log.details || 'No details'}`);
      console.log('');
    });
    
    // Check specifically for auto-receive actions
    const autoReceiveLogs = recentLogs.filter(log => 
      log.action.includes('AUTO_RECEIVE') || 
      log.action.includes('RECEIVE_ORDER') ||
      log.details?.includes('Auto-received') ||
      log.details?.includes('auto-receive')
    );
    
    console.log(`\n🤖 Auto-receive related logs: ${autoReceiveLogs.length}`);
    autoReceiveLogs.forEach((log, index) => {
      const time = log.timestamp.toTimeString().split(' ')[0];
      console.log(`${index + 1}. ${time} - ${log.action}`);
      console.log(`   ${log.details}`);
      console.log('');
    });
    
    // Check stock movements from today
    const stockMovements = await prisma.stockMovement.findMany({
      where: {
        createdAt: {
          gte: startOfDay
        }
      },
      include: {
        item: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log(`\n📦 Stock movements from today: ${stockMovements.length}`);
    stockMovements.forEach((movement, index) => {
      const time = movement.createdAt.toTimeString().split(' ')[0];
      console.log(`${index + 1}. ${time} - ${movement.type} ${movement.quantity} ${movement.item.name}`);
      console.log(`   Reason: ${movement.reason || 'No reason'}`);
      console.log(`   Reference: ${movement.reference || 'No reference'}`);
      console.log(`   By: ${movement.user.name}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error checking audit logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkRecentAudit().catch(console.error);
