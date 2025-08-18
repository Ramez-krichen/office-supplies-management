import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control'

export async function GET(request: NextRequest) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('AUDIT_LOGS', 'view')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const action = searchParams.get('action')
    const entity = searchParams.get('entity')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (action) where.action = action
    if (entity) where.entity = entity
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) where.timestamp.gte = new Date(startDate)
      if (endDate) where.timestamp.lte = new Date(endDate)
    }

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ])

    return NextResponse.json({
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}