import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// POST /api/purchase-orders/[id]/send - Send order to supplier
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to send orders
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

    // Check if order can be sent (must be in DRAFT status)
    if (order.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft orders can be sent' },
        { status: 400 }
      )
    }

    // Update order status to ORDERED
    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'ORDERED',
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

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'SEND_ORDER',
        entity: 'PURCHASE_ORDER',
        entityId: id,
        performedBy: session.user.id,
        details: `Sent purchase order: ${updatedOrder.orderNumber} to supplier: ${updatedOrder.supplier.name} - Amount: $${updatedOrder.totalAmount.toFixed(2)}`
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
    console.error('Error sending purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to send purchase order' },
      { status: 500 }
    )
  }
}