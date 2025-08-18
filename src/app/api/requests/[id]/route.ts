import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('REQUESTS', 'view')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { user } = accessCheck

    const { id } = await params
    const requestRecord = await db.request.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true
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
                category: true
              }
            }
          }
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            level: 'asc'
          }
        }
      }
    })

    if (!requestRecord) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Transform to match frontend interface
    const latestApproval = requestRecord.approvals.length > 0 
      ? requestRecord.approvals[requestRecord.approvals.length - 1] 
      : null

    const transformedRequest = {
      id: requestRecord.id,
      title: requestRecord.title,
      description: requestRecord.description || '',
      requester: requestRecord.requester.name || '',
      requesterId: requestRecord.requesterId,
      department: requestRecord.department || '',
      status: requestRecord.status,
      priority: requestRecord.priority,
      totalAmount: requestRecord.totalAmount,
      createdAt: requestRecord.createdAt.toISOString().split('T')[0],
      updatedAt: requestRecord.updatedAt.toISOString().split('T')[0],
      approvedBy: latestApproval?.status === 'APPROVED' ? latestApproval.approver.name : undefined,
      approvedAt: latestApproval?.status === 'APPROVED' ? latestApproval.updatedAt.toISOString().split('T')[0] : undefined,
      rejectedReason: latestApproval?.status === 'REJECTED' ? latestApproval.comments : undefined,
      items: requestRecord.items.map(item => ({
        id: item.id,
        itemId: item.item.id, // Add the actual item ID for dropdown selection
        name: item.item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        description: item.notes || undefined,
        category: item.item.category.name
      })),
      notes: requestRecord.description || undefined,
      expectedDelivery: undefined // Not in schema yet
    }

    return NextResponse.json(transformedRequest)
  } catch (error) {
    console.error('Error fetching request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('REQUESTS', 'edit')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { user, userRole } = accessCheck

    const { id: requestId } = await params
    const body = await request.json()
    const {
      title,
      description,
      department,
      priority,
      status,
      items
    } = body

    // Check if request exists
    const existingRequest = await db.request.findUnique({
      where: { id: requestId },
      include: { items: true }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Check if user is authorized to update this request
    // Only the requester, managers, or admins can update
    if (
      existingRequest.requesterId !== user.id &&
      userRole !== 'ADMIN' &&
      userRole !== 'MANAGER'
    ) {
      return NextResponse.json({ error: 'Not authorized to update this request' }, { status: 403 })
    }

    // Calculate total amount if items are provided
    let totalAmount = existingRequest.totalAmount
    if (items && items.length > 0) {
      totalAmount = items.reduce(
        (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
        0
      )
    }

    // Update request
    const updateData: any = {
      title,
      description,
      department,
      priority,
      totalAmount
    }

    // Only managers and admins can update status
    if (status && (userRole === 'ADMIN' || userRole === 'MANAGER')) {
      updateData.status = status
    }

    // Update the request
    const updatedRequest = await db.request.update({
      where: { id: requestId },
      data: updateData,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Handle items update if provided
    if (items && items.length > 0) {
      // Validate that all items have required fields
      for (const item of items) {
        if (!item.itemId) {
          return NextResponse.json({ error: 'Item ID is required for all items' }, { status: 400 })
        }
        if (!item.quantity || item.quantity <= 0) {
          return NextResponse.json({ error: 'Valid quantity is required for all items' }, { status: 400 })
        }
        if (!item.unitPrice || item.unitPrice < 0) {
          return NextResponse.json({ error: 'Valid unit price is required for all items' }, { status: 400 })
        }

        // Check if item exists
        const itemExists = await db.item.findUnique({
          where: { id: item.itemId }
        })

        if (!itemExists) {
          return NextResponse.json({ error: `Item with ID ${item.itemId} not found` }, { status: 400 })
        }
      }

      // Delete existing items
      await db.requestItem.deleteMany({
        where: { requestId }
      })

      // Create new items
      await Promise.all(
        items.map(async (item: any) => {
          return db.requestItem.create({
            data: {
              requestId,
              itemId: item.itemId,
              quantity: parseInt(item.quantity),
              unitPrice: parseFloat(item.unitPrice),
              totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice),
              notes: item.notes || null
            }
          })
        })
      )
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Request',
        entityId: updatedRequest.id,
        performedBy: user.id,
        details: `Updated request: ${updatedRequest.title}`
      }
    })

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Error updating request:', error)
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('REQUESTS', 'delete')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { user, userRole } = accessCheck

    const { id: requestId } = await params

    // Check if request exists
    const existingRequest = await db.request.findUnique({
      where: { id: requestId }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Check if user is authorized to delete this request
    // Only the requester, managers, or admins can delete
    if (
      existingRequest.requesterId !== user.id &&
      userRole !== 'ADMIN' &&
      userRole !== 'MANAGER'
    ) {
      return NextResponse.json({ error: 'Not authorized to delete this request' }, { status: 403 })
    }

    // Delete request items first (cascade should handle this, but being explicit)
    await db.requestItem.deleteMany({
      where: { requestId }
    })

    // Delete approvals
    await db.approval.deleteMany({
      where: { requestId }
    })

    // Delete the request
    await db.request.delete({
      where: { id: requestId }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Request',
        entityId: requestId,
        performedBy: user.id,
        details: `Deleted request: ${existingRequest.title}`
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting request:', error)
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    )
  }
}