import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { newPassword } = body

    // Validate input
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if user exists
    const targetUser = await db.user.findUnique({
      where: { id },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true 
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 12)

    // Update user password
    await db.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    // Create audit log entry for password reset
    await db.auditLog.create({
      data: {
        action: 'PASSWORD_RESET',
        entity: 'User',
        entityId: id,
        performedBy: session.user.id,
        details: `Admin reset password for user: ${targetUser.email || targetUser.name || id}`,
      },
    })

    return NextResponse.json({ 
      message: 'Password reset successfully',
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name
      }
    })
  } catch (error) {
    console.error('Error resetting user password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}