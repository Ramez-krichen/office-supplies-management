// Generate detailed data for the current month with daily granularity
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Helper function to generate realistic business day patterns
function getBusinessDayMultiplier(date) {
  const dayOfWeek = date.getDay()
  // Monday = 1, Tuesday = 2, ..., Sunday = 0
  const businessDayFactors = {
    0: 0.1, // Sunday - minimal activity
    1: 1.2, // Monday - high activity
    2: 1.3, // Tuesday - peak activity
    3: 1.4, // Wednesday - peak activity
    4: 1.2, // Thursday - high activity
    5: 0.8, // Friday - lower activity
    6: 0.2  // Saturday - minimal activity
  }
  return businessDayFactors[dayOfWeek] || 1.0
}

// Helper function to generate realistic hourly patterns
function getHourlyMultiplier(hour) {
  // Business hours pattern: 8 AM - 6 PM peak, with lunch dip
  if (hour < 8 || hour > 18) return 0.1 // Outside business hours
  if (hour >= 12 && hour <= 13) return 0.6 // Lunch time
  if (hour >= 9 && hour <= 11) return 1.4 // Morning peak
  if (hour >= 14 && hour <= 16) return 1.3 // Afternoon peak
  return 1.0 // Regular business hours
}

async function generateCurrentMonthData() {
  console.log('📅 Generating detailed data for the current month...')
  
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

    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()
    const currentDay = currentDate.getDate()
    const monthName = currentDate.toLocaleString('default', { month: 'long' })
    
    console.log(`🗓️ Generating detailed data for ${monthName} ${currentYear} (up to day ${currentDay})...`)

    let totalRequests = 0
    let totalOrders = 0
    let totalMovements = 0
    let totalReturns = 0
    let totalNotifications = 0

    // Generate data for each day of the current month up to today
    for (let day = 1; day <= currentDay; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
      const businessDayMultiplier = getBusinessDayMultiplier(date)
      
      console.log(`   📅 Processing ${dayName}, ${monthName} ${day}...`)

      // Skip weekends for most business activities
      if (date.getDay() === 0 || date.getDay() === 6) {
        console.log(`      ⏭️ Weekend - minimal activity`)
        continue
      }

      // Generate hourly data for business hours
      for (let hour = 8; hour <= 18; hour++) {
        const hourlyMultiplier = getHourlyMultiplier(hour)
        const activityLevel = businessDayMultiplier * hourlyMultiplier

        // Skip low activity periods
        if (activityLevel < 0.3) continue

        // Generate requests based on activity level
        if (Math.random() < activityLevel * 0.3) { // 30% chance per active hour
          const randomUser = users[Math.floor(Math.random() * users.length)]
          const requestTime = new Date(currentYear, currentMonth, day, hour, 
            Math.floor(Math.random() * 60), Math.floor(Math.random() * 60))

          const request = await prisma.request.create({
            data: {
              title: `${randomUser.department || 'General'} Hourly Request - ${monthName} ${day}, ${hour}:00`,
              description: `Hourly supply request for ${randomUser.department || 'General'} department`,
              status: Math.random() > 0.3 ? 'PENDING' : Math.random() > 0.7 ? 'APPROVED' : 'REJECTED',
              priority: Math.random() > 0.8 ? 'HIGH' : Math.random() > 0.6 ? 'MEDIUM' : 'LOW',
              department: randomUser.department || 'General',
              requesterId: randomUser.id,
              createdAt: requestTime,
              updatedAt: requestTime
            }
          })

          // Add 1-3 items to each request
          const itemCount = Math.floor(Math.random() * 3) + 1
          const usedItems = new Set()
          let requestTotal = 0

          for (let i = 0; i < itemCount; i++) {
            let randomItem
            let attempts = 0

            do {
              randomItem = items[Math.floor(Math.random() * items.length)]
              attempts++
            } while (usedItems.has(randomItem.id) && attempts < 10)

            if (usedItems.has(randomItem.id)) continue

            usedItems.add(randomItem.id)
            const quantity = Math.floor(Math.random() * 10) + 1
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

        // Generate stock movements based on activity level
        if (Math.random() < activityLevel * 0.4) { // 40% chance per active hour
          const randomItem = items[Math.floor(Math.random() * items.length)]
          const movementTime = new Date(currentYear, currentMonth, day, hour, 
            Math.floor(Math.random() * 60), Math.floor(Math.random() * 60))

          const movementType = Math.random() > 0.6 ? 'IN' : 'OUT'
          const quantity = Math.floor(Math.random() * 20) + 1
          const randomUser = users[Math.floor(Math.random() * users.length)]

          const reasons = {
            'IN': ['PURCHASE', 'RETURN', 'ADJUSTMENT'],
            'OUT': ['CONSUMPTION', 'DAMAGE', 'ADJUSTMENT', 'TRANSFER']
          }

          await prisma.stockMovement.create({
            data: {
              itemId: randomItem.id,
              type: movementType,
              quantity: quantity,
              reason: reasons[movementType][Math.floor(Math.random() * reasons[movementType].length)],
              userId: randomUser.id,
              reference: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}-${hour}`,
              createdAt: movementTime
            }
          })

          totalMovements++
        }
      }

      // Generate daily purchase orders (1-2 per business day)
      if (Math.random() < 0.7) { // 70% chance per business day
        const orderCount = Math.floor(Math.random() * 2) + 1
        
        for (let i = 0; i < orderCount; i++) {
          const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)]
          const orderTime = new Date(currentYear, currentMonth, day, 
            9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60))

          const orderNumber = `PO-${currentYear}${String(currentMonth + 1).padStart(2, '0')}${String(day).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}-${Date.now()}`
          const randomCreator = users[Math.floor(Math.random() * users.length)]

          const order = await prisma.purchaseOrder.create({
            data: {
              orderNumber: orderNumber,
              supplierId: randomSupplier.id,
              status: Math.random() > 0.4 ? 'PENDING' : Math.random() > 0.7 ? 'APPROVED' : 'DRAFT',
              totalAmount: 0,
              orderDate: orderTime,
              expectedDate: new Date(orderTime.getTime() + (5 + Math.random() * 10) * 24 * 60 * 60 * 1000),
              createdById: randomCreator.id,
              createdAt: orderTime,
              updatedAt: orderTime
            }
          })

          // Add 2-6 items to each order
          const orderItemCount = Math.floor(Math.random() * 5) + 2
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
            const quantity = Math.floor(Math.random() * 50) + 10
            const unitPrice = randomItem.price * (0.8 + Math.random() * 0.4)
            const itemTotal = quantity * unitPrice
            orderTotal += itemTotal

            await prisma.orderItem.create({
              data: {
                purchaseOrderId: order.id,
                itemId: randomItem.id,
                quantity: quantity,
                unitPrice: unitPrice,
                totalPrice: itemTotal
              }
            })
          }

          await prisma.purchaseOrder.update({
            where: { id: order.id },
            data: { totalAmount: orderTotal }
          })

          totalOrders++
        }
      }

      // Generate returns (1-2 per week)
      if (Math.random() < 0.15) { // 15% chance per business day
        const randomUser = users[Math.floor(Math.random() * users.length)]
        const randomItem = items[Math.floor(Math.random() * items.length)]
        const returnTime = new Date(currentYear, currentMonth, day, 
          10 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60))

        const returnNumber = `RET-${currentYear}${String(currentMonth + 1).padStart(2, '0')}${String(day).padStart(2, '0')}-${Date.now()}`
        const quantity = Math.floor(Math.random() * 5) + 1

        const reasons = ['DEFECTIVE', 'EXCESS', 'WRONG_ITEM', 'DAMAGED']
        const conditions = ['DAMAGED', 'GOOD', 'OPENED']

        await prisma.return.create({
          data: {
            returnNumber: returnNumber,
            itemId: randomItem.id,
            requesterId: randomUser.id,
            quantity: quantity,
            reason: reasons[Math.floor(Math.random() * reasons.length)],
            condition: conditions[Math.floor(Math.random() * conditions.length)],
            status: Math.random() > 0.6 ? 'PENDING' : 'APPROVED',
            description: `Current month return - ${monthName} ${day}, ${currentYear}`,
            returnDate: returnTime,
            refundAmount: quantity * randomItem.price * 0.8,
            createdAt: returnTime,
            updatedAt: returnTime
          }
        })

        totalReturns++
      }

      // Generate notifications (2-5 per business day)
      const notificationCount = Math.floor(Math.random() * 4) + 2
      for (let i = 0; i < notificationCount; i++) {
        const notificationTime = new Date(currentYear, currentMonth, day,
          8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60))

        const notificationTypes = [
          'LOW_STOCK_ALERT',
          'ORDER_RECEIVED',
          'REQUEST_APPROVED',
          'REQUEST_REJECTED',
          'SYSTEM_MAINTENANCE',
          'BUDGET_WARNING',
          'SUPPLIER_UPDATE'
        ]

        const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
        const targetRoles = ['ADMIN', 'MANAGER', 'EMPLOYEE']

        const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)]

        await prisma.notification.create({
          data: {
            type: type,
            title: `${type.replace('_', ' ')} - ${monthName} ${day}`,
            message: `Automated notification generated for ${type.toLowerCase().replace('_', ' ')} on ${monthName} ${day}, ${currentYear}`,
            status: Math.random() > 0.3 ? 'UNREAD' : 'READ',
            priority: priorities[Math.floor(Math.random() * priorities.length)],
            targetRole: targetRoles[Math.floor(Math.random() * targetRoles.length)],
            data: JSON.stringify({
              generatedAt: notificationTime.toISOString(),
              day: day,
              month: monthName,
              year: currentYear
            }),
            createdAt: notificationTime,
            updatedAt: notificationTime,
            readAt: Math.random() > 0.7 ? notificationTime : null
          }
        })

        totalNotifications++
      }

      console.log(`      ✅ Day ${day} completed`)
    }

    // Generate demand forecasts for current month
    console.log(`\n📈 Generating demand forecasts for ${monthName} ${currentYear}...`)

    const forecastCount = Math.floor(items.length * 0.4) // Forecast for 40% of items
    const selectedItems = items.sort(() => 0.5 - Math.random()).slice(0, forecastCount)

    for (const item of selectedItems) {
      const periodKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`

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
        const baseDemand = Math.floor(Math.random() * 150) + 50
        const confidence = 0.75 + Math.random() * 0.2

        await prisma.demandForecast.create({
          data: {
            itemId: item.id,
            period: periodKey,
            periodType: 'MONTHLY',
            predictedDemand: baseDemand,
            actualDemand: Math.floor(baseDemand * (0.8 + Math.random() * 0.4)), // Partial month actual
            confidence: confidence,
            algorithm: Math.random() > 0.5 ? 'NEURAL_NETWORK' : 'SEASONAL_ARIMA',
            factors: JSON.stringify({
              currentMonth: true,
              businessDays: 22,
              seasonality: 'high',
              category: item.categoryId,
              recentTrends: 'increasing'
            }),
            createdAt: new Date(currentYear, currentMonth, 1),
            updatedAt: new Date()
          }
        })
      }
    }

    // Generate weekly forecasts for current month
    const weeksInMonth = Math.ceil(currentDay / 7)
    for (let week = 1; week <= weeksInMonth; week++) {
      const weeklyItems = items.sort(() => 0.5 - Math.random()).slice(0, Math.floor(items.length * 0.2))

      for (const item of weeklyItems) {
        const periodKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-W${week}`

        const existingWeeklyForecast = await prisma.demandForecast.findUnique({
          where: {
            itemId_period_periodType: {
              itemId: item.id,
              period: periodKey,
              periodType: 'WEEKLY'
            }
          }
        })

        if (!existingWeeklyForecast) {
          const weeklyDemand = Math.floor(Math.random() * 40) + 10

          await prisma.demandForecast.create({
            data: {
              itemId: item.id,
              period: periodKey,
              periodType: 'WEEKLY',
              predictedDemand: weeklyDemand,
              actualDemand: week < weeksInMonth ? Math.floor(weeklyDemand * (0.85 + Math.random() * 0.3)) : null,
              confidence: 0.65 + Math.random() * 0.25,
              algorithm: 'MOVING_AVERAGE',
              factors: JSON.stringify({
                week: week,
                month: currentMonth + 1,
                businessDaysInWeek: 5,
                category: item.categoryId
              }),
              createdAt: new Date(currentYear, currentMonth, (week - 1) * 7 + 1),
              updatedAt: new Date()
            }
          })
        }
      }
    }

    console.log('\n🎉 Current month data generation completed!')
    console.log(`📊 Summary for ${monthName} ${currentYear}:`)
    console.log(`   📋 Total Requests: ${totalRequests}`)
    console.log(`   🛒 Total Purchase Orders: ${totalOrders}`)
    console.log(`   📊 Total Stock Movements: ${totalMovements}`)
    console.log(`   ↩️ Total Returns: ${totalReturns}`)
    console.log(`   🔔 Total Notifications: ${totalNotifications}`)
    console.log(`   📈 Demand Forecasts: Monthly and Weekly`)
    console.log(`   📅 Days processed: ${currentDay} of ${new Date(currentYear, currentMonth + 1, 0).getDate()}`)

  } catch (error) {
    console.error('❌ Error generating current month data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
generateCurrentMonthData()
