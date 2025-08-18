import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { autoAssignManagerToDepartment, checkAndNotifyMultipleManagers } from '@/lib/manager-assignment'

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
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role')

    // Build where clause
    const where: any = {}
    if (roleFilter) {
      where.role = roleFilter
    }

    // Fetch users with optional role filter
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        department: true,
        departmentId: true,
        status: true,
        lastSignIn: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Transform the data to match the expected format
    const formattedUsers = users.map(user => ({
      ...user,
      status: user.status || 'ACTIVE' // Use actual status field or default to ACTIVE
    }))

    // Sort users by role priority: ADMIN first, then MANAGER, then EMPLOYEE
    // Within each role, active users appear before inactive users
    const sortedUsers = formattedUsers.sort((a, b) => {
      const roleOrder = { 'ADMIN': 0, 'MANAGER': 1, 'EMPLOYEE': 2 }
      const aRoleOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 3
      const bRoleOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 3

      // First, sort by role
      if (aRoleOrder !== bRoleOrder) {
        return aRoleOrder - bRoleOrder
      }

      // If roles are the same, sort by status (ACTIVE first, then INACTIVE)
      const statusOrder = { 'ACTIVE': 0, 'INACTIVE': 1 }
      const aStatusOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 2
      const bStatusOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 2

      if (aStatusOrder !== bStatusOrder) {
        return aStatusOrder - bStatusOrder
      }

      // If both role and status are the same, sort by name alphabetically
      return a.name.localeCompare(b.name)
    })

    // Return in the format expected by the frontend
    if (roleFilter) {
      return NextResponse.json({ users: sortedUsers })
    } else {
      return NextResponse.json(sortedUsers)
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { name, email, password, role, department } = body

    // Validate required fields
    if (!name || !email || !password || !role || !department) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      )
    }

    // Limit admin role creation - only allow one admin
    if (role === 'ADMIN') {
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Find department by name to get departmentId
    let departmentId = null
    if (department) {
      const dept = await db.department.findFirst({
        where: { name: department }
      })
      departmentId = dept?.id
    }

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        department,
        departmentId
      }
    })

    // If this is a manager and they belong to a department, try automatic assignment
    let managerAssignmentResult = null
    if (role === 'MANAGER' && departmentId) {
      try {
        managerAssignmentResult = await autoAssignManagerToDepartment(departmentId)
      } catch (error) {
        console.error('Error in automatic manager assignment after user creation:', error)
        // Continue without failing the user creation
      }
    }

    // Check for multiple managers across all departments and create notifications
    if (role === 'MANAGER') {
      try {
        await checkAndNotifyMultipleManagers()
      } catch (error) {
        console.error('Error checking for multiple managers after user creation:', error)
        // Continue without failing the user creation
      }
    }

    // Return created user without password
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json({
      ...userWithoutPassword,
      managerAssignment: managerAssignmentResult
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}