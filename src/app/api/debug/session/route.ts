import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('Session data:', JSON.stringify(session, null, 2))
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'No session found',
        session: null
      }, { status: 401 })
    }

    // Try to find the user in the database
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })
    
    console.log('User lookup result:', user ? 'Found' : 'Not found')
    console.log('Session user ID:', session.user.id)
    
    // Get all users to see what's in the database
    const allUsers = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })
    
    return NextResponse.json({
      session,
      userFound: !!user,
      userInDb: user,
      allUsers,
      sessionUserId: session.user.id
    })
  } catch (error) {
    console.error('Debug session error:', error)
    return NextResponse.json(
      { error: 'Failed to debug session', details: error },
      { status: 500 }
    )
  }
}