import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/purchase-orders/[id] - Get purchase order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('PURCHASE_ORDERS', 'view')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    // Await params to fix Next.js 15 async params issue
    const { id } = await params

    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            contactPerson: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true
          }
        },
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                reference: true,
                unit: true,
                description: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Transform response
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      supplierId: order.supplierId,
      supplier: order.supplier,
      orderDate: order.orderDate.toISOString().split('T')[0],
      expectedDate: order.expectedDate?.toISOString().split('T')[0] || null,
      status: order.status,
      totalAmount: order.totalAmount,
      notes: order.notes || '',
      createdBy: {
        id: order.createdBy.id,
        name: order.createdBy.name,
        email: order.createdBy.email,
        department: order.createdBy.department
      },
      items: order.items.map(item => ({
        id: item.id,
        itemId: item.itemId,
        item: item.item,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error fetching purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase order' },
      { status: 500 }
    )
  }
}

// PUT /api/purchase-orders/[id] - Update purchase order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('PURCHASE_ORDERS', 'edit')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params to fix Next.js 15 async params issue
    const { id } = await params

    const body = await request.json()
    console.log('Received update request for order:', id)
    console.log('Request body:', JSON.stringify(body, null, 2))

    const {
      status,
      expectedDelivery,
      expectedDate,
      notes,
      items
    } = body

    // Check if order exists
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: true
      }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    
    if (status !== undefined) {
      updateData.status = status
    }
    
    // Handle both expectedDelivery and expectedDate field names
    const expectedDateValue = expectedDelivery !== undefined ? expectedDelivery : expectedDate
    if (expectedDateValue !== undefined) {
      updateData.expectedDate = expectedDateValue ? new Date(expectedDateValue) : null
    }
    
    if (notes !== undefined) {
      updateData.notes = notes || null
    }

    // If items are being updated, recalculate total
    if (items && Array.isArray(items)) {
      // Validate items data
      if (items.length === 0) {
        return NextResponse.json(
          { error: 'At least one item is required' },
          { status: 400 }
        )
      }

      // Check for duplicate items
      const itemIds = items.map((item: any) => item.itemId)
      const uniqueItemIds = [...new Set(itemIds)]
      if (itemIds.length !== uniqueItemIds.length) {
        return NextResponse.json(
          { error: 'Duplicate items are not allowed in the same order' },
          { status: 400 }
        )
      }

      // Validate each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (!item.itemId) {
          return NextResponse.json(
            { error: `Item ${i + 1}: Item ID is required` },
            { status: 400 }
          )
        }
        if (!item.quantity || item.quantity <= 0) {
          return NextResponse.json(
            { error: `Item ${i + 1}: Quantity must be greater than 0` },
            { status: 400 }
          )
        }
        if (!item.unitPrice || item.unitPrice < 0) {
          return NextResponse.json(
            { error: `Item ${i + 1}: Unit price must be 0 or greater` },
            { status: 400 }
          )
        }
      }

      // Verify all items exist
      const existingItems = await prisma.item.findMany({
        where: { id: { in: itemIds } }
      })

      if (existingItems.length !== itemIds.length) {
        return NextResponse.json(
          { error: 'One or more items not found' },
          { status: 404 }
        )
      }

      const totalAmount = items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.unitPrice)
      }, 0)
      updateData.totalAmount = totalAmount

      // Delete existing items and create new ones
      await prisma.orderItem.deleteMany({
        where: { purchaseOrderId: id }
      })

      updateData.items = {
        create: items.map((item: any) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        }))
      }
    }

    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            contactPerson: true
          }
        },
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                reference: true,
                unit: true,
                description: true
              }
            }
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'PurchaseOrder',
        entityId: updatedOrder.id,
        performedBy: session.user.id,
        details: `Updated purchase order: ${updatedOrder.orderNumber}`
      }
    })

    // Transform response
    const transformedOrder = {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      supplierId: updatedOrder.supplierId,
      supplier: updatedOrder.supplier,
      orderDate: updatedOrder.orderDate.toISOString().split('T')[0],
      expectedDate: updatedOrder.expectedDate?.toISOString().split('T')[0] || null,
      status: updatedOrder.status,
      totalAmount: updatedOrder.totalAmount,
      notes: updatedOrder.notes || '',
      items: updatedOrder.items.map(item => ({
        id: item.id,
        itemId: item.itemId,
        item: item.item,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      createdAt: updatedOrder.createdAt.toISOString(),
      updatedAt: updatedOrder.updatedAt.toISOString()
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error updating purchase order:', error)

    // Check for specific database constraint errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Duplicate items are not allowed in the same order' },
          { status: 400 }
        )
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Invalid item or supplier reference' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to update purchase order' },
      { status: 500 }
    )
  }
}

// DELETE /api/purchase-orders/[id] - Delete purchase order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('PURCHASE_ORDERS', 'delete')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params to fix Next.js 15 async params issue
    const { id } = await params

    // Check if order exists
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Check if order can be deleted (only draft orders)
    if (existingOrder.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft purchase orders can be deleted' },
        { status: 400 }
      )
    }

    // Delete order items first, then the order
    await prisma.orderItem.deleteMany({
      where: { purchaseOrderId: id }
    })

    const deletedOrder = await prisma.purchaseOrder.delete({
      where: { id }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'PurchaseOrder',
        entityId: deletedOrder.id,
        performedBy: session.user.id,
        details: `Deleted purchase order: ${deletedOrder.orderNumber}`
      }
    })

    return NextResponse.json({ message: 'Purchase order deleted successfully' })
  } catch (error) {
    console.error('Error deleting purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to delete purchase order' },
      { status: 500 }
    )
  }
}