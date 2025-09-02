import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { 
  detectAndUpdateAllSupplierCategoriesEnhanced,
  detectAndUpdateAllSupplierCategories
} from '@/lib/supplier-category-detection'
import { db as prisma } from '@/lib/db'

interface BulkDetectionResult {
  supplierId: string
  supplierName: string
  categories: string[]
  confidence?: number
  detectionMethods?: string[]
  itemCount: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { 
      supplierIds, 
      enhanced = true
    } = body

    // If specific supplier IDs provided, process only those
    if (supplierIds && Array.isArray(supplierIds)) {
      const results = {
        processed: 0,
        updated: 0,
        errors: 0,
        results: [] as BulkDetectionResult[]
      }

      for (const supplierId of supplierIds) {
        results.processed++
        
        try {
          // Verify supplier exists
          const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
            select: { id: true, name: true }
          })

          if (!supplier) {
            results.errors++
            continue
          }

          const { detectAndUpdateSupplierCategoriesEnhanced, detectAndUpdateSupplierCategories } = await import('@/lib/supplier-category-detection')
          
          const detection = enhanced 
            ? await detectAndUpdateSupplierCategoriesEnhanced(supplierId)
            : await detectAndUpdateSupplierCategories(supplierId)
          
          if (detection) {
            results.updated++
            results.results.push({
              supplierId,
              supplierName: supplier.name,
              categories: detection.categories,
              confidence: detection.confidence,
              detectionMethods: detection.detectionMethods,
              itemCount: detection.itemCount
            })

            // Create audit log
            try {
              const methodsText = detection.detectionMethods?.join(', ') || 'basic'
              const confidenceText = detection.confidence ? ` (${(detection.confidence * 100).toFixed(0)}% confidence)` : ''
              
              await prisma.auditLog.create({
                data: {
                  action: 'BULK_UPDATE',
                  entity: 'Supplier',
                  entityId: supplierId,
                  performedBy: session.user.id,
                  details: `Bulk category detection for ${supplier.name}: ${detection.categories.join(', ')}${confidenceText} via ${methodsText}`
                }
              })
            } catch (logError) {
              console.error('Error creating audit log:', logError)
            }
          }
        } catch (error) {
          results.errors++
          console.error(`Error processing supplier ${supplierId}:`, error)
        }
      }

      return NextResponse.json({
        success: true,
        message: `Bulk detection completed: ${results.updated}/${results.processed} suppliers updated`,
        ...results,
        enhanced
      })
    }

    // Process all suppliers
    try {
      let bulkResults
      if (enhanced) {
        bulkResults = await detectAndUpdateAllSupplierCategoriesEnhanced()
      } else {
        bulkResults = await detectAndUpdateAllSupplierCategories()
      }

      // Create summary audit log
      try {
        await prisma.auditLog.create({
          data: {
            action: 'BULK_UPDATE',
            entity: 'Supplier',
            entityId: 'ALL',
            performedBy: session.user.id,
            details: `Bulk category detection completed: ${bulkResults.updated}/${bulkResults.processed} suppliers updated, ${bulkResults.errors} errors`
          }
        })
      } catch (logError) {
        console.error('Error creating summary audit log:', logError)
      }

      return NextResponse.json({
        success: true,
        message: `Bulk detection completed: ${bulkResults.updated}/${bulkResults.processed} suppliers updated`,
        ...bulkResults,
        enhanced
      })

    } catch (error) {
      console.error('Error in bulk category detection:', error)
      return NextResponse.json(
        { error: 'Bulk detection failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error processing bulk category detection:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk category detection' },
      { status: 500 }
    )
  }
}

// GET endpoint to get bulk detection status/progress
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active suppliers for analysis
    const allSuppliers = await prisma.supplier.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        items: {
          select: {
            id: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Get recent bulk detection audit logs
    const recentBulkLogs = await prisma.auditLog.findMany({
      where: {
        action: 'BULK_UPDATE',
        entity: 'Supplier',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    })

    // Transform supplier data
    const suppliersInfo = allSuppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      itemCount: supplier.items.length
    }))

    return NextResponse.json({
      suppliersAvailable: suppliersInfo,
      totalSuppliersCount: allSuppliers.length,
      recentBulkOperations: recentBulkLogs.map(log => ({
        id: log.id,
        details: log.details,
        performedBy: log.user.name || log.user.email,
        timestamp: log.timestamp.toISOString()
      }))
    })

  } catch (error) {
    console.error('Error getting bulk detection status:', error)
    return NextResponse.json(
      { error: 'Failed to get bulk detection status' },
      { status: 500 }
    )
  }
}