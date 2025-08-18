import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'
import { autoAssignManagerToDepartment } from '@/lib/manager-assignment'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'create-test-scenario') {
      // Create test departments and managers for demonstration
      const testResults = await createTestScenario()
      return NextResponse.json(testResults)
    } else if (action === 'test-assignment') {
      // Test the assignment logic on existing departments
      const testResults = await testAssignmentLogic()
      return NextResponse.json(testResults)
    } else if (action === 'cleanup-test-data') {
      // Clean up test data
      const cleanupResults = await cleanupTestData()
      return NextResponse.json(cleanupResults)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in test manager assignment:', error)
    return NextResponse.json(
      { error: 'Failed to execute test' },
      { status: 500 }
    )
  }
}

async function createTestScenario() {
  const results = []

  try {
    // Create test departments
    const testDepartments = [
      { code: 'TEST_SINGLE', name: 'Test Single Manager Dept', description: 'Department with one manager' },
      { code: 'TEST_MULTI', name: 'Test Multiple Managers Dept', description: 'Department with multiple managers' },
      { code: 'TEST_NONE', name: 'Test No Managers Dept', description: 'Department with no managers' }
    ]

    const createdDepartments = []
    for (const dept of testDepartments) {
      try {
        const existing = await prisma.department.findUnique({ where: { code: dept.code } })
        if (!existing) {
          const created = await prisma.department.create({ data: dept })
          createdDepartments.push(created)
          results.push({ action: 'create_department', success: true, data: created })
        } else {
          createdDepartments.push(existing)
          results.push({ action: 'department_exists', success: true, data: existing })
        }
      } catch (error) {
        results.push({ action: 'create_department', success: false, error: error.message })
      }
    }

    // Create test managers
    const testManagers = [
      { 
        email: 'test.manager1@example.com', 
        name: 'Test Manager One', 
        department: 'Test Single Manager Dept',
        departmentCode: 'TEST_SINGLE'
      },
      { 
        email: 'test.manager2@example.com', 
        name: 'Test Manager Two', 
        department: 'Test Multiple Managers Dept',
        departmentCode: 'TEST_MULTI'
      },
      { 
        email: 'test.manager3@example.com', 
        name: 'Test Manager Three', 
        department: 'Test Multiple Managers Dept',
        departmentCode: 'TEST_MULTI'
      }
    ]

    for (const manager of testManagers) {
      try {
        const existing = await prisma.user.findUnique({ where: { email: manager.email } })
        if (!existing) {
          const department = createdDepartments.find(d => d.code === manager.departmentCode)
          const created = await prisma.user.create({
            data: {
              email: manager.email,
              name: manager.name,
              password: '$2a$12$test.hash.for.testing.purposes.only',
              role: 'MANAGER',
              department: manager.department,
              departmentId: department?.id,
              status: 'ACTIVE'
            }
          })
          results.push({ action: 'create_manager', success: true, data: created })
        } else {
          results.push({ action: 'manager_exists', success: true, data: existing })
        }
      } catch (error) {
        results.push({ action: 'create_manager', success: false, error: error.message })
      }
    }

    return {
      success: true,
      message: 'Test scenario created successfully',
      results
    }

  } catch (error) {
    return {
      success: false,
      message: 'Failed to create test scenario',
      error: error.message
    }
  }
}

async function testAssignmentLogic() {
  const results = []

  try {
    // Get test departments
    const testDepartments = await prisma.department.findMany({
      where: {
        code: { in: ['TEST_SINGLE', 'TEST_MULTI', 'TEST_NONE'] }
      }
    })

    for (const department of testDepartments) {
      try {
        // Clear any existing manager assignment
        await prisma.department.update({
          where: { id: department.id },
          data: { managerId: null }
        })

        // Test the assignment logic
        const assignmentResult = await autoAssignManagerToDepartment(department.id)
        
        results.push({
          department: department.name,
          code: department.code,
          assignmentResult
        })

      } catch (error) {
        results.push({
          department: department.name,
          code: department.code,
          error: error.message
        })
      }
    }

    return {
      success: true,
      message: 'Assignment logic tested successfully',
      results
    }

  } catch (error) {
    return {
      success: false,
      message: 'Failed to test assignment logic',
      error: error.message
    }
  }
}

async function cleanupTestData() {
  const results = []

  try {
    // Delete test users
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: { in: [
          'test.manager1@example.com',
          'test.manager2@example.com', 
          'test.manager3@example.com'
        ]}
      }
    })
    results.push({ action: 'delete_test_users', count: deletedUsers.count })

    // Delete test departments
    const deletedDepartments = await prisma.department.deleteMany({
      where: {
        code: { in: ['TEST_SINGLE', 'TEST_MULTI', 'TEST_NONE'] }
      }
    })
    results.push({ action: 'delete_test_departments', count: deletedDepartments.count })

    // Delete test notifications
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        type: 'MANAGER_ASSIGNMENT',
        data: { contains: 'TEST_' }
      }
    })
    results.push({ action: 'delete_test_notifications', count: deletedNotifications.count })

    return {
      success: true,
      message: 'Test data cleaned up successfully',
      results
    }

  } catch (error) {
    return {
      success: false,
      message: 'Failed to cleanup test data',
      error: error.message
    }
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current system status for manager assignments
    const departments = await prisma.department.findMany({
      include: {
        manager: true,
        users: {
          where: { role: 'MANAGER', status: 'ACTIVE' },
          select: { id: true, name: true, email: true }
        }
      }
    })

    const notifications = await prisma.notification.findMany({
      where: { type: 'MANAGER_ASSIGNMENT' },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const summary = {
      totalDepartments: departments.length,
      departmentsWithManagers: departments.filter(d => d.managerId).length,
      departmentsWithoutManagers: departments.filter(d => !d.managerId).length,
      managerAssignmentNotifications: notifications.length
    }

    return NextResponse.json({
      summary,
      departments: departments.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code,
        hasManager: !!d.managerId,
        managerName: d.manager?.name,
        availableManagers: d.users.length
      })),
      recentNotifications: notifications
    })

  } catch (error) {
    console.error('Error getting test status:', error)
    return NextResponse.json(
      { error: 'Failed to get test status' },
      { status: 500 }
    )
  }
}
