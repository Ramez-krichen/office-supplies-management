import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control'

export async function GET(request: Request) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('REPORTS', 'view')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { user, userRole, userDepartment, requiresDepartmentFiltering } = accessCheck

    // Optional department override via query string (admins only)
    const url = new URL(request.url)
    const deptParam = url.searchParams.get('department')
    const effectiveDepartment = (deptParam && userRole === 'ADMIN') ? deptParam : userDepartment
    const effectiveRequiresDeptFiltering = requiresDepartmentFiltering || Boolean(deptParam)

    // Get current date and calculate date ranges
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

    // Helper function to build department filter
    const buildDepartmentFilter = (field: string) => {
      if (!effectiveRequiresDeptFiltering || !effectiveDepartment) return {}
      
      return {
        [field]: {
          OR: [
            { department: effectiveDepartment },
            { departmentRef: { name: effectiveDepartment } }
          ]
        }
      }
    }

    // Monthly spending (current month) - Include both requests and purchase orders
    const currentMonthRequestsWhere: any = {
      createdAt: {
        gte: currentMonth,
      },
      status: { in: ['APPROVED', 'COMPLETED'] }
    }
    
    // Add department filter for managers
    Object.assign(currentMonthRequestsWhere, buildDepartmentFilter('requester'))
    
    // Add personal filter for employees
    if (userRole === 'EMPLOYEE') {
      currentMonthRequestsWhere.requesterId = user.id
    }

    const currentMonthRequests = await prisma.request.findMany({
      where: currentMonthRequestsWhere,
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    })

    const currentMonthRequestSpending = currentMonthRequests.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
      }, 0)
    }, 0)

    // Get purchase orders spending for current month
    const currentMonthPOWhere: any = {
      createdAt: {
        gte: currentMonth,
      },
      status: {
        in: ['SENT', 'CONFIRMED', 'RECEIVED'] // Count all active purchase orders
      }
    }
    
    // Add department filter for managers
    Object.assign(currentMonthPOWhere, buildDepartmentFilter('createdBy'))
    
    // Add personal filter for employees
    if (userRole === 'EMPLOYEE') {
      currentMonthPOWhere.createdById = user.id
    }

    const currentMonthPurchaseOrders = await prisma.purchaseOrder.findMany({
      where: currentMonthPOWhere
    })

    const currentMonthPOSpending = currentMonthPurchaseOrders.reduce((total, order) => {
      return total + order.totalAmount
    }, 0)

    const currentMonthSpending = currentMonthRequestSpending + currentMonthPOSpending

    // Last month spending for comparison - Include both requests and purchase orders
    const lastMonthRequestsWhere: any = {
      createdAt: {
        gte: lastMonth,
        lt: currentMonth,
      },
      status: { in: ['APPROVED', 'COMPLETED'] }
    }
    
    // Add department filter for managers
    Object.assign(lastMonthRequestsWhere, buildDepartmentFilter('requester'))
    
    // Add personal filter for employees
    if (userRole === 'EMPLOYEE') {
      lastMonthRequestsWhere.requesterId = user.id
    }

    const lastMonthRequests = await prisma.request.findMany({
      where: lastMonthRequestsWhere,
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    })

    const lastMonthRequestSpending = lastMonthRequests.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
      }, 0)
    }, 0)

    // Get purchase orders spending for last month
    const lastMonthPOWhere: any = {
      createdAt: {
        gte: lastMonth,
        lt: currentMonth,
      },
      status: {
        in: ['SENT', 'CONFIRMED', 'RECEIVED']
      }
    }
    
    // Add department filter for managers
    Object.assign(lastMonthPOWhere, buildDepartmentFilter('createdBy'))
    
    // Add personal filter for employees
    if (userRole === 'EMPLOYEE') {
      lastMonthPOWhere.createdById = user.id
    }

    const lastMonthPurchaseOrders = await prisma.purchaseOrder.findMany({
      where: lastMonthPOWhere
    })

    const lastMonthPOSpending = lastMonthPurchaseOrders.reduce((total, order) => {
      return total + order.totalAmount
    }, 0)

    const lastMonthSpending = lastMonthRequestSpending + lastMonthPOSpending

    // Requests processed this month
    const requestsProcessed = await prisma.request.count({
      where: {
        createdAt: {
          gte: currentMonth,
        },
        // Filter by department for managers
        ...buildDepartmentFilter('requester'),
        status: { in: ['APPROVED', 'COMPLETED'] }
      }
    })

    // Last month requests for comparison
    const lastMonthRequestsCount = await prisma.request.count({
      where: {
        createdAt: {
          gte: lastMonth,
          lt: currentMonth,
        },
        // Filter by department for managers
        ...buildDepartmentFilter('requester'),
        status: { in: ['APPROVED', 'COMPLETED'] }
      }
    })

    // Items ordered this month
    const itemsOrdered = currentMonthRequests.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + requestItem.quantity
      }, 0)
    }, 0)

    // Last month items for comparison
    const lastMonthItems = lastMonthRequests.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + requestItem.quantity
      }, 0)
    }, 0)

    // Average order value
    const avgOrderValue = requestsProcessed > 0 ? currentMonthSpending / requestsProcessed : 0
    const lastMonthAvgOrderValue = lastMonthRequestsCount > 0 ? lastMonthSpending / lastMonthRequestsCount : 0

    // Calculate percentage changes
    const spendingChange = lastMonthSpending > 0 ? ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100 : 0
    const requestsChange = lastMonthRequestsCount > 0 ? ((requestsProcessed - lastMonthRequestsCount) / lastMonthRequestsCount) * 100 : 0
    const itemsChange = lastMonthItems > 0 ? ((itemsOrdered - lastMonthItems) / lastMonthItems) * 100 : 0
    const avgOrderChange = lastMonthAvgOrderValue > 0 ? ((avgOrderValue - lastMonthAvgOrderValue) / lastMonthAvgOrderValue) * 100 : 0

    // Cost by Category - Filter by department for managers
    const categorySpending = await prisma.category.findMany({
      include: {
        items: {
          include: {
            requestItems: {
              where: {
                request: {
                  createdAt: {
                    gte: currentMonth,
                  },
                  status: { in: ['APPROVED', 'COMPLETED'] },
                  // Filter by department for managers
                  ...buildDepartmentFilter('requester')
                }
              },
              include: {
                item: true
              }
            }
          }
        }
      }
    })

    const costByCategory = categorySpending.map(category => {
      const items = category.items.filter(item => item.requestItems.length > 0)
      const totalCost = category.items.reduce((total, item) => {
        return total + item.requestItems.reduce((itemTotal, requestItem) => {
          return itemTotal + (requestItem.totalPrice || (item.price * requestItem.quantity))
        }, 0)
      }, 0)
      const itemCount = items.reduce((count, item) => {
        return count + item.requestItems.reduce((itemCount, requestItem) => {
          return itemCount + requestItem.quantity
        }, 0)
      }, 0)
      
      return {
        category: category.name,
        totalCost: Math.round(totalCost),
        itemCount: itemCount
      }
    }).filter(cat => cat.totalCost > 0)

    // Legacy format for existing analytics consumers
    const categoryData = costByCategory.map(cat => ({
      name: cat.category,
      amount: cat.totalCost
    }))

    const totalCategorySpending = categoryData.reduce((total, cat) => total + cat.amount, 0)
    const topCategories = categoryData
      .map(cat => ({
        ...cat,
        percentage: totalCategorySpending > 0 ? Math.round((cat.amount / totalCategorySpending) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Top suppliers - Filter by department for managers
    const supplierData = await prisma.supplier.findMany({
      include: {
        items: {
          include: {
            requestItems: {
              where: {
                request: {
                  createdAt: {
                    gte: currentMonth,
                  },
                  status: { in: ['APPROVED', 'COMPLETED'] },
                  // Filter by department for managers
                  ...buildDepartmentFilter('requester')
                }
              },
              include: {
                item: true,
                request: true
              }
            }
          }
        }
      }
    })

    const topSuppliers = supplierData.map(supplier => {
      const orders = new Set()
      const amount = supplier.items.reduce((total, item) => {
        return total + item.requestItems.reduce((itemTotal, requestItem) => {
          orders.add(requestItem.request.id)
          return itemTotal + (requestItem.totalPrice || (item.price * requestItem.quantity))
        }, 0)
      }, 0)
      return {
        name: supplier.name,
        orders: orders.size,
        amount: Math.round(amount)
      }
    })
      .filter(supplier => supplier.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4)

    // Monthly trend (last 12 months) - Include both requests and purchase orders
    const monthlyTrend = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const monthRequestsWhere: any = {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
        status: { in: ['APPROVED', 'COMPLETED'] }
      }
      
      // Add department filter for managers
      Object.assign(monthRequestsWhere, buildDepartmentFilter('requester'))
      
      // Add personal filter for employees
      if (userRole === 'EMPLOYEE') {
        monthRequestsWhere.requesterId = user.id
      }

      const monthRequests = await prisma.request.findMany({
        where: monthRequestsWhere,
        include: {
          items: {
            include: {
              item: true
            }
          }
        }
      })

      const monthRequestSpending = monthRequests.reduce((total, request) => {
        return total + request.items.reduce((itemTotal, requestItem) => {
          return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
        }, 0)
      }, 0)

      // Get purchase orders for this month
      const monthPOWhere: any = {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
        status: {
          in: ['SENT', 'CONFIRMED', 'RECEIVED']
        }
      }
      
      // Add department filter for managers
      Object.assign(monthPOWhere, buildDepartmentFilter('createdBy'))
      
      // Add personal filter for employees
      if (userRole === 'EMPLOYEE') {
        monthPOWhere.createdById = user.id
      }

      const monthPurchaseOrders = await prisma.purchaseOrder.findMany({
        where: monthPOWhere
      })

      const monthPOSpending = monthPurchaseOrders.reduce((total, order) => {
        return total + order.totalAmount
      }, 0)

      const monthSpending = monthRequestSpending + monthPOSpending

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        amount: Math.round(monthSpending)
      })
    }

    // Cost by Department - Filter by department for managers
    const departmentSpending = await prisma.request.findMany({
      where: {
        createdAt: {
          gte: currentMonth,
        },
        status: { in: ['APPROVED', 'COMPLETED'] },
        // Filter by department for managers
        ...buildDepartmentFilter('requester')
      },
      include: {
        items: {
          include: {
            item: true
          }
        },
        requester: {
          select: {
            department: true,
            departmentRef: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    const departmentCosts = departmentSpending.reduce((acc, request) => {
      const deptName = request.requester?.departmentRef?.name || request.requester?.department || 'Unknown'
      const requestCost = request.items.reduce((sum, item) => {
        return sum + (item.totalPrice || (item.quantity * item.item.price))
      }, 0)
      
      if (!acc[deptName]) {
        acc[deptName] = { totalCost: 0, orderCount: 0 }
      }
      acc[deptName].totalCost += requestCost
      acc[deptName].orderCount += 1
      return acc
    }, {} as Record<string, { totalCost: number; orderCount: number }>)

    const costByDepartment = Object.entries(departmentCosts)
      .map(([department, data]) => ({
        department,
        totalCost: Math.round(data.totalCost),
        orderCount: data.orderCount
      }))
      .sort((a, b) => b.totalCost - a.totalCost)

    return NextResponse.json({
      reportCards: [
        {
          title: 'Monthly Spending',
          value: `$${currentMonthSpending.toLocaleString()}`,
          change: `${spendingChange >= 0 ? '+' : ''}${spendingChange.toFixed(1)}%`,
          changeType: spendingChange >= 0 ? 'increase' : 'decrease',
          description: 'Total spending this month',
        },
        {
          title: 'Requests Processed',
          value: requestsProcessed.toString(),
          change: `${requestsChange >= 0 ? '+' : ''}${requestsChange.toFixed(1)}%`,
          changeType: requestsChange >= 0 ? 'increase' : 'decrease',
          description: 'Requests completed this month',
        },
        {
          title: 'Items Ordered',
          value: itemsOrdered.toLocaleString(),
          change: `${itemsChange >= 0 ? '+' : ''}${itemsChange.toFixed(1)}%`,
          changeType: itemsChange >= 0 ? 'increase' : 'decrease',
          description: 'Total items ordered this month',
        },
        {
          title: 'Average Order Value',
          value: `$${avgOrderValue.toFixed(2)}`,
          change: `${avgOrderChange >= 0 ? '+' : ''}${avgOrderChange.toFixed(1)}%`,
          changeType: avgOrderChange >= 0 ? 'increase' : 'decrease',
          description: 'Average value per order',
        },
      ],
      topCategories,
      topSuppliers,
      monthlyTrend,
      // Add the new data structures for the Cost Analysis tab
      costByCategory,
      costByDepartment
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}