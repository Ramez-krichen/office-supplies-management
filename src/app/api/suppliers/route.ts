import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control'

// GET /api/suppliers - List all suppliers
export async function GET(request: NextRequest) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('SUPPLIERS', 'view')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          items: {
            select: {
              id: true
            }
          },
          purchaseOrders: {
            select: {
              id: true,
              orderDate: true
            },
            orderBy: {
              orderDate: 'desc'
            },
            take: 1
          }
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.supplier.count({ where })
    ])

    // Transform data to match frontend interface
    const transformedSuppliers = suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      contactPerson: supplier.contactPerson || '',
      contactTitle: '', // Not in schema, default empty
      website: '', // Not in schema, default empty
      taxId: '', // Not in schema, default empty
      paymentTerms: 'Net 30', // Default payment terms
      itemsCount: supplier.items.length,
      totalOrders: supplier.purchaseOrders.length,
      lastOrderDate: supplier.purchaseOrders[0]?.orderDate.toISOString().split('T')[0] || '',
      status: 'Active' as const, // Default status
      rating: 0, // Default rating
      categories: [], // Default empty categories
      createdAt: supplier.createdAt.toISOString().split('T')[0],
      updatedAt: supplier.updatedAt.toISOString().split('T')[0],
      notes: '' // Default empty notes
    }))

    return NextResponse.json({
      suppliers: transformedSuppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

// POST /api/suppliers - Create new supplier
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      address,
      contactPerson
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      )
    }

    if (!contactPerson) {
      return NextResponse.json(
        { error: 'Contact person is required' },
        { status: 400 }
      )
    }

    // Check if supplier with same name already exists
    try {
      const trimmedName = name.trim()
      
      const existingSupplier = await prisma.supplier.findFirst({
        where: {
          name: trimmedName
        }
      })

      if (existingSupplier) {
        return NextResponse.json(
          { error: 'Supplier with this name already exists' },
          { status: 400 }
        )
      }
    } catch (findError) {
      console.error('Error checking for existing supplier:', findError)
      return NextResponse.json(
        { error: 'Database error: Failed to check for existing supplier', details: findError instanceof Error ? findError.message : 'Unknown database error' },
        { status: 500 }
      )
    }

    // Create the supplier
    try {
      // Sanitize input data
      const sanitizedData = {
        name: name.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        contactPerson: contactPerson ? contactPerson.trim() : null,
        // Add optional fields if they exist in the request
        website: body.website ? body.website.trim() : null,
        taxId: body.taxId ? body.taxId.trim() : null,
        paymentTerms: body.paymentTerms ? body.paymentTerms.trim() : null,
        notes: body.notes ? body.notes.trim() : null
      }

      const newSupplier = await prisma.supplier.create({
        data: sanitizedData
      })

      // Create audit log in a separate try-catch to ensure it doesn't affect the main operation
      try {
        await prisma.auditLog.create({
          data: {
            action: 'CREATE',
            entity: 'Supplier',
            entityId: newSupplier.id,
            performedBy: session.user.id,
            details: `Created supplier: ${newSupplier.name}`
          }
        })
      } catch (logError) {
        // Just log the error but don't fail the operation if audit logging fails
        console.error('Error creating audit log:', logError)
      }

      return NextResponse.json(newSupplier, { status: 201 })
    } catch (dbError) {
      console.error('Database error creating supplier:', dbError)
      
      // Handle specific Prisma errors
      if (dbError instanceof PrismaClientKnownRequestError) {
        // P2002 is the error code for unique constraint violations
        if (dbError.code === 'P2002') {
          return NextResponse.json(
            { error: 'Supplier with this name already exists', details: 'A supplier with this name is already in the database' },
            { status: 400 }
          )
        }
      }
      
      return NextResponse.json(
        { error: 'Database error: Failed to create supplier', details: dbError instanceof Error ? dbError.message : 'Unknown database error' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}