import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  autoAssignManagerToDepartment, 
  manuallyAssignManager,
  getAvailableManagersForDepartment 
} from '@/lib/manager-assignment'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const departmentId = params.id

    // Get available managers for this department
    const availableManagers = await getAvailableManagersForDepartment(departmentId)

    return NextResponse.json({
      departmentId,
      availableManagers,
      total: availableManagers.length
    })

  } catch (error) {
    console.error('Error fetching available managers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available managers' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const departmentId = params.id
    const body = await request.json()
    const { action, managerId } = body

    if (action === 'auto') {
      // Automatic assignment based on business rules
      const result = await autoAssignManagerToDepartment(departmentId)
      return NextResponse.json(result)
      
    } else if (action === 'manual' && managerId) {
      // Manual assignment by admin
      const result = await manuallyAssignManager(
        departmentId, 
        managerId, 
        session.user.id
      )
      return NextResponse.json(result)
      
    } else {
      return NextResponse.json(
        { error: 'Invalid action or missing managerId for manual assignment' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error assigning manager:', error)
    return NextResponse.json(
      { error: 'Failed to assign manager' },
      { status: 500 }
    )
  }
}
