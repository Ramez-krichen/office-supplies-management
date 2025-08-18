import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  // Check if user is authenticated and is an admin
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  try {
    // Get email from query parameters
    const url = new URL(request.url)
    const email = url.searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
    }
    
    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }
    
    return NextResponse.json({ available: true })
  } catch (error) {
    console.error('Error checking email:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}