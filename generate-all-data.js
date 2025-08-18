// Master script to generate comprehensive data for the last 10 years, this year, and this month
const { PrismaClient } = require('@prisma/client')
const { execSync } = require('child_process')

const prisma = new PrismaClient()

async function checkExistingData() {
  console.log('🔍 Checking existing data...')
  
  const counts = {
    users: await prisma.user.count(),
    items: await prisma.item.count(),
    suppliers: await prisma.supplier.count(),
    categories: await prisma.category.count(),
    requests: await prisma.request.count(),
    orders: await prisma.purchaseOrder.count(),
    movements: await prisma.stockMovement.count(),
    returns: await prisma.return.count()
  }

  console.log('📊 Current database state:')
  Object.entries(counts).forEach(([table, count]) => {
    console.log(`   ${table}: ${count} records`)
  })

  return counts
}

async function generateBaseData() {
  console.log('\n🏗️ Generating base data (users, items, suppliers, categories)...')
  
  try {
    // Run the comprehensive seed script
    console.log('   Running comprehensive seed...')
    execSync('npx prisma db seed', { stdio: 'inherit' })
    console.log('   ✅ Base data generated successfully')
  } catch (error) {
    console.error('   ❌ Error generating base data:', error.message)
    throw error
  }
}

async function generateHistoricalData() {
  console.log('\n📅 Generating historical data for the last 10 years...')
  
  try {
    // Import and run the historical data generation
    const { generateHistoricalData } = require('./generate-historical-data')
    await generateHistoricalData()
    console.log('   ✅ Historical data generated successfully')
  } catch (error) {
    console.error('   ❌ Error generating historical data:', error.message)
    
    // Fallback: run as separate process
    try {
      console.log('   🔄 Trying alternative method...')
      execSync('node generate-historical-data.js', { stdio: 'inherit' })
      console.log('   ✅ Historical data generated successfully (alternative method)')
    } catch (fallbackError) {
      console.error('   ❌ Fallback method also failed:', fallbackError.message)
      throw fallbackError
    }
  }
}

async function generateCurrentMonthData() {
  console.log('\n🗓️ Generating detailed current month data...')
  
  try {
    // Import and run the current month data generation
    const { generateCurrentMonthData } = require('./generate-current-month-data')
    await generateCurrentMonthData()
    console.log('   ✅ Current month data generated successfully')
  } catch (error) {
    console.error('   ❌ Error generating current month data:', error.message)
    
    // Fallback: run as separate process
    try {
      console.log('   🔄 Trying alternative method...')
      execSync('node generate-current-month-data.js', { stdio: 'inherit' })
      console.log('   ✅ Current month data generated successfully (alternative method)')
    } catch (fallbackError) {
      console.error('   ❌ Fallback method also failed:', fallbackError.message)
      throw fallbackError
    }
  }
}

async function generateAdditionalData() {
  console.log('\n🔧 Generating additional specialized data...')
  
  try {
    // Generate some additional notifications for system health
    const users = await prisma.user.findMany()
    const currentDate = new Date()
    
    // System notifications
    const systemNotifications = [
      {
        type: 'SYSTEM_HEALTH',
        title: 'Data Generation Complete',
        message: 'Comprehensive historical data generation has been completed successfully.',
        priority: 'HIGH',
        targetRole: 'ADMIN'
      },
      {
        type: 'DATABASE_UPDATE',
        title: 'Database Populated',
        message: 'Database has been populated with 10+ years of historical data.',
        priority: 'MEDIUM',
        targetRole: 'ADMIN'
      },
      {
        type: 'ANALYTICS_READY',
        title: 'Analytics Data Ready',
        message: 'Historical data is now available for reporting and analytics.',
        priority: 'MEDIUM',
        targetRole: 'MANAGER'
      }
    ]

    for (const notification of systemNotifications) {
      await prisma.notification.create({
        data: {
          ...notification,
          status: 'UNREAD',
          data: JSON.stringify({
            generatedAt: currentDate.toISOString(),
            source: 'data_generation_script'
          }),
          createdAt: currentDate,
          updatedAt: currentDate
        }
      })
    }

    // Generate some audit logs for the data generation process
    const adminUser = users.find(u => u.role === 'ADMIN') || users[0]
    
    const auditEntries = [
      {
        action: 'BULK_CREATE',
        entity: 'HISTORICAL_DATA',
        details: 'Generated comprehensive historical data for 10+ years'
      },
      {
        action: 'BULK_CREATE',
        entity: 'CURRENT_MONTH_DATA',
        details: 'Generated detailed current month data with hourly granularity'
      },
      {
        action: 'SYSTEM_UPDATE',
        entity: 'DATABASE',
        details: 'Populated database with realistic business data patterns'
      }
    ]

    for (const entry of auditEntries) {
      await prisma.auditLog.create({
        data: {
          ...entry,
          entityId: `bulk_${Date.now()}`,
          performedBy: adminUser.id,
          timestamp: currentDate
        }
      })
    }

    console.log('   ✅ Additional data generated successfully')
  } catch (error) {
    console.error('   ❌ Error generating additional data:', error.message)
    // Don't throw here as this is not critical
  }
}

