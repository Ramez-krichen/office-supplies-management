import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { checkAndNotifyMultipleManagers } from '@/lib/manager-assignment'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { name, email, role, department, status, password } = body

    // Get current user data
    const currentUser = await db.user.findUnique({
      where: { id },
      select: { email: true, role: true, status: true }
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

    // Prepare update data
    const updateData: any = {
      name,
      email,
      role,
      department,
      status,
      updatedAt: new Date()
    }

    // Hash password if provided
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 12)
    }

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

    // Check if this is a manager role change or status change that affects manager assignments
    const isManagerRoleChange = (role === 'MANAGER' && currentUser.role !== 'MANAGER') ||
                                (currentUser.role === 'MANAGER' && role !== 'MANAGER')
    const isManagerStatusChange = currentUser.role === 'MANAGER' &&
                                 currentUser.status !== status &&
                                 (status === 'ACTIVE' || status === 'INACTIVE')

    // If manager-related changes occurred, check for multiple managers and create notifications
    if (isManagerRoleChange || isManagerStatusChange || role === 'MANAGER') {
      try {
        await checkAndNotifyMultipleManagers()
      } catch (error) {
        console.error('Error checking for multiple managers after user update:', error)
        // Continue without failing the user update
      }
    }

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
        password: true, // Include password for admin view
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