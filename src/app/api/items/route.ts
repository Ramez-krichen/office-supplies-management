import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control'

// GET /api/items - List all items
export async function GET(request: NextRequest) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('INVENTORY', 'view')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { user, userRole, userDepartment, requiresDepartmentFiltering } = accessCheck

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10000') // Increased default limit to show all items
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // Note: Inventory items are global and not department-specific in the current schema
    // Department restriction for managers applies to other features like requests and reports
    
    if (category && category !== 'ALL') {
      where.category = {
        name: category
      }
    }
    
    if (status && status !== 'ALL') {
      if (status === 'low-stock') {
        where.currentStock = {
          lte: prisma.item.fields.minStock
        }
      } else if (status === 'out-of-stock') {
        where.currentStock = 0
      } else if (status === 'in-stock') {
        where.currentStock = {
          gt: 0
        }
      } else if (status === 'discontinued') {
        where.isActive = false
      }
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        select: {
          id: true,
          reference: true,
          name: true,
          description: true,
          unit: true,
          price: true,
          minStock: true,
          currentStock: true,
          isActive: true,
          isEcoFriendly: true,
          ecoRating: true,
          carbonFootprint: true,
          updatedAt: true,
          category: {
            select: {
              name: true
            }
          },
          supplier: {
            select: {
              name: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.item.count({ where })
    ])

    // Transform data to match frontend interface
    const transformedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category.name,
      sku: item.reference,
      description: item.description || '',
      quantity: item.currentStock,
      unit: item.unit,
      minStock: item.minStock,
      maxStock: item.minStock * 10, // Default max stock calculation
      unitPrice: item.price,
      supplier: item.supplier.name,
      location: 'Warehouse A', // Default location
      status: item.currentStock === 0 ? 'out-of-stock' : 
              item.currentStock <= item.minStock ? 'low-stock' : 
              !item.isActive ? 'discontinued' : 'in-stock',
      lastUpdated: item.updatedAt.toISOString(),
      isActive: item.isActive,
      isEcoFriendly: item.isEcoFriendly,
      ecoRating: item.ecoRating,
      carbonFootprint: item.carbonFootprint,
      recyclable: item.recyclable || false
    }))

    const response = NextResponse.json({
      items: transformedItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

    return response
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    )
  }
}

// POST /api/items - Create new item
export async function POST(request: NextRequest) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('INVENTORY', 'create')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { user, userRole, userDepartment, requiresDepartmentFiltering } = accessCheck

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      reference,
      unit,
      price,
      minStock,
      currentStock,
      categoryId,
      supplierId,
      department,
      isEcoFriendly,
      ecoRating,
      carbonFootprint,
      recyclable
    } = body

    // Validate required fields
    if (!name || !reference || !unit || !price || !categoryId || !supplierId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Note: Inventory items are global in the current schema
    // Department restrictions apply to other features like requests and reports

    // Check if reference already exists
    const existingItem = await prisma.item.findUnique({
      where: { reference }
    })

    if (existingItem) {
      return NextResponse.json(
        { error: 'Item reference already exists' },
        { status: 400 }
      )
    }

    const newItem = await prisma.item.create({
      data: {
        name,
        description,
        reference,
        unit,
        price: parseFloat(price),
        minStock: parseInt(minStock) || 0,
        currentStock: parseInt(currentStock) || 0,
        categoryId,
        supplierId,
        isEcoFriendly: Boolean(isEcoFriendly),
        ecoRating: ecoRating ? parseInt(ecoRating) : null,
        carbonFootprint: carbonFootprint ? parseFloat(carbonFootprint) : null,
        recyclable: Boolean(recyclable)
      },
      include: {
        category: true,
        supplier: true
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Item',
        entityId: newItem.id,
        performedBy: session.user.id,
        details: `Created item: ${newItem.name}`
      }
    })

    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    console.error('Error creating item:', error)
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    )
  }
}