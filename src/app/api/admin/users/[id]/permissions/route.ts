import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        permissions: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse permissions string into array
    const permissions = user.permissions 
      ? user.permissions.split(',').map(p => p.trim()).filter(p => p.length > 0)
      : []

    return NextResponse.json({
      user: {
        ...user,
        permissions
      },
      availablePermissions: [
        {
          key: 'purchase_orders',
          name: 'Purchase Orders',
          description: 'Access to view and manage purchase orders',
          applicableRoles: ['MANAGER']
        }
      ]
    })
  } catch (error) {
    console.error('Error fetching user permissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user permissions' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { permissions } = await request.json()

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      )
    }

    // Validate permissions
    const validPermissions = ['purchase_orders']
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p))
    
    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        { error: `Invalid permissions: ${invalidPermissions.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: params.id },
      select: { id: true, role: true, name: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only allow granting purchase_orders permission to managers
    if (permissions.includes('purchase_orders') && user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Purchase order access can only be granted to managers' },
        { status: 400 }
      )
    }

    // Convert permissions array to comma-separated string
    const permissionsString = permissions.join(',')

    // Update user permissions
    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: { permissions: permissionsString },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        permissions: true
      }
    })

    // Log the permission change
    await db.auditLog.create({
      data: {
        action: 'UPDATE_USER_PERMISSIONS',
        entityType: 'User',
        entityId: params.id,
        details: `Updated permissions for ${user.name}: ${permissionsString || 'none'}`,
        userId: session.user.id
      }
    })

    return NextResponse.json({
      user: {
        ...updatedUser,
        permissions: updatedUser.permissions 
          ? updatedUser.permissions.split(',').map(p => p.trim()).filter(p => p.length > 0)
          : []
      }
    })
  } catch (error) {
    console.error('Error updating user permissions:', error)
    return NextResponse.json(
      { error: 'Failed to update user permissions' },
      { status: 500 }
    )
  }
}
