import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/suppliers/[id] - Get supplier by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('SUPPLIERS', 'view')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { id } = await params
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        items: true,
        purchaseOrders: {
          orderBy: { orderDate: 'desc' }
        }
      }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
      { status: 500 }
    )
  }
}

// PUT /api/suppliers/[id] - Update supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('SUPPLIERS', 'edit')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate that the user exists in the database
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    })

    if (!userExists) {
      console.error('User not found in database:', session.user.id)
      return NextResponse.json({ error: 'User not found in database' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      address,
      contactPerson,
      status
    } = body
    
    const { id: supplierId } = await params

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    })

    if (!existingSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Check if name is being changed and if it already exists
    if (name && name !== existingSupplier.name) {
      const duplicateSupplier = await prisma.supplier.findFirst({
        where: { 
          name,
          id: { not: supplierId }
        }
      })

      if (duplicateSupplier) {
        return NextResponse.json(
          { error: 'Supplier with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      )
    }

    try {
      // Build update data object
      const updateData: any = {
        name,
        email: email && email.trim() ? email.trim() : null,
        phone: phone && phone.trim() ? phone.trim() : null,
        address: address && address.trim() ? address.trim() : null,
        contactPerson: contactPerson && contactPerson.trim() ? contactPerson.trim() : null
      }

      // Add status if provided (convert frontend format to database format)
      if (status !== undefined) {
        if (status === 'Active' || status === 'Inactive') {
          updateData.status = status === 'Active' ? 'ACTIVE' : 'INACTIVE'
        } else if (status === 'ACTIVE' || status === 'INACTIVE') {
          updateData.status = status
        }
      }

      const updatedSupplier = await prisma.supplier.update({
        where: { id: supplierId },
        data: updateData
      })

      // Create audit log with proper error handling
      try {
        await prisma.auditLog.create({
          data: {
            action: 'UPDATE',
            entity: 'Supplier',
            entityId: updatedSupplier.id,
            performedBy: session.user.id,
            details: `Updated supplier: ${updatedSupplier.name}${status ? ` (Status: ${status})` : ''}`
          }
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
        // Continue with the response even if audit log fails
      }

      return NextResponse.json(updatedSupplier)
    } catch (updateError) {
      console.error('Error in database update operation:', updateError)
      return NextResponse.json(
        { error: 'Database error while updating supplier' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    )
  }
}

// DELETE /api/suppliers/[id] - Delete supplier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('SUPPLIERS', 'delete')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate that the user exists in the database
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    })

    if (!userExists) {
      console.error('User not found in database:', session.user.id)
      return NextResponse.json({ error: 'User not found in database' }, { status: 401 })
    }
    
    const { id: supplierId } = await params

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    })

    if (!existingSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Check if supplier has items or purchase orders
    const [itemCount, orderCount] = await Promise.all([
      prisma.item.count({ where: { supplierId: supplierId } }),
      prisma.purchaseOrder.count({ where: { supplierId: supplierId } })
    ])

    if (itemCount > 0 || orderCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete supplier with existing items or purchase orders',
          details: {
            itemCount,
            orderCount
          }
        },
        { status: 400 }
      )
    }

    // Safe to delete
    const deletedSupplier = await prisma.supplier.delete({
      where: { id: supplierId }
    })

    // Create audit log with proper error handling
    try {
      await prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'Supplier',
          entityId: deletedSupplier.id,
          performedBy: session.user.id,
          details: `Deleted supplier: ${deletedSupplier.name}`
        }
      })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Continue with the response even if audit log fails
    }

    return NextResponse.json({ message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}