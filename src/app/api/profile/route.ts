import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        status: true,
        lastSignIn: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, currentPassword, newPassword } = body

    // Basic validation
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Get current user data
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        department: true,
        status: true
      }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if email is being changed and if it's already taken
    if (email !== currentUser.email) {
      const existingUser = await db.user.findUnique({
        where: { email },
        select: { id: true }
      })

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      updatedAt: new Date()
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change password' },
          { status: 400 }
        )
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        currentUser.password
      )

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        )
      }

      // Validate new password
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters long' },
          { status: 400 }
        )
      }

      // Hash new password
      updateData.password = await bcrypt.hash(newPassword, 12)
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
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
        updatedAt: true,
      }
    })

    // Log the successful profile update
    await db.auditLog.create({
      data: {
        action: 'PROFILE_UPDATE_SUCCESS',
        entity: 'USER',
        entityId: session.user.id,
        performedBy: session.user.id,
        details: JSON.stringify({
          updatedFields: Object.keys(updateData).filter(key => key !== 'password'),
          passwordChanged: !!newPassword,
          emailChanged: email !== currentUser.email
        }),
        timestamp: new Date()
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
