import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, role, department, status } = body
    const { id } = await params

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { email: true, role: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent changing email of the main admin
    if (currentUser.email === 'admin@example.com' && email !== 'admin@example.com') {
      return NextResponse.json(
        { error: 'Cannot change email of the main admin account' },
        { status: 403 }
      )
    }

    // Prevent changing role to admin if there's already an admin and this user isn't already admin
    if (role === 'ADMIN' && currentUser.role !== 'ADMIN') {
      const adminCount = await prisma.user.count({
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

    const updateData: any = {
      name,
      email,
      role,
      department,
      status,
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error(`Error updating user ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if this is the main admin user
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { email: true, role: true }
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

    const deletedUser = await prisma.user.delete({
      where: { id },
    })

    // Create audit log entry for user deletion
    await prisma.auditLog.create({
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