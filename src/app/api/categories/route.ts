import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control'

// GET /api/categories - List all categories
export async function GET(request: NextRequest) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('INVENTORY', 'view')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        items: {
          select: {
            id: true
          }
        }
      }
    })

    const categoriesWithCount = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      itemsCount: category.items.length,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }))

    return NextResponse.json({
      categories: categoriesWithCount,
      total: categories.length
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('INVENTORY', 'create')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const body = await request.json()
    const { name, description } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    // Check if category already exists
    const existingCategory = await prisma.category.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 400 }
      )
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        description
      }
    })

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}