import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  processManagerAssignmentForDepartment,
  processAllDepartmentManagerAssignments,
  handleManagerStatusChange,
  handleManagerTransfer
} from '@/lib/manager-assignment'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, departmentId, managerId, newStatus, fromDepartmentId, toDepartmentId } = body

    let result

    switch (action) {
      case 'process-single-department':
        if (!departmentId) {
          return NextResponse.json(
            { error: 'Department ID is required for single department processing' },
            { status: 400 }
          )
        }
        result = await processManagerAssignmentForDepartment(departmentId)
        break

      case 'process-all-departments':
        result = await processAllDepartmentManagerAssignments()
        break

      case 'handle-manager-status-change':
        if (!managerId || !newStatus) {
          return NextResponse.json(
            { error: 'Manager ID and new status are required' },
            { status: 400 }
          )
        }
        result = await handleManagerStatusChange(managerId, newStatus, departmentId)
        break

      case 'handle-manager-transfer':
        if (!managerId || !fromDepartmentId || !toDepartmentId) {
          return NextResponse.json(
            { error: 'Manager ID, from department ID, and to department ID are required' },
            { status: 400 }
          )
        }
        result = await handleManagerTransfer(managerId, fromDepartmentId, toDepartmentId)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      action,
      result
    })

  } catch (error) {
    console.error('Error processing manager assignments:', error)
    return NextResponse.json(
      { error: 'Failed to process manager assignments' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get overview of all departments and their manager status
    const result = await processAllDepartmentManagerAssignments()

    return NextResponse.json({
      success: true,
      overview: result
    })

  } catch (error) {
    console.error('Error getting manager assignment overview:', error)
    return NextResponse.json(
      { error: 'Failed to get manager assignment overview' },
      { status: 500 }
    )
  }
}