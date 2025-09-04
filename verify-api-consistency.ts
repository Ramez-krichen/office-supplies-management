import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAPIConsistency() {
  console.log('🔍 Verifying API Consistency Between Department Endpoints...\n');

  try {
    // Get departments for testing
    const departments = await prisma.department.findMany({
      where: { status: 'ACTIVE' },
      take: 3 // Test first 3 departments
    });

    console.log(`Testing ${departments.length} departments for consistency...\n`);

    for (const dept of departments) {
      console.log(`📊 Testing: ${dept.name} (${dept.code})`);
      
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // === SIMULATE OVERVIEW API CALCULATION ===
      const overviewRequestsAggregate = await prisma.request.aggregate({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: currentMonth },
          OR: [
            { department: dept.name },
            { requester: { departmentId: dept.id } }
          ]
        },
        _sum: { totalAmount: true }
      });

      const deptUsers = await prisma.user.findMany({
        where: { departmentId: dept.id },
        select: { id: true }
      });
      const deptUserIds = deptUsers.map(u => u.id);

      const overviewPOSpending = await prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] },
          createdAt: { gte: currentMonth },
          createdById: { in: deptUserIds }
        },
        _sum: { totalAmount: true }
      });

      const overviewRequestSpending = overviewRequestsAggregate._sum.totalAmount || 0;
      const overviewPOTotal = overviewPOSpending._sum.totalAmount || 0;
      const overviewMonthlySpending = overviewRequestSpending + overviewPOTotal;
      const overviewBudgetUtilization = dept.budget ? (overviewMonthlySpending / dept.budget) * 100 : 0;

      // === SIMULATE ADMIN API CALCULATION ===
      const adminRequestsAggregate = await prisma.request.aggregate({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: currentMonth },
          requester: { departmentId: dept.id }
        },
        _sum: { totalAmount: true }
      });

      const adminPOSpending = await prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] },
          createdAt: { gte: currentMonth },
          createdBy: { departmentId: dept.id }
        },
        _sum: { totalAmount: true }
      });

      const adminRequestSpending = adminRequestsAggregate._sum.totalAmount || 0;
      const adminPOTotal = adminPOSpending._sum.totalAmount || 0;
      const adminMonthlySpending = adminRequestSpending + adminPOTotal;
      const adminBudgetUtilization = dept.budget ? (adminMonthlySpending / dept.budget) * 100 : 0;

      // === COMPARE RESULTS ===
      console.log(`   Overview API:`);
      console.log(`     Request Spending: $${overviewRequestSpending.toFixed(2)}`);
      console.log(`     PO Spending: $${overviewPOTotal.toFixed(2)}`);
      console.log(`     Monthly Total: $${overviewMonthlySpending.toFixed(2)}`);
      console.log(`     Budget Usage: ${overviewBudgetUtilization.toFixed(2)}%`);

      console.log(`   Admin API:`);
      console.log(`     Request Spending: $${adminRequestSpending.toFixed(2)}`);
      console.log(`     PO Spending: $${adminPOTotal.toFixed(2)}`);
      console.log(`     Monthly Total: $${adminMonthlySpending.toFixed(2)}`);
      console.log(`     Budget Usage: ${adminBudgetUtilization.toFixed(2)}%`);

      // Check for differences
      const spendingDiff = Math.abs(overviewMonthlySpending - adminMonthlySpending);
      const budgetDiff = Math.abs(overviewBudgetUtilization - adminBudgetUtilization);

      if (spendingDiff < 0.01 && budgetDiff < 0.01) {
        console.log(`   ✅ VALUES MATCH! APIs are consistent.`);
      } else {
        console.log(`   ❌ DISCREPANCY FOUND!`);
        console.log(`     Spending difference: $${spendingDiff.toFixed(2)}`);
        console.log(`     Budget utilization difference: ${budgetDiff.toFixed(2)}%`);
        
        // Analyze the cause
        if (Math.abs(overviewRequestSpending - adminRequestSpending) > 0.01) {
          console.log(`     🔸 Request spending differs - likely query difference`);
        }
        if (Math.abs(overviewPOTotal - adminPOTotal) > 0.01) {
          console.log(`     🔸 PO spending differs - likely status filter difference`);
        }
      }
      console.log('');
    }

    // === ADDITIONAL CHECKS ===
    console.log('🔧 Additional Consistency Checks:');
    
    // Check if all departments have proper budgets
    const deptWithoutBudgets = await prisma.department.count({
      where: { 
        status: 'ACTIVE',
        budget: null 
      }
    });
    
    if (deptWithoutBudgets > 0) {
      console.log(`⚠️  ${deptWithoutBudgets} departments missing budget values`);
      console.log('   This could cause budget utilization calculation differences');
    } else {
      console.log('✅ All departments have budget values');
    }

    // Check request totalAmount consistency
    const requestsWithInconsistentTotals = await prisma.request.findMany({
      where: {
        totalAmount: { gt: 0 }
      },
      include: {
        items: {
          include: { item: true }
        }
      },
      take: 5
    });

    console.log('\n🔍 Checking request totalAmount vs calculated totals:');
    for (const request of requestsWithInconsistentTotals) {
      const calculatedTotal = request.items.reduce((sum, item) => {
        return sum + (item.totalPrice || (item.item.price * item.quantity));
      }, 0);
      
      const diff = Math.abs(request.totalAmount - calculatedTotal);
      if (diff > 0.01) {
        console.log(`⚠️  Request ${request.id}: stored $${request.totalAmount.toFixed(2)} vs calculated $${calculatedTotal.toFixed(2)}`);
      }
    }

    console.log('\n🎉 API Consistency Check Complete!');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAPIConsistency();