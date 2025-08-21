import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { userHooks } from '@/lib/manager-assignment-hooks'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { name, email, role, department, status } = body

    // Get current user data
    const currentUser = await db.user.findUnique({
      where: { id },
      select: { email: true, role: true, status: true, departmentId: true, department: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent changing email of any admin user
    if (currentUser.role === 'ADMIN' && email !== currentUser.email) {
      return NextResponse.json(
        { error: 'Cannot change email of the admin account' },
        { status: 403 }
      )
    }

    // Prevent changing role to admin if there's already an admin and this user isn't already admin
    if (role === 'ADMIN' && currentUser.role !== 'ADMIN') {
      const adminCount = await db.user.count({
        where: { role: 'ADMIN' }
      })

      if (adminCount >= 1) {
        return NextResponse.json(
          { error: 'Only one admin account is allowed' },
          { status: 403 }
        )
      }
    }

    // Prevent changing any admin's role (only one admin should exist)
    if (currentUser.role === 'ADMIN' && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot change role of the admin account. Only one admin is allowed in the system.' },
        { status: 403 }
      )
    }

    // Find department by name to get departmentId
    let departmentId = currentUser.departmentId
    if (department && department !== currentUser.department) {
      const dept = await db.department.findFirst({
        where: { name: department }
      })
      departmentId = dept?.id || null
    }

    // Prepare update data
    const updateData: {
      name?: string
      email?: string
      role?: string
      department?: string
      departmentId?: string | null
      status?: string
      updatedAt: Date
    } = {
      name,
      email,
      role,
      department,
      departmentId,
      status,
      updatedAt: new Date()
    }

    // Note: Password changes are now handled through the dedicated reset-password endpoint

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        status: true,
        lastSignIn: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Trigger manager assignment hooks after user update
    try {
      const previousData = {
        role: currentUser.role,
        status: currentUser.status,
        departmentId: currentUser.departmentId
      }
      const newData = {
        role: role || currentUser.role,
        status: status || currentUser.status,
        departmentId: departmentId
      }
      
      await userHooks.afterUpdate(id, previousData, newData)
    } catch (error) {
      console.error('Error in manager assignment hooks after user update:', error)
      // Continue without failing the user update
    }

    // Create audit log entry for user update
    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'User',
        entityId: id,
        performedBy: session.user.id,
        details: `Updated user: ${updatedUser.email || updatedUser.name || id}`,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        // Remove password from admin view for security
        role: true,
        department: true,
        status: true,
        lastSignIn: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if this is an admin user
    const userToDelete = await db.user.findUnique({
      where: { id },
      select: { email: true, role: true, name: true }
    })

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting any admin user (only one admin should exist)
    if (userToDelete.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete the admin account. Only one admin is allowed in the system.' },
        { status: 403 }
      )
    }

    // Delete the user
    const deletedUser = await db.user.delete({
      where: { id }
    })

    // Trigger manager assignment hooks after user deletion
    try {
      const userData = {
        role: userToDelete.role,
        status: 'ACTIVE', // Assume was active before deletion
        departmentId: null // We don't have this info, but hooks will handle it
      }
      await userHooks.afterDelete(id, userData)
    } catch (error) {
      console.error('Error in manager assignment hooks after user deletion:', error)
      // Continue without failing the user deletion
    }

    // Create audit log entry for user deletion
    await db.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'User',
        entityId: id,
        performedBy: session.user.id,
        details: `Deleted user: ${deletedUser.email || deletedUser.name || id}`,
      },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error(`Error deleting user ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}