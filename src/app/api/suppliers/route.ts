import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control'
import { 
  detectAndUpdateSupplierCategoriesEnhanced, 
  parseSupplierCategoriesEnhanced 
} from '@/lib/supplier-category-detection'

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
    const search = searchParams.get('search')
    const enhanced = searchParams.get('enhanced') !== 'false' // Default to enhanced parsing

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, any> = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { contactPerson: { contains: search } }
      ]
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          contactPerson: true,
          contactTitle: true,
          website: true,
          taxId: true,
          paymentTerms: true,
          notes: true,
          status: true,
          categories: true,
          categoriesDetectedAt: true,
          createdAt: true,
          updatedAt: true,
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

    // Transform data to match frontend interface with enhanced category parsing
    const transformedSuppliers = suppliers.map(supplier => {
      let categoryData: { categories: string[], confidence: number, detectionMethods: string[] } = { 
        categories: [], 
        confidence: 0, 
        detectionMethods: [] 
      }
      
      if (enhanced && supplier.categories) {
        try {
          const parsed = parseSupplierCategoriesEnhanced(supplier.categories)
          categoryData = {
            categories: parsed.categories || [],
            confidence: parsed.confidence || 0,
            detectionMethods: parsed.detectionMethods || []
          }
        } catch (parseError) {
          console.error(`Error parsing enhanced categories for supplier ${supplier.name}:`, parseError)
          categoryData.categories = []
        }
      } else if (supplier.categories) {
        // Fallback to basic parsing
        try {
          const parsed = JSON.parse(supplier.categories)
          categoryData.categories = Array.isArray(parsed) ? parsed : (parsed.categories || [])
          
          // Debug logging for development
          if (supplier.name.toLowerCase().includes('clean')) {
            console.log(`Clean & Fresh Supplies basic category parsing:`, {
              raw: supplier.categories,
              parsed: parsed,
              final: categoryData.categories
            })
          }
        } catch (parseError) {
          console.error(`Error parsing basic categories for supplier ${supplier.name}:`, parseError)
          categoryData.categories = []
        }
      }

      return {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        contactPerson: supplier.contactPerson || '',
        contactTitle: supplier.contactTitle || '',
        website: supplier.website || '',
        taxId: supplier.taxId || '',
        paymentTerms: supplier.paymentTerms || 'Net 30',
        itemsCount: supplier.items.length,
        totalOrders: supplier.purchaseOrders.length,
        lastOrderDate: supplier.purchaseOrders[0]?.orderDate.toISOString().split('T')[0] || '',
        status: supplier.status === 'ACTIVE' ? 'Active' : supplier.status === 'INACTIVE' ? 'Inactive' : 'Active',
        rating: 0,
        categories: categoryData.categories,
        categoryConfidence: categoryData.confidence,
        categoryDetectionMethods: categoryData.detectionMethods,
        categoriesDetectedAt: supplier.categoriesDetectedAt?.toISOString() || null,
        createdAt: supplier.createdAt.toISOString().split('T')[0],
        updatedAt: supplier.updatedAt.toISOString().split('T')[0],
        notes: supplier.notes || '',
        enhanced
      }
    })

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
      contactPerson,
      contactTitle,
      website,
      taxId,
      paymentTerms,
      notes,
      categories,
      autoDetectCategories = true
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
        contactTitle: contactTitle ? contactTitle.trim() : null,
        website: website ? website.trim() : null,
        taxId: taxId ? taxId.trim() : null,
        paymentTerms: paymentTerms ? paymentTerms.trim() : null,
        notes: notes ? notes.trim() : null,
        categories: categories && Array.isArray(categories) ? JSON.stringify(categories) : null,
        categoriesDetectedAt: categories && Array.isArray(categories) ? new Date() : null
      }

      const newSupplier = await prisma.supplier.create({
        data: sanitizedData
      })

      // Enhanced auto-detection based on supplier profile
      if (autoDetectCategories && (!categories || categories.length === 0)) {
        // Schedule enhanced category detection
        setTimeout(async () => {
          try {
            const detection = await detectAndUpdateSupplierCategoriesEnhanced(newSupplier.id)
            if (detection) {
              console.log(`Enhanced auto-detection for new supplier ${newSupplier.name}:`, {
                categories: detection.categories,
                confidence: detection.confidence,
                methods: detection.detectionMethods
              })
            }
          } catch (error) {
            console.error('Error in background enhanced category detection:', error)
          }
        }, 1000)
      }

      // Create audit log
      try {
        await prisma.auditLog.create({
          data: {
            action: 'CREATE',
            entity: 'Supplier',
            entityId: newSupplier.id,
            performedBy: session.user.id,
            details: `Created supplier: ${newSupplier.name}${autoDetectCategories ? ' (auto-detection enabled)' : ''}`
          }
        })
      } catch (logError) {
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