import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { detectAndUpdateSupplierCategories, formatCategoryDetectionSummary } from '@/lib/supplier-category-detection'
import { db as prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supplierId = params.id

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, name: true }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Detect and update categories
    const detection = await detectAndUpdateSupplierCategories(supplierId)

    if (!detection) {
      return NextResponse.json({
        success: false,
        message: 'No items found for this supplier or detection failed',
        categories: [],
        summary: 'No categories detected'
      })
    }

    // Create audit log
    try {
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Supplier',
          entityId: supplierId,
          performedBy: session.user.id,
          details: `Auto-detected categories for supplier ${supplier.name}: ${detection.categories.join(', ')}`
        }
      })
    } catch (logError) {
      console.error('Error creating audit log:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Categories detected and updated successfully',
      categories: detection.categories,
      summary: formatCategoryDetectionSummary(detection),
      detectedAt: detection.detectedAt,
      itemCount: detection.itemCount,
      categoryCount: detection.categoryCount
    })

  } catch (error) {
    console.error('Error detecting supplier categories:', error)
    return NextResponse.json(
      { error: 'Failed to detect categories' },
      { status: 500 }
    )
  }
}