async function generateFinalSummary() {
  console.log('\n📊 Generating final summary...')
  
  try {
    const finalCounts = await checkExistingData()
    
    // Calculate some interesting statistics
    const currentYear = new Date().getFullYear()
    const startYear = currentYear - 10
    
    const yearlyStats = []
    for (let year = startYear; year <= currentYear; year++) {
      const yearStart = new Date(year, 0, 1)
      const yearEnd = new Date(year + 1, 0, 1)
      
      const yearData = {
        year,
        requests: await prisma.request.count({
          where: {
            createdAt: {
              gte: yearStart,
              lt: yearEnd
            }
          }
        }),
        orders: await prisma.purchaseOrder.count({
          where: {
            createdAt: {
              gte: yearStart,
              lt: yearEnd
            }
          }
        }),
        movements: await prisma.stockMovement.count({
          where: {
            createdAt: {
              gte: yearStart,
              lt: yearEnd
            }
          }
        })
      }
      
      yearlyStats.push(yearData)
    }

    // Current month statistics
    const currentMonth = new Date().getMonth()
    const monthStart = new Date(currentYear, currentMonth, 1)
    const monthEnd = new Date(currentYear, currentMonth + 1, 1)
    
    const currentMonthStats = {
      requests: await prisma.request.count({
        where: {
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        }
      }),
      orders: await prisma.purchaseOrder.count({
        where: {
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        }
      }),
      movements: await prisma.stockMovement.count({
        where: {
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        }
      }),
      returns: await prisma.return.count({
        where: {
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        }
      }),
      notifications: await prisma.notification.count({
        where: {
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        }
      })
    }

    console.log('\n🎉 DATA GENERATION COMPLETE! 🎉')
    console.log('=' .repeat(60))
    console.log('📈 YEARLY BREAKDOWN:')
    yearlyStats.forEach(stat => {
      console.log(`   ${stat.year}: ${stat.requests} requests, ${stat.orders} orders, ${stat.movements} movements`)
    })
    
    console.log('\n📅 CURRENT MONTH DETAILS:')
    const monthName = new Date().toLocaleString('default', { month: 'long' })
    console.log(`   ${monthName} ${currentYear}:`)
    console.log(`   📋 Requests: ${currentMonthStats.requests}`)
    console.log(`   🛒 Orders: ${currentMonthStats.orders}`)
    console.log(`   📊 Movements: ${currentMonthStats.movements}`)
    console.log(`   ↩️ Returns: ${currentMonthStats.returns}`)
    console.log(`   🔔 Notifications: ${currentMonthStats.notifications}`)
    
    console.log('\n📊 TOTAL RECORDS:')
    Object.entries(finalCounts).forEach(([table, count]) => {
      console.log(`   ${table.toUpperCase()}: ${count.toLocaleString()}`)
    })
    
    console.log('\n✨ Your office supplies management system now has:')
    console.log(`   • ${yearlyStats.length} years of historical data (${startYear}-${currentYear})`)
    console.log(`   • Realistic seasonal and business patterns`)
    console.log(`   • Detailed current month data with hourly granularity`)
    console.log(`   • Comprehensive demand forecasting data`)
    console.log(`   • Complete audit trails and notifications`)
    console.log('=' .repeat(60))
    
  } catch (error) {
    console.error('❌ Error generating summary:', error.message)
  }
}

async function main() {
  console.log('🚀 COMPREHENSIVE DATA GENERATION STARTED')
  console.log('=' .repeat(60))
  console.log('This script will generate:')
  console.log('• Base data (users, items, suppliers, categories)')
  console.log('• Historical data for the last 10 years (2015-2024)')
  console.log('• Detailed data for the current year (2025)')
  console.log('• Granular data for the current month')
  console.log('• Realistic business patterns and seasonality')
  console.log('=' .repeat(60))
  
  try {
    // Step 1: Check existing data
    const initialCounts = await checkExistingData()
    
    // Step 2: Generate base data if needed
    if (initialCounts.users === 0 || initialCounts.items === 0 || initialCounts.suppliers === 0) {
      await generateBaseData()
    } else {
      console.log('\n✅ Base data already exists, skipping...')
    }
    
    // Step 3: Generate historical data
    await generateHistoricalData()
    
    // Step 4: Generate current month data
    await generateCurrentMonthData()
    
    // Step 5: Generate additional specialized data
    await generateAdditionalData()
    
    // Step 6: Generate final summary
    await generateFinalSummary()
    
  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error.message)
    console.error('Data generation failed. Please check the error above and try again.')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the master script
main()
