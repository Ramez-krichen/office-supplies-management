import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    const adminCount = await prisma.user.count({
      where: {
        role: 'ADMIN',
      },
    })

    if (adminCount > 0) {
      return NextResponse.json({ error: 'Admin limit reached' }, { status: 409 })
    }

    return NextResponse.json({ message: 'OK' }, { status: 200 })
  } catch (error) {
    console.error('Error checking admin limit:', error)
    return NextResponse.json(
      { error: 'Failed to check admin limit' },
      { status: 500 }
    )
  }
}