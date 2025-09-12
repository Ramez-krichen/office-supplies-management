import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control'

export async function GET(request: NextRequest) {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('REQUESTS', 'view')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { user, userRole, userDepartment, requiresDepartmentFiltering } = accessCheck

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10000')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const department = searchParams.get('department')
    const requesterId = searchParams.get('requesterId')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          requester: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ]
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (department) {
      where.department = department
    }

    if (requesterId) {
      where.requesterId = requesterId
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {}

      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }

      if (endDate) {
        // Set to end of the day for the end date
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDateTime
      }
    }

    // Role-based filtering using enhanced access control
    if (userRole === 'EMPLOYEE') {
      // Employees can only see their own requests
      where.requesterId = user.id
    } else if (userRole === 'MANAGER' && requiresDepartmentFiltering) {
      // Managers can see requests from their department
      if (userDepartment) {
        where.department = userDepartment
      }
    }
    // Admins can see all requests (no additional filtering)

    const [requests, total] = await Promise.all([
      db.request.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  reference: true,
                  unit: true,
                  category: true
                }
              }
            }
          },
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: {
              level: 'asc'
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.request.count({ where })
    ])

    // Transform data to match frontend interface
    const transformedRequests = requests.map(request => {
      // Find the latest approval if any
      const latestApproval = request.approvals.length > 0 
        ? request.approvals[request.approvals.length - 1] 
        : null

      return {
        id: request.id,
        title: request.title,
        description: request.description || '',
        requester: request.requester.name || '',
        requesterId: request.requesterId,
        department: request.department || '',
        status: request.status,
        priority: request.priority,
        totalAmount: request.totalAmount,
        createdAt: request.createdAt.toISOString().split('T')[0],
        updatedAt: request.updatedAt.toISOString().split('T')[0],
        approvedBy: latestApproval?.status === 'APPROVED' ? latestApproval.approver.name : undefined,
        approvedAt: latestApproval?.status === 'APPROVED' ? latestApproval.updatedAt.toISOString().split('T')[0] : undefined,
        rejectedReason: latestApproval?.status === 'REJECTED' ? latestApproval.comments : undefined,
        items: request.items.map(item => ({
          id: item.id,
          itemId: item.item.id, // Add the actual item ID for dropdown selection
          name: item.item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          description: item.notes || undefined,
          category: item.item.category.name
        })),
        notes: request.description || undefined,
        expectedDelivery: undefined // Not in schema yet
      }
    })

    return NextResponse.json({
      requests: transformedRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
const accessCheck = await checkAccess(createFeatureAccessCheck('REQUESTS', 'create')())
if (!accessCheck.hasAccess) {
  return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
}

const session = await getServerSession(authOptions)
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const { user, userDepartment } = accessCheck

const body = await request.json()
console.log('Request body:', JSON.stringify(body, null, 2))
    
const {
  title,
  description,
  department,
  priority,
  items
} = body

// Fetch the creator's department
const creatorDepartment = userDepartment || (await db.user.findUnique({
  where: { id: user.id },
  select: { department: true }
})).department

// Use the creator's department if not provided in the request body
const requestDepartment = body.department || creatorDepartment || 'GENERAL'

// Validate required fields
if (!title || !requestDepartment || !items || !items.length) {
  console.log('Validation failed:', { title: !!title, department: !!requestDepartment, items: items?.length })
  return NextResponse.json(
    { error: 'Missing required fields' },
    { status: 400 }
  )
}

// Validate items have required fields
for (let i = 0; i < items.length; i++) {
  const item = items[i]
  if (!item.itemId || !item.quantity || !item.unitPrice) {
    console.log(`Item ${i} validation failed:`, item)
    return NextResponse.json(
      { error: `Item ${i + 1} is missing required fields (itemId, quantity, or unitPrice)` },
      { status: 400 }
    )
  }
}

// Verify user exists in database
const dbUser = await db.user.findUnique({
  where: { id: user.id }
})

if (!dbUser) {
  console.log('User not found in database:', user.id)
  return NextResponse.json(
    { error: 'User not found in database' },
    { status: 400 }
  )
}
    
console.log('User found:', { id: dbUser.id, email: dbUser.email, name: dbUser.name })

// Calculate total amount
const totalAmount = items.reduce(
  (sum: number, item: { quantity: number; unitPrice: number }) => sum + (item.quantity * item.unitPrice),
  0
)

// Create request with items
const newRequest = await db.request.create({
  data: {
    title,
    description,
    department: requestDepartment,
    priority: priority || 'MEDIUM',
    totalAmount,
    requesterId: user.id,
    items: {
      create: items.map((item: { itemId: string; quantity: number; unitPrice: number; notes?: string }) => ({
        itemId: item.itemId,
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice),
        notes: item.notes
      }))
    }
  },
  include: {
    requester: {
      select: {
        id: true,
        name: true,
        email: true
      }
    },
    items: {
      include: {
        item: true
      }
    }
  }
})

    // Create approval workflow - assign to any manager (they can take ownership when approving)
    const managers = await db.user.findMany({
      where: {
        role: 'MANAGER',
        status: 'ACTIVE'
      }
    })

    if (managers.length > 0) {
      // Create a single approval record assigned to the first active manager
      // Other managers can take ownership when they approve (handled in approve route)
      await db.approval.create({
        data: {
          requestId: newRequest.id,
          approverId: managers[0].id, // Assign to first manager, others can take over
          level: 1
        }
      })
      console.log(`📋 Created approval assigned to manager: ${managers[0].name} (${managers[0].email})`)
    } else {
      // If no managers, create approval for any admin
      const admins = await db.user.findMany({
        where: {
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })

      if (admins.length > 0) {
        await db.approval.create({
          data: {
            requestId: newRequest.id,
            approverId: admins[0].id,
            level: 1
          }
        })
        console.log(`📋 No managers found, created approval assigned to admin: ${admins[0].name} (${admins[0].email})`)
      }
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Request',
        entityId: newRequest.id,
        performedBy: session.user.id,
        details: `Created request: ${newRequest.title}`
      }
    })

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    )
  }
}
