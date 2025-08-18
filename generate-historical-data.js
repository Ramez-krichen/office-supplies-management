// Generate comprehensive historical data for the last 10 years, this year, and this month
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Helper function to generate realistic seasonal patterns
function getSeasonalMultiplier(month) {
  // Higher activity in Q1 (budget planning), Q3 (back-to-school), Q4 (year-end)
  const seasonalFactors = {
    0: 1.3,  // January - budget planning
    1: 1.1,  // February
    2: 1.2,  // March - Q1 end
    3: 0.9,  // April
    4: 0.8,  // May
    5: 0.9,  // June - Q2 end
    6: 0.7,  // July - summer slowdown
    7: 1.4,  // August - back-to-school prep
    8: 1.3,  // September - back-to-school
    9: 1.1,  // October
    10: 1.2, // November - holiday prep
    11: 1.5  // December - year-end spending
  }
  return seasonalFactors[month] || 1.0
}

// Helper function to generate realistic growth patterns
function getYearlyGrowthMultiplier(year, baseYear = 2015) {
  const yearsFromBase = year - baseYear
  // Simulate 3-8% annual growth with some volatility
  const baseGrowth = Math.pow(1.05, yearsFromBase) // 5% base growth
  const volatility = 0.8 + (Math.random() * 0.4) // ±20% volatility
  return baseGrowth * volatility
}

// Helper function to generate realistic department spending patterns
function getDepartmentSpendingPattern(department) {
  const patterns = {
    'IT': { base: 15000, volatility: 0.3, seasonal: 1.2 },
    'HR': { base: 8000, volatility: 0.2, seasonal: 0.8 },
    'Finance': { base: 12000, volatility: 0.15, seasonal: 1.1 },
    'Marketing': { base: 10000, volatility: 0.4, seasonal: 1.3 },
    'Operations': { base: 20000, volatility: 0.25, seasonal: 1.0 },
    'Sales': { base: 14000, volatility: 0.35, seasonal: 1.1 },
    'Legal': { base: 6000, volatility: 0.1, seasonal: 0.9 },
    'Facilities': { base: 18000, volatility: 0.2, seasonal: 1.0 }
  }
  return patterns[department] || { base: 10000, volatility: 0.25, seasonal: 1.0 }
}

