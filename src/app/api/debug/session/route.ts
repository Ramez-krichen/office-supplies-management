import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ 
        error: 'No session found',
        authenticated: false 
      })
    }

    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        department: session.user.department
      },
      session: {
        expires: session.expires
      }
    })
  } catch (error) {
    console.error('Session debug error:', error)
    return NextResponse.json(
      { error: 'Failed to get session info' },
      { status: 500 }
    )
  }
}