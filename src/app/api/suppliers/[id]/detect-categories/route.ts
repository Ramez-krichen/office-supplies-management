import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { 
  detectAndUpdateSupplierCategoriesEnhanced, 
  formatCategoryDetectionSummaryEnhanced,
  detectAndUpdateSupplierCategories,
  formatCategoryDetectionSummary,
  parseSupplierCategoriesEnhanced,
  parseSupplierCategories,
  CategorySuggestion
} from '@/lib/supplier-category-detection'
import { db as prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Properly await params before accessing properties
    const { id: supplierId } = await params
    const body = await request.json().catch(() => ({}))
    const useEnhanced = body.enhanced !== false // Default to enhanced unless explicitly disabled

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, name: true }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Validate that the user exists in the database before creating audit log
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    })

    if (!userExists) {
      console.error('User not found in database:', session.user.id)
      return NextResponse.json({ error: 'User not found in database' }, { status: 401 })
    }

    // Use enhanced detection by default
    const detection = useEnhanced 
      ? await detectAndUpdateSupplierCategoriesEnhanced(supplierId)
      : await detectAndUpdateSupplierCategories(supplierId)

    if (!detection) {
      return NextResponse.json({
        success: false,
        message: 'No items found for this supplier or detection failed',
        categories: [],
        suggestions: [],
        summary: 'No categories detected',
        confidence: 0,
        detectionMethods: []
      })
    }

    // Create audit log with proper error handling
    try {
      const methodsText = detection.detectionMethods?.join(', ') || 'basic'
      const confidenceText = detection.confidence ? ` (${(detection.confidence * 100).toFixed(0)}% confidence)` : ''
      
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Supplier',
          entityId: supplierId,
          performedBy: session.user.id,
          details: `Auto-detected categories for supplier ${supplier.name}: ${detection.categories.join(', ')}${confidenceText} via ${methodsText}`
        }
      })
    } catch (logError) {
      console.error('Error creating audit log:', logError)
      // Continue with the response even if audit log fails
    }

    // Format response based on detection type
    const summary = useEnhanced && detection.confidence !== undefined
      ? formatCategoryDetectionSummaryEnhanced(detection)
      : formatCategoryDetectionSummary(detection)

    return NextResponse.json({
      success: true,
      message: 'Categories detected and updated successfully',
      categories: detection.categories,
      suggestions: detection.suggestions || [],
      summary,
      detectedAt: detection.detectedAt,
      itemCount: detection.itemCount,
      categoryCount: detection.categoryCount,
      confidence: detection.confidence || 1.0,
      detectionMethods: detection.detectionMethods || ['basic_item_analysis'],
      enhanced: useEnhanced
    })

  } catch (error) {
    console.error('Error detecting supplier categories:', error)
    return NextResponse.json(
      { error: 'Failed to detect categories' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve current category suggestions without updating
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Properly await params before accessing properties
    const { id: supplierId } = await params
    const { searchParams } = new URL(request.url)
    const useEnhanced = searchParams.get('enhanced') !== 'false'

    // Verify supplier exists and get current categories
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { 
        id: true, 
        name: true, 
        categories: true,
        categoriesDetectedAt: true
      }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
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

    // Get current categories and suggestions (without updating)
    // Use the already imported functions instead of dynamic import
    let currentCategories: string[] = []
    let currentSuggestions: CategorySuggestion[] = []
    let confidence = 0
    let detectionMethods: string[] = []
    let detectedAt: Date | null = null

    // Parse existing categories
    if (supplier.categories) {
      if (useEnhanced) {
        const parsed = parseSupplierCategoriesEnhanced(supplier.categories)
        currentCategories = parsed.categories
        currentSuggestions = parsed.suggestions || []
        confidence = parsed.confidence || 0
        detectionMethods = parsed.detectionMethods || []
        detectedAt = parsed.detectedAt ? new Date(parsed.detectedAt) : null
      } else {
        currentCategories = parseSupplierCategories(supplier.categories)
      }
    }

    // Get fresh suggestions without updating
    let freshDetection = null
    if (useEnhanced) {
      freshDetection = await detectSupplierCategoriesEnhanced(supplierId)
    }

    return NextResponse.json({
      supplierId,
      supplierName: supplier.name,
      currentCategories,
      currentSuggestions,
      currentConfidence: confidence,
      currentDetectionMethods: detectionMethods,
      lastDetectedAt: detectedAt?.toISOString() || supplier.categoriesDetectedAt?.toISOString(),
      freshSuggestions: freshDetection?.suggestions || [],
      freshCategories: freshDetection?.categories || [],
      freshConfidence: freshDetection?.confidence || 0,
      enhanced: useEnhanced
    })

  } catch (error) {
    console.error('Error getting supplier category suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to get category suggestions' },
      { status: 500 }
    )
  }
}

