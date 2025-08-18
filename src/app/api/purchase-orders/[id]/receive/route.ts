import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// POST /api/purchase-orders/[id]/receive - Mark order as received
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to receive orders
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Await params to fix Next.js 15 async params issue
    const { id } = await params

    // Find the purchase order
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            item: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Check if order can be received (must be ORDERED or APPROVED)
    if (order.status !== 'ORDERED' && order.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Only ordered or approved orders can be marked as received' },
        { status: 400 }
      )
    }

    // Update order status to RECEIVED
    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id },
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
    console.log('Updating inventory for received items...')
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
          reason: 'Purchase Order Received',
          reference: updatedOrder.orderNumber,
          userId: session.user.id
        }
      })
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'RECEIVE_ORDER',
        entity: 'PURCHASE_ORDER',
        entityId: id,
        performedBy: session.user.id,
        details: `Received purchase order: ${updatedOrder.orderNumber} from supplier: ${updatedOrder.supplier.name} - Amount: $${updatedOrder.totalAmount.toFixed(2)} - Items received and added to inventory`
      }
    })

    // Transform response
    const transformedOrder = {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      supplierId: updatedOrder.supplierId,
      supplier: updatedOrder.supplier.name,
      orderDate: updatedOrder.orderDate.toISOString().split('T')[0],
      expectedDate: updatedOrder.expectedDate?.toISOString().split('T')[0] || null,
      receivedDate: updatedOrder.receivedDate?.toISOString().split('T')[0] || null,
      status: updatedOrder.status,
      totalAmount: updatedOrder.totalAmount,
      notes: updatedOrder.notes || '',
      items: updatedOrder.items.map(item => ({
        id: item.id,
        itemId: item.itemId,
        name: item.item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      itemsCount: updatedOrder.items.length,
      createdAt: updatedOrder.createdAt.toISOString(),
      updatedAt: updatedOrder.updatedAt.toISOString()
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error receiving purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to receive purchase order' },
      { status: 500 }
    )
  }
}