import { NextResponse } from 'next/server'
import { checkAccess } from '@/lib/server-access-control'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    // Check if user has access to requests dashboard - GENERAL_MANAGER only
    const accessCheck = await checkAccess({ requireRole: 'GENERAL_MANAGER' })
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    // Access check passed - user is GENERAL_MANAGER

    // Build where clause based on user role and access control
    const where: any = {}

    // GENERAL_MANAGER can see all requests (no additional filtering needed)

    // Get request statistics
    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      inProgressRequests,
      completedRequests,
      recentRequests
    ] = await Promise.all([
      prisma.request.count({ where }),
      prisma.request.count({ where: { ...where, status: 'PENDING' } }),
      prisma.request.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.request.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.request.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.request.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.request.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          totalAmount: true,
          createdAt: true,
          department: true,
          requester: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
    ])

    const stats = {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      inProgressRequests,
      completedRequests,
      recentRequests: recentRequests.map(request => ({
        id: request.id,
        title: request.title,
        requester: request.requester.name,
        department: request.department,
        status: request.status,
        priority: request.priority,
        totalAmount: request.totalAmount,
        createdAt: request.createdAt.toISOString()
      }))
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching request dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request statistics' },
      { status: 500 }
    )
  }
}