import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { securePasswordResetService } from '@/lib/secure-password-reset'
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Enhanced access control check
    const accessCheck = await checkAccess(createFeatureAccessCheck('USERS', 'edit')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Unauthorized - Admin privileges required for password reset' 
      }, { status: 401 })
    }

    const { id: targetUserId } = params
    const body = await request.json()
    const { reason, notifyUser = true } = body

    // Validate input
    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid target user ID' },
        { status: 400 }
      )
    }

    // Prevent self-password reset through this endpoint
    if (session.user.id === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot reset your own password through this endpoint' },
        { status: 400 }
      )
    }

    // Perform secure password reset
    const resetResult = await securePasswordResetService.resetUserPassword({
      adminId: session.user.id,
      targetUserId,
      reason: reason || 'Administrative password reset',
      notifyUser: Boolean(notifyUser)
    })

    if (!resetResult.success) {
      return NextResponse.json(
        { error: resetResult.error },
        { status: 400 }
      )
    }

    // Return success with the new password (displayed only once)
    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      newPassword: resetResult.newPassword, // This will be obscured after display
      auditLogId: resetResult.auditLogId,
      securityNotice: 'This password will only be displayed once. Please save it securely.',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in secure password reset endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to reset password due to system error' },
      { status: 500 }
    )
  }
}

// Generate password options endpoint (optional feature)
export async function GET(request: NextRequest) {
  try {
    // Enhanced access control check
    const accessCheck = await checkAccess(createFeatureAccessCheck('USERS', 'view')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Unauthorized - Admin privileges required' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const count = parseInt(searchParams.get('count') || '3')
    const length = parseInt(searchParams.get('length') || '16')

    // Validate parameters
    if (count < 1 || count > 5) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (length < 12 || length > 32) {
      return NextResponse.json(
        { error: 'Length must be between 12 and 32 characters' },
        { status: 400 }
      )
    }

    // Generate password options
    const passwordOptions = securePasswordResetService.generatePasswordOptions(count, length)

    return NextResponse.json({
      passwordOptions,
      notice: 'These are suggested secure passwords. You can use one of these or generate your own.',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating password options:', error)
    return NextResponse.json(
      { error: 'Failed to generate password options' },
      { status: 500 }
    )
  }
}