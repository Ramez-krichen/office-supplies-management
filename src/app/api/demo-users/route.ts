import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

// GET /api/demo-users - Return the 3 main demo users for easy testing
export async function GET() {
  try {
    // Get the specific demo accounts
    const demoEmails = ['admin@example.com', 'manager@example.com', 'employee@example.com']

    const demoUsers = await prisma.user.findMany({
      where: {
        email: {
          in: demoEmails
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        status: true
      },
      orderBy: {
        role: 'asc' // ADMIN first, then EMPLOYEE, then MANAGER
      }
    })

    // Add passwords and descriptions to the demo users
    const demoUsersWithPasswords = demoUsers.map(user => {
      let password = ''
      let description = ''

      switch (user.email) {
        case 'admin@example.com':
          password = 'admin123'
          description = 'Full system administrator with all permissions'
          break
        case 'manager@example.com':
          password = 'manager123'
          description = 'Department manager with approval permissions'
          break
        case 'employee@example.com':
          password = 'employee123'
          description = 'Regular employee who can create requests'
          break
        default:
          password = 'Unknown'
          description = 'Demo user'
      }

      return {
        ...user,
        password,
        description
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Demo users for localhost:3000 testing',
      data: demoUsersWithPasswords,
      instructions: {
        usage: 'Use these credentials to login and test different user roles',
        loginUrl: '/auth/signin',
        note: 'These are the original demo accounts with their specific passwords'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch demo users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
