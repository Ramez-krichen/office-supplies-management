import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control'

// GET /api/purchase-orders - List all purchase orders
export async function GET(request: NextRequest) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('PURCHASE_ORDERS', 'view')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10000') // Increased default limit to show all orders
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    
    if (supplierId) {
      where.supplierId = supplierId
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
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
                  unit: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' }
      }),
      prisma.purchaseOrder.count({ where })
    ])

    // Transform data to match frontend interface
    const transformedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      supplierId: order.supplierId,
      supplierName: order.supplier.name,
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
        itemName: item.item.name,
        itemReference: item.item.reference,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        unit: item.item.unit
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    }))

    return NextResponse.json({
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders' },
      { status: 500 }
    )
  }
}

// POST /api/purchase-orders - Create new purchase order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      supplierId,
      expectedDelivery,
      notes,
      items
    } = body

    // Validate required fields
    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier is required' },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
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

    // Validate supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Validate all items exist
    const itemIds = items.map((item: any) => item.itemId)
    const existingItems = await prisma.item.findMany({
      where: { id: { in: itemIds } }
    })

    if (existingItems.length !== itemIds.length) {
      return NextResponse.json(
        { error: 'One or more items not found' },
        { status: 404 }
      )
    }

    // Generate order number
    const orderCount = await prisma.purchaseOrder.count()
    const orderNumber = `PO-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice)
    }, 0)

    // Create purchase order with items
    const newOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId,
        createdById: session.user.id,
        orderDate: new Date(),
        expectedDate: expectedDelivery ? new Date(expectedDelivery) : null,
        status: 'DRAFT',
        totalAmount,
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice
          }))
        }
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                reference: true,
                unit: true
              }
            }
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'PurchaseOrder',
        entityId: newOrder.id,
        performedBy: session.user.id,
        details: `Created purchase order: ${newOrder.orderNumber} for supplier: ${supplier.name}`
      }
    })

    // Transform response
    const transformedOrder = {
      id: newOrder.id,
      orderNumber: newOrder.orderNumber,
      supplierId: newOrder.supplierId,
      supplierName: newOrder.supplier.name,
      orderDate: newOrder.orderDate.toISOString().split('T')[0],
      expectedDate: newOrder.expectedDate?.toISOString().split('T')[0] || null,
      status: newOrder.status,
      totalAmount: newOrder.totalAmount,
      notes: newOrder.notes || '',
      items: newOrder.items.map(item => ({
        id: item.id,
        itemId: item.itemId,
        itemName: item.item.name,
        itemReference: item.item.reference,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        unit: item.item.unit
      })),
      createdAt: newOrder.createdAt.toISOString(),
      updatedAt: newOrder.updatedAt.toISOString()
    }

    return NextResponse.json(transformedOrder, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase order:', error)

    // Check for specific database constraint errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Duplicate order number or constraint violation' },
          { status: 400 }
        )
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Invalid supplier or item reference' },
          { status: 400 }
        )
      }
      if (error.message.includes('Invalid date')) {
        return NextResponse.json(
          { error: 'Invalid expected delivery date' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create purchase order. Please check your data and try again.' },
      { status: 500 }
    )
  }
}