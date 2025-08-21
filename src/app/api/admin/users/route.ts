import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { userHooks } from '@/lib/manager-assignment-hooks'
import { triggerEmployeeAssignmentNotification } from '@/lib/notification-triggers'

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
    const where: { role?: string } = {}
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
      return (a.name || '').localeCompare(b.name || '')
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

    // Trigger manager assignment hooks after user creation
    try {
      await userHooks.afterCreate(user.id)
    } catch (error) {
      console.error('Error in manager assignment hooks after user creation:', error)
      // Continue without failing the user creation
    }

    // Send notification to manager if employee is assigned to a department with a manager
    if (role === 'EMPLOYEE' && departmentId) {
      try {
        const department = await db.department.findUnique({
          where: { id: departmentId },
          include: {
            manager: {
              select: { id: true, name: true, email: true }
            }
          }
        })

        if (department?.manager) {
          await triggerEmployeeAssignmentNotification({
            employeeId: user.id,
            employeeName: user.name || user.email,
            employeeEmail: user.email,
            departmentId: department.id,
            departmentName: department.name,
            managerId: department.manager.id,
            managerName: department.manager.name || department.manager.email,
            assignmentDate: new Date(),
          })
        }
      } catch (error) {
        console.error('Error sending employee assignment notification:', error)
        // Continue without failing the user creation
      }
    }

    // Return created user without password
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}