async function generateHistoricalData() {
  console.log('📅 Generating comprehensive historical data for the last 10 years...')
  
  try {
    // Get existing data to work with
    const users = await prisma.user.findMany()
    const items = await prisma.item.findMany()
    const suppliers = await prisma.supplier.findMany()
    const categories = await prisma.category.findMany()

    if (users.length === 0 || items.length === 0 || suppliers.length === 0) {
      console.log('❌ No base data found. Please run the comprehensive seed first.')
      return
    }

    console.log(`📊 Working with ${users.length} users, ${items.length} items, ${suppliers.length} suppliers`)

    // Generate data for the last 10 years (2015-2024) plus current year (2025)
    const currentYear = new Date().getFullYear()
    const startYear = currentYear - 10
    
    let totalRequests = 0
    let totalOrders = 0
    let totalMovements = 0
    let totalReturns = 0

    for (let year = startYear; year <= currentYear; year++) {
      console.log(`\n🗓️ Generating data for year ${year}...`)
      
      const yearlyGrowth = getYearlyGrowthMultiplier(year)
      const isCurrentYear = year === currentYear
      const currentMonth = new Date().getMonth()
      
      // Determine how many months to generate for current year
      const monthsToGenerate = isCurrentYear ? currentMonth + 1 : 12
      
      for (let month = 0; month < monthsToGenerate; month++) {
        const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' })
        console.log(`   📅 Generating ${monthName} ${year}...`)
        
        const seasonalMultiplier = getSeasonalMultiplier(month)
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        
        // Calculate base activity levels with growth and seasonal patterns
        const baseRequestCount = Math.floor(15 * yearlyGrowth * seasonalMultiplier)
        const baseOrderCount = Math.floor(10 * yearlyGrowth * seasonalMultiplier)
        const baseMovementCount = Math.floor(25 * yearlyGrowth * seasonalMultiplier)
        
        // Generate requests for this month
        const requestCount = Math.max(5, baseRequestCount + Math.floor(Math.random() * 10) - 5)
        console.log(`      📋 Creating ${requestCount} requests...`)

        for (let i = 0; i < requestCount; i++) {
          const randomUser = users[Math.floor(Math.random() * users.length)]
          const randomDay = Math.floor(Math.random() * daysInMonth) + 1
          const requestDate = new Date(year, month, randomDay, 
            Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

          // More sophisticated status distribution based on year (older requests more likely to be completed)
          let status = 'PENDING'
          if (year < currentYear - 1) {
            status = Math.random() > 0.1 ? 'APPROVED' : Math.random() > 0.5 ? 'COMPLETED' : 'REJECTED'
          } else if (year < currentYear) {
            status = Math.random() > 0.2 ? 'APPROVED' : Math.random() > 0.6 ? 'PENDING' : 'REJECTED'
          } else {
            status = Math.random() > 0.3 ? 'APPROVED' : Math.random() > 0.5 ? 'PENDING' : 'REJECTED'
          }

          const request = await prisma.request.create({
            data: {
              title: `${randomUser.department || 'General'} Supply Request ${monthName} ${year} #${i + 1}`,
              description: `Monthly supply request for ${randomUser.department || 'General'} department - ${monthName} ${year}`,
              status: status,
              priority: Math.random() > 0.8 ? 'HIGH' : Math.random() > 0.6 ? 'MEDIUM' : 'LOW',
              department: randomUser.department || 'General',
              requesterId: randomUser.id,
              createdAt: requestDate,
              updatedAt: requestDate
            }
          })

          // Add 1-6 items to each request
          const itemCount = Math.floor(Math.random() * 6) + 1
          const usedItems = new Set()
          let requestTotal = 0

          for (let j = 0; j < itemCount; j++) {
            let randomItem
            let attempts = 0

            do {
              randomItem = items[Math.floor(Math.random() * items.length)]
              attempts++
            } while (usedItems.has(randomItem.id) && attempts < 10)

            if (usedItems.has(randomItem.id)) continue

            usedItems.add(randomItem.id)
            const quantity = Math.floor(Math.random() * 25) + 1
            
            // Historical price variation (inflation ~2-3% per year)
            const inflationFactor = Math.pow(1.025, currentYear - year)
            const historicalPrice = randomItem.price / inflationFactor
            const totalPrice = quantity * historicalPrice
            requestTotal += totalPrice

            await prisma.requestItem.create({
              data: {
                requestId: request.id,
                itemId: randomItem.id,
                quantity: quantity,
                unitPrice: historicalPrice,
                totalPrice: totalPrice
              }
            })
          }

          // Update request total
          await prisma.request.update({
            where: { id: request.id },
            data: { totalAmount: requestTotal }
          })

          totalRequests++
        }

        // Generate purchase orders for this month
        const orderCount = Math.max(3, baseOrderCount + Math.floor(Math.random() * 8) - 4)
        console.log(`      🛒 Creating ${orderCount} purchase orders...`)

        for (let i = 0; i < orderCount; i++) {
          const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)]
          const randomDay = Math.floor(Math.random() * daysInMonth) + 1
          const orderDate = new Date(year, month, randomDay,
            Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

          const orderNumber = `PO-${year}${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}-${Date.now()}`
          const randomCreator = users[Math.floor(Math.random() * users.length)]

          // Historical status distribution
          let orderStatus = 'DRAFT'
          if (year < currentYear - 1) {
            orderStatus = Math.random() > 0.05 ? 'RECEIVED' : Math.random() > 0.3 ? 'ORDERED' : 'CANCELLED'
          } else if (year < currentYear) {
            orderStatus = Math.random() > 0.15 ? 'RECEIVED' : Math.random() > 0.4 ? 'ORDERED' : 'PENDING'
          } else {
            orderStatus = Math.random() > 0.3 ? 'ORDERED' : Math.random() > 0.5 ? 'PENDING' : 'DRAFT'
          }

          const order = await prisma.purchaseOrder.create({
            data: {
              orderNumber: orderNumber,
              supplierId: randomSupplier.id,
              status: orderStatus,
              totalAmount: 0, // Will be calculated after adding items
              orderDate: orderDate,
              expectedDate: new Date(orderDate.getTime() + (7 + Math.random() * 14) * 24 * 60 * 60 * 1000),
              receivedDate: orderStatus === 'RECEIVED' ?
                new Date(orderDate.getTime() + (5 + Math.random() * 20) * 24 * 60 * 60 * 1000) : null,
              createdById: randomCreator.id,
              createdAt: orderDate,
              updatedAt: orderDate
            }
          })

          // Add 2-10 items to each order
          const orderItemCount = Math.floor(Math.random() * 9) + 2
          let orderTotal = 0
          const usedOrderItems = new Set()

          for (let j = 0; j < orderItemCount; j++) {
            let randomItem
            let attempts = 0

            do {
              randomItem = items[Math.floor(Math.random() * items.length)]
              attempts++
            } while (usedOrderItems.has(randomItem.id) && attempts < 10)

            if (usedOrderItems.has(randomItem.id)) continue

            usedOrderItems.add(randomItem.id)
            const quantity = Math.floor(Math.random() * 100) + 10

            // Historical pricing with supplier variation
            const inflationFactor = Math.pow(1.025, currentYear - year)
            const basePrice = randomItem.price / inflationFactor
            const unitPrice = basePrice * (0.75 + Math.random() * 0.5) // Supplier pricing variation
            const itemTotal = quantity * unitPrice
            orderTotal += itemTotal

            await prisma.orderItem.create({
              data: {
                purchaseOrderId: order.id,
                itemId: randomItem.id,
                quantity: quantity,
                unitPrice: unitPrice,
                totalPrice: itemTotal,
                receivedQuantity: orderStatus === 'RECEIVED' ? quantity : 0
              }
            })
          }

          // Update order total
          await prisma.purchaseOrder.update({
            where: { id: order.id },
            data: { totalAmount: orderTotal }
          })

          totalOrders++
        }

        // Generate stock movements for this month
        const movementCount = Math.max(10, baseMovementCount + Math.floor(Math.random() * 20) - 10)
        console.log(`      📊 Creating ${movementCount} stock movements...`)

        for (let i = 0; i < movementCount; i++) {
          const randomItem = items[Math.floor(Math.random() * items.length)]
          const randomDay = Math.floor(Math.random() * daysInMonth) + 1
          const movementDate = new Date(year, month, randomDay,
            Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

          const movementType = Math.random() > 0.55 ? 'IN' : 'OUT'
          const quantity = Math.floor(Math.random() * 50) + 1
          const randomMovementUser = users[Math.floor(Math.random() * users.length)]

          const reasons = {
            'IN': ['PURCHASE', 'RETURN', 'ADJUSTMENT', 'TRANSFER'],
            'OUT': ['CONSUMPTION', 'DAMAGE', 'ADJUSTMENT', 'TRANSFER', 'DISPOSAL']
          }

          await prisma.stockMovement.create({
            data: {
              itemId: randomItem.id,
              type: movementType,
              quantity: quantity,
              reason: reasons[movementType][Math.floor(Math.random() * reasons[movementType].length)],
              userId: randomMovementUser.id,
              reference: `${year}-${String(month + 1).padStart(2, '0')}-${movementType}-${i + 1}`,
              createdAt: movementDate
            }
          })

          totalMovements++
        }

        // Generate returns for this month (fewer in earlier years)
        const returnMultiplier = year < currentYear - 5 ? 0.5 : year < currentYear - 2 ? 0.8 : 1.0
        const returnCount = Math.floor((Math.floor(Math.random() * 6) + 2) * returnMultiplier)
        console.log(`      ↩️ Creating ${returnCount} returns...`)

        for (let i = 0; i < returnCount; i++) {
          const randomUser = users[Math.floor(Math.random() * users.length)]
          const randomItem = items[Math.floor(Math.random() * items.length)]
          const randomDay = Math.floor(Math.random() * daysInMonth) + 1
          const returnDate = new Date(year, month, randomDay,
            Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

          const returnNumber = `RET-${year}${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}-${Date.now()}`
          const quantity = Math.floor(Math.random() * 8) + 1

          // Historical return status distribution
          let returnStatus = 'PENDING'
          if (year < currentYear - 1) {
            returnStatus = Math.random() > 0.1 ? 'APPROVED' : Math.random() > 0.5 ? 'PROCESSED' : 'REJECTED'
          } else if (year < currentYear) {
            returnStatus = Math.random() > 0.2 ? 'APPROVED' : Math.random() > 0.6 ? 'PENDING' : 'REJECTED'
          } else {
            returnStatus = Math.random() > 0.4 ? 'APPROVED' : 'PENDING'
          }

          const reasons = ['DEFECTIVE', 'EXCESS', 'WRONG_ITEM', 'DAMAGED', 'EXPIRED', 'NOT_NEEDED']
          const conditions = ['DAMAGED', 'GOOD', 'OPENED', 'SEALED']

          await prisma.return.create({
            data: {
              returnNumber: returnNumber,
              itemId: randomItem.id,
              requesterId: randomUser.id,
              quantity: quantity,
              reason: reasons[Math.floor(Math.random() * reasons.length)],
              condition: conditions[Math.floor(Math.random() * conditions.length)],
              status: returnStatus,
              description: `Return processed in ${monthName} ${year} - ${reasons[Math.floor(Math.random() * reasons.length)]}`,
              returnDate: returnDate,
              processedDate: returnStatus === 'PROCESSED' ?
                new Date(returnDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
              processedBy: returnStatus === 'PROCESSED' ? randomUser.id : null,
              refundAmount: returnStatus === 'PROCESSED' ? quantity * randomItem.price * 0.8 : 0,
              createdAt: returnDate,
              updatedAt: returnDate
            }
          })

          totalReturns++
        }

        // Generate audit logs for this month (more activity in recent years)
        const auditMultiplier = year < currentYear - 5 ? 0.3 : year < currentYear - 2 ? 0.7 : 1.0
        const auditCount = Math.floor((Math.floor(Math.random() * 30) + 10) * auditMultiplier)

        for (let i = 0; i < auditCount; i++) {
          const randomUser = users[Math.floor(Math.random() * users.length)]
          const randomDay = Math.floor(Math.random() * daysInMonth) + 1
          const auditDate = new Date(year, month, randomDay,
            Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

          const actions = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'VIEW', 'EXPORT']
          const entities = ['REQUEST', 'ORDER', 'ITEM', 'USER', 'SUPPLIER', 'RETURN']

          await prisma.auditLog.create({
            data: {
              action: actions[Math.floor(Math.random() * actions.length)],
              entity: entities[Math.floor(Math.random() * entities.length)],
              entityId: `entity_${Math.random().toString(36).substr(2, 9)}`,
              performedBy: randomUser.id,
              timestamp: auditDate,
              details: `Historical audit entry for ${monthName} ${year}`
            }
          })
        }

        // Generate demand forecasts for this month (only for recent years)
        if (year >= currentYear - 3) {
          const forecastCount = Math.floor(items.length * 0.3) // Forecast for 30% of items
          const selectedItems = items.sort(() => 0.5 - Math.random()).slice(0, forecastCount)

          for (const item of selectedItems) {
            const periodKey = `${year}-${String(month + 1).padStart(2, '0')}`

            // Check if forecast already exists
            const existingForecast = await prisma.demandForecast.findUnique({
              where: {
                itemId_period_periodType: {
                  itemId: item.id,
                  period: periodKey,
                  periodType: 'MONTHLY'
                }
              }
            })

            if (!existingForecast) {
              const baseDemand = Math.floor(Math.random() * 100) + 20
              const seasonalDemand = Math.floor(baseDemand * getSeasonalMultiplier(month))
              const actualDemand = year < currentYear ?
                Math.floor(seasonalDemand * (0.8 + Math.random() * 0.4)) : null

              await prisma.demandForecast.create({
                data: {
                  itemId: item.id,
                  period: periodKey,
                  periodType: 'MONTHLY',
                  predictedDemand: seasonalDemand,
                  actualDemand: actualDemand,
                  confidence: 0.7 + Math.random() * 0.25,
                  algorithm: Math.random() > 0.5 ? 'LINEAR_REGRESSION' : 'SEASONAL_ARIMA',
                  factors: JSON.stringify({
                    seasonal: getSeasonalMultiplier(month),
                    trend: yearlyGrowth,
                    category: item.categoryId
                  }),
                  createdAt: new Date(year, month, 1),
                  updatedAt: new Date(year, month, 1)
                }
              })
            }
          }
        }

        console.log(`      ✅ ${monthName} ${year} completed`)
      }

      console.log(`   🎯 Year ${year} completed`)
    }

    // Generate additional detailed data for current month
    const currentDate = new Date()
    const currentMonthName = currentDate.toLocaleString('default', { month: 'long' })

    console.log(`\n🔥 Generating additional detailed data for current month (${currentMonthName} ${currentYear})...`)

    // Generate more granular daily data for current month
    const daysInCurrentMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate()
    const currentDay = currentDate.getDate()

    for (let day = 1; day <= currentDay; day++) {
      // Generate 1-3 requests per day for current month
      const dailyRequests = Math.floor(Math.random() * 3) + 1

      for (let i = 0; i < dailyRequests; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)]
        const requestDate = new Date(currentYear, currentDate.getMonth(), day,
          Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

        const request = await prisma.request.create({
          data: {
            title: `Daily Supply Request - ${currentMonthName} ${day}, ${currentYear} #${i + 1}`,
            description: `Daily supply request for ${randomUser.department || 'General'} department`,
            status: Math.random() > 0.4 ? 'APPROVED' : Math.random() > 0.6 ? 'PENDING' : 'REJECTED',
            priority: Math.random() > 0.7 ? 'HIGH' : Math.random() > 0.5 ? 'MEDIUM' : 'LOW',
            department: randomUser.department || 'General',
            requesterId: randomUser.id,
            createdAt: requestDate,
            updatedAt: requestDate
          }
        })

        // Add items to request
        const itemCount = Math.floor(Math.random() * 4) + 1
        const usedItems = new Set()
        let requestTotal = 0

        for (let j = 0; j < itemCount; j++) {
          let randomItem
          let attempts = 0

          do {
            randomItem = items[Math.floor(Math.random() * items.length)]
            attempts++
          } while (usedItems.has(randomItem.id) && attempts < 10)

          if (usedItems.has(randomItem.id)) continue

          usedItems.add(randomItem.id)
          const quantity = Math.floor(Math.random() * 15) + 1
          const totalPrice = quantity * randomItem.price
          requestTotal += totalPrice

          await prisma.requestItem.create({
            data: {
              requestId: request.id,
              itemId: randomItem.id,
              quantity: quantity,
              unitPrice: randomItem.price,
              totalPrice: totalPrice
            }
          })
        }

        await prisma.request.update({
          where: { id: request.id },
          data: { totalAmount: requestTotal }
        })

        totalRequests++
      }
    }

    console.log('\n🎉 Historical data generation completed!')
    console.log(`📊 Summary:`)
    console.log(`   📋 Total Requests: ${totalRequests}`)
    console.log(`   🛒 Total Purchase Orders: ${totalOrders}`)
    console.log(`   📊 Total Stock Movements: ${totalMovements}`)
    console.log(`   ↩️ Total Returns: ${totalReturns}`)
    console.log(`   📅 Years covered: ${startYear} - ${currentYear}`)
    console.log(`   🗓️ Current month: ${currentMonthName} ${currentYear} (detailed daily data)`)

  } catch (error) {
    console.error('❌ Error generating historical data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
generateHistoricalData()
