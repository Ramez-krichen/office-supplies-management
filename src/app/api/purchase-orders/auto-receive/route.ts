import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// POST /api/purchase-orders/auto-receive - Automatically receive orders due today
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to receive orders
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get today's date (start and end of day)
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    console.log(`Looking for orders with expected delivery date: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`)

    // Find orders that are SENT or CONFIRMED and have expected delivery date of today
    const ordersToReceive = await prisma.purchaseOrder.findMany({
      where: {
        status: {
          in: ['ORDERED', 'APPROVED']
        },
        expectedDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        supplier: true,
        items: {
          include: {
            item: true
          }
        }
      }
    })

    console.log(`Found ${ordersToReceive.length} orders to auto-receive`)

    const processedOrders = []
    const errors = []

    // Process each order
    for (const order of ordersToReceive) {
      try {
        console.log(`Processing order: ${order.orderNumber}`)

        // Update order status to RECEIVED
        const updatedOrder = await prisma.purchaseOrder.update({
          where: { id: order.id },
          data: {
            status: 'RECEIVED',
            receivedDate: new Date(),
            updatedAt: new Date()
          },
          include: {
            supplier: true,
            items: {
              include: {
                item: true
              }
            }
          }
        })

        // Update inventory quantities for received items
        console.log(`Updating inventory for order ${order.orderNumber}...`)
        for (const orderItem of updatedOrder.items) {
          console.log(`Updating item ${orderItem.itemId}: adding ${orderItem.quantity} to current stock`)

          const itemBefore = await prisma.item.findUnique({
            where: { id: orderItem.itemId },
            select: { currentStock: true, name: true }
          })

          const updatedItem = await prisma.item.update({
            where: { id: orderItem.itemId },
            data: {
              currentStock: {
                increment: orderItem.quantity
              }
            }
          })

          console.log(`Item ${itemBefore?.name}: ${itemBefore?.currentStock} -> ${updatedItem.currentStock}`)

          // Create stock movement record
          await prisma.stockMovement.create({
            data: {
              itemId: orderItem.itemId,
              type: 'INBOUND',
              quantity: orderItem.quantity,
              reason: 'Purchase Order Auto-Received (Delivery Date Reached)',
              reference: updatedOrder.orderNumber,
              userId: session.user.id
            }
          })
        }

        // Log the action
        await prisma.auditLog.create({
          data: {
            action: 'AUTO_RECEIVE_ORDER',
            entity: 'PURCHASE_ORDER',
            entityId: order.id,
            performedBy: session.user.id,
            details: `Auto-received purchase order: ${updatedOrder.orderNumber} from supplier: ${updatedOrder.supplier.name} - Amount: $${updatedOrder.totalAmount.toFixed(2)} - Items automatically received and added to inventory on delivery date`
          }
        })

        processedOrders.push({
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          supplier: updatedOrder.supplier.name,
          totalAmount: updatedOrder.totalAmount,
          itemsCount: updatedOrder.items.length
        })

        console.log(`✅ Successfully processed order: ${order.orderNumber}`)

      } catch (error) {
        console.error(`Error processing order ${order.orderNumber}:`, error)
        errors.push({
          orderNumber: order.orderNumber,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedOrders.length} orders automatically`,
      processedOrders,
      errors,
      summary: {
        totalFound: ordersToReceive.length,
        totalProcessed: processedOrders.length,
        totalErrors: errors.length
      }
    })

  } catch (error) {
    console.error('Error in auto-receive process:', error)
    return NextResponse.json(
      { 
        error: 'Failed to auto-receive orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/purchase-orders/auto-receive - Check orders that would be auto-received
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get today's date (start and end of day)
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    // Find orders that are SENT or CONFIRMED and have expected delivery date of today
    const ordersToReceive = await prisma.purchaseOrder.findMany({
      where: {
        status: {
          in: ['ORDERED', 'APPROVED']
        },
        expectedDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        supplier: {
          select: {
            name: true
          }
        },
        items: {
          include: {
            item: {
              select: {
                name: true,
                currentStock: true,
                unit: true
              }
            }
          }
        }
      }
    })

    const orderSummary = ordersToReceive.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      supplier: order.supplier.name,
      status: order.status,
      expectedDate: order.expectedDate?.toISOString().split('T')[0],
      totalAmount: order.totalAmount,
      itemsCount: order.items.length,
      items: order.items.map(item => ({
        name: item.item.name,
        quantity: item.quantity,
        currentStock: item.item.currentStock,
        unit: item.item.unit,
        newStock: item.item.currentStock + item.quantity
      }))
    }))

    return NextResponse.json({
      ordersToReceive: orderSummary,
      count: ordersToReceive.length,
      date: today.toISOString().split('T')[0]
    })

  } catch (error) {
    console.error('Error checking orders for auto-receive:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check orders for auto-receive',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
