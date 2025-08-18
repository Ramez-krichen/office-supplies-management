import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control'

export async function GET(request: Request) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('QUICK_REPORTS', 'view')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { user, userRole, userDepartment, requiresDepartmentFiltering } = accessCheck

    // Get period from query parameters
    const { searchParams } = new URL(request.url)
    const periodParam = searchParams.get('period') || '30'
    const period = Number.isNaN(Number(periodParam)) ? 30 : parseInt(periodParam)

    // Get current date for time-based queries
    const now = new Date()
    const periodStart = new Date(now.getTime() - (period * 24 * 60 * 60 * 1000))
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const currentYear = new Date(now.getFullYear(), 0, 1)

    // Helper function to build department filter
    const buildDepartmentFilter = (field: string) => {
      if (!requiresDepartmentFiltering || !userDepartment) return {}
      
      return {
        [field]: {
          OR: [
            { department: userDepartment },
            { departmentRef: { name: userDepartment } }
          ]
        }
      }
    }

    // Consumption Report Data
    let totalItems = 0
    try {
      totalItems = await prisma.item.count()
    } catch (e) {
      console.error('[quick-reports] failed counting items:', e)
      totalItems = 0
    }
    
    // Get approved requests from selected period
    let approvedRequests: any[] = []
    try {
      approvedRequests = await prisma.request.findMany({
      where: {
        status: 'APPROVED',
        createdAt: {
          gte: periodStart
        },
        // Filter by department for managers
        ...buildDepartmentFilter('requester')
      },
      include: {
        items: {
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        },
        requester: {
          select: {
            department: true,
            departmentRef: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      }
      })
    } catch (e) {
      console.error('[quick-reports] failed fetching approved requests:', e)
      approvedRequests = []
    }

    // Calculate period-specific totals
    const totalConsumed = approvedRequests.reduce((sum, request) => {
      return sum + request.items.reduce((itemSum, requestItem) => itemSum + requestItem.quantity, 0)
    }, 0)

    const periodRequestCost = approvedRequests.reduce((sum, request) => {
      return sum + request.items.reduce((itemSum, requestItem) => {
        return itemSum + (requestItem.totalPrice || (requestItem.quantity * requestItem.item.price))
      }, 0)
    }, 0)

    // Get purchase orders from selected period
    let purchaseOrders: any[] = []
    try {
      purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        createdAt: {
          gte: periodStart
        },
        status: {
          in: ['APPROVED', 'ORDERED', 'RECEIVED'] // Only count orders that represent actual spending
        },
        // Filter by department for managers
        ...buildDepartmentFilter('createdBy')
      },
      include: {
        supplier: true,
        items: {
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        }
      }
      })
    } catch (e) {
      console.error('[quick-reports] failed fetching purchase orders:', e)
      purchaseOrders = []
    }

    const periodPOCost = purchaseOrders.reduce((sum, order) => {
      return sum + order.totalAmount
    }, 0)

    const periodTotalCost = periodRequestCost + periodPOCost

    // Top departments by consumption with costs
    const departmentConsumption = approvedRequests.reduce((acc, request) => {
      const dept = request.requester?.departmentRef?.name || request.requester?.department || 'Unknown'
      const requestTotal = request.items.reduce((sum, item) => sum + item.quantity, 0)
      const requestCost = request.items.reduce((sum, item) => {
        return sum + (item.totalPrice || (item.quantity * item.item.price))
      }, 0)

      if (!acc[dept]) {
        acc[dept] = { consumed: 0, cost: 0 }
      }
      acc[dept].consumed += requestTotal
      acc[dept].cost += requestCost
      return acc
    }, {} as Record<string, { consumed: number; cost: number }>)

    const topDepartments = Object.entries(departmentConsumption)
      .map(([department, data]) => ({
        department,
        consumed: data.consumed,
        cost: data.cost
      }))
      .sort((a, b) => b.consumed - a.consumed)
      .slice(0, 5)

    // Top items by consumption with costs and units
    const itemConsumption = approvedRequests.reduce((acc, request) => {
      request.items.forEach(requestItem => {
        const itemName = requestItem.item.name
        const category = requestItem.item.category?.name || 'Uncategorized'
        const unit = requestItem.item.unit
        const itemCost = requestItem.totalPrice || (requestItem.quantity * requestItem.item.price)

        if (!acc[itemName]) {
          acc[itemName] = {
            consumed: 0,
            category,
            unit,
            cost: 0
          }
        }
        acc[itemName].consumed += requestItem.quantity
        acc[itemName].cost += itemCost
      })
      return acc
    }, {} as Record<string, { consumed: number; category: string; unit: string; cost: number }>)

    const topItems = Object.entries(itemConsumption)
      .map(([name, data]) => ({
        name,
        consumed: data.consumed,
        category: data.category,
        unit: data.unit,
        cost: data.cost
      }))
      .sort((a, b) => b.consumed - a.consumed)
      .slice(0, 5)

    // Cost Analysis Data
    let requests: any[] = []
    try {
      requests = await prisma.request.findMany({
      where: {
        status: {
          in: ['APPROVED', 'COMPLETED']
        },
        createdAt: {
          gte: periodStart
        },
        // Filter by department for managers
        ...buildDepartmentFilter('requester')
      },
      include: {
        items: {
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        },
        requester: {
          select: {
            department: true,
            departmentRef: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      }
      })
    } catch (e) {
      console.error('[quick-reports] failed fetching cost analysis requests:', e)
      requests = []
    }

    const totalCost = requests.reduce((sum, request) => {
      return sum + request.items.reduce((itemSum, requestItem) => {
        return itemSum + (requestItem.totalPrice || (requestItem.quantity * requestItem.item.price))
      }, 0)
    }, 0)
    
    const monthlyRequests = requests.filter(r => r.createdAt >= currentMonth)
    const monthlyRequestSpend = monthlyRequests.reduce((sum, request) => {
      return sum + request.items.reduce((itemSum, requestItem) => {
        return itemSum + (requestItem.totalPrice || (requestItem.quantity * requestItem.item.price))
      }, 0)
    }, 0)

    // Get monthly purchase orders spending
    let monthlyPurchaseOrders: any[] = []
    try {
      monthlyPurchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        createdAt: {
          gte: currentMonth
        },
        status: {
          in: ['APPROVED', 'ORDERED', 'RECEIVED']
        },
        // Filter by department for managers
        ...buildDepartmentFilter('createdBy')
      }
      })
    } catch (e) {
      console.error('[quick-reports] failed fetching monthly POs:', e)
      monthlyPurchaseOrders = []
    }

    const monthlyPOSpend = monthlyPurchaseOrders.reduce((sum, order) => {
      return sum + order.totalAmount
    }, 0)

    const monthlyTotalSpend = monthlyRequestSpend + monthlyPOSpend

    // Get last month spending for comparison
    const lastMonthRequests = requests.filter(r => r.createdAt >= lastMonth && r.createdAt < currentMonth)
    const lastMonthRequestSpend = lastMonthRequests.reduce((sum, request) => {
      return sum + request.items.reduce((itemSum, requestItem) => {
        return itemSum + (requestItem.totalPrice || (requestItem.quantity * requestItem.item.price))
      }, 0)
    }, 0)

    let lastMonthPurchaseOrders: any[] = []
    try {
      lastMonthPurchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        createdAt: {
          gte: lastMonth,
          lt: currentMonth
        },
        status: {
          in: ['APPROVED', 'ORDERED', 'RECEIVED']
        },
        // Filter by department for managers
        ...buildDepartmentFilter('createdBy')
      }
      })
    } catch (e) {
      console.error('[quick-reports] failed fetching last month POs:', e)
      lastMonthPurchaseOrders = []
    }

    const lastMonthPOSpend = lastMonthPurchaseOrders.reduce((sum, order) => {
      return sum + order.totalAmount
    }, 0)

    const lastMonthTotalSpend = lastMonthRequestSpend + lastMonthPOSpend

    // Calculate percentage change
    const spendingChange = lastMonthTotalSpend > 0 
      ? ((monthlyTotalSpend - lastMonthTotalSpend) / lastMonthTotalSpend) * 100 
      : 0

    // Category breakdown with item counts
    const categoryBreakdown = requests.reduce((acc, request) => {
      request.items.forEach(requestItem => {
        const category = requestItem.item.category?.name || 'Uncategorized'
        const cost = requestItem.totalPrice || (requestItem.quantity * requestItem.item.price)
        
        if (!acc[category]) {
          acc[category] = { amount: 0, itemCount: 0 }
        }
        acc[category].amount += cost
        acc[category].itemCount += requestItem.quantity
      })
      return acc
    }, {} as Record<string, { amount: number; itemCount: number }>)

    const topCategories = Object.entries(categoryBreakdown)
      .map(([category, data]) => ({ category, amount: data.amount, itemCount: data.itemCount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Department breakdown with order counts
    const departmentBreakdown = requests.reduce((acc, request) => {
      const department = request.requester?.departmentRef?.name || request.requester?.department || 'Unknown'
      const cost = request.items.reduce((sum, item) => {
        return sum + (item.totalPrice || (item.quantity * item.item.price))
      }, 0)
      
      if (!acc[department]) {
        acc[department] = { amount: 0, orderCount: 0 }
      }
      acc[department].amount += cost
      acc[department].orderCount += 1
      return acc
    }, {} as Record<string, { amount: number; orderCount: number }>)

    const topDepartmentsBySpending = Object.entries(departmentBreakdown)
      .map(([department, data]) => ({ department, amount: data.amount, orderCount: data.orderCount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    // Helper function to get low stock items
    const getLowStockItems = async () => {
      try {
        const allItems = await prisma.item.findMany({
          where: {
            isActive: true
          },
          include: {
            category: true
          }
        })
        
        // Filter items where currentStock <= minStock
        const lowStockItems = allItems.filter(item =>
          item.currentStock <= item.minStock || item.currentStock <= 5
        ).slice(0, 20)
        
        return lowStockItems
      } catch (e) {
        console.error('[quick-reports] failed fetching low stock items:', e)
        return []
      }
    }

    // Forecast Data
    let forecastData: any[] = []
    try {
      forecastData = await prisma.demandForecast.findMany({
      where: {
        createdAt: {
          gte: periodStart
        }
      },
      include: {
        item: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
      })
    } catch (e) {
      console.error('[quick-reports] failed fetching forecast data:', e)
      forecastData = []
    }

    // If no forecast data, create some basic predictions based on recent consumption
    if (forecastData.length === 0) {
      try {
        const recentlyConsumedItems = await prisma.item.findMany({
          where: {
            isActive: true,
            requestItems: {
              some: {
                request: {
                  status: 'APPROVED',
                  createdAt: {
                    gte: periodStart
                  }
                }
              }
            }
          },
          include: {
            category: true,
            requestItems: {
              where: {
                request: {
                  status: 'APPROVED',
                  createdAt: {
                    gte: periodStart
                  }
                }
              }
            }
          },
          take: 10
        })

        forecastData = recentlyConsumedItems.map(item => {
          const totalConsumed = item.requestItems.reduce((sum, ri) => sum + ri.quantity, 0)
          const predictedDemand = Math.ceil(totalConsumed * 1.2) // 20% increase prediction
          
          return {
            id: `forecast-${item.id}`,
            itemId: item.id,
            predictedDemand,
            item,
            period: `${period}days`,
            periodType: 'days',
            confidence: 0.7,
            algorithm: 'simple_trend'
          }
        })
      } catch (e) {
        console.error('[quick-reports] failed creating forecast data:', e)
      }
    }

    // Filter forecast data by department if needed
    const filteredForecastData = requiresDepartmentFiltering && userDepartment
      ? forecastData.filter(forecast => {
          // This is a simplified filter - you might need to adjust based on your forecast data structure
          return true // For now, include all forecasts
        })
      : forecastData

    return NextResponse.json({
      consumption: {
        totalItems,
        totalConsumed,
        periodRequestCost,
        periodPOCost,
        periodTotalCost,
        topDepartments,
        topItems
      },
      costAnalysis: {
        totalCost,
        monthlyTotalSpend,
        lastMonthTotalSpend,
        spendingChange,
        topCategories,
        topDepartments: topDepartmentsBySpending
      },
      forecast: {
        items: filteredForecastData.slice(0, 10),
        totalForecasts: filteredForecastData.length,
        lowStockItems: await getLowStockItems()
      }
    })
  } catch (error) {
    console.error('Error fetching quick reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}