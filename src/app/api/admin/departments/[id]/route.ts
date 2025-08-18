import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true
          },
          orderBy: { name: 'asc' }
        }
      }
    })

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    return NextResponse.json(department)

  } catch (error) {
    console.error('Error fetching department:', error)
    return NextResponse.json(
      { error: 'Failed to fetch department' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { code, name, description, parentId, managerId, budget, status } = body

    // Normalize nullable/optional values
    const normalizedDescription = (description ?? '').toString().trim() === '' ? null : description
    const normalizedParentId = parentId ? parentId : null
    const normalizedManagerId = managerId ? managerId : null
    const normalizedBudget =
      budget === '' || budget === null || budget === undefined
        ? null
        : typeof budget === 'number'
        ? budget
        : parseFloat(budget)

    // Check if department exists
    const existingDept = await prisma.department.findUnique({
      where: { id }
    })

    if (!existingDept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    // Check if code is being changed and if new code already exists
    if (code && code !== existingDept.code) {
      const codeExists = await prisma.department.findUnique({
        where: { code }
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'Department code already exists' },
          { status: 409 }
        )
      }
    }

    // Validate manager if provided (and not being cleared)
    if (managerId !== undefined && normalizedManagerId) {
      const manager = await prisma.user.findUnique({
        where: { id: normalizedManagerId }
      })

      if (!manager || manager.role !== 'MANAGER') {
        return NextResponse.json(
          { error: 'Invalid manager selected' },
          { status: 400 }
        )
      }
    }

    // Prevent circular hierarchy
    if (parentId && parentId !== existingDept.parentId) {
      const isCircular = await checkCircularHierarchy(id, parentId)
      if (isCircular) {
        return NextResponse.json(
          { error: 'Cannot create circular department hierarchy' },
          { status: 400 }
        )
      }
    }

    // Update department
    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(description !== undefined && { description: normalizedDescription }),
        ...(parentId !== undefined && { parentId: normalizedParentId }),
        ...(managerId !== undefined && { managerId: normalizedManagerId }),
        ...(budget !== undefined && { budget: normalizedBudget }),
        ...(status && { status })
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Department',
        entityId: id,
        performedBy: session.user.id,
        details: `Updated department: ${updatedDepartment.name}`,
      },
    })

    return NextResponse.json(updatedDepartment)

  } catch (error) {
    console.error('Error updating department:', error)
    return NextResponse.json(
      { error: 'Failed to update department' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        users: true,
        children: true
      }
    })

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    // Check if department has users
    if (department.users.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete department with assigned users. Please reassign users first.' },
        { status: 400 }
      )
    }

    // Check if department has sub-departments
    if (department.children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete department with sub-departments. Please reassign or delete sub-departments first.' },
        { status: 400 }
      )
    }

    // Delete department
    await prisma.department.delete({
      where: { id }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Department',
        entityId: id,
        performedBy: session.user.id,
        details: `Deleted department: ${department.name}`,
      },
    })

    return NextResponse.json({ message: 'Department deleted successfully' })

  } catch (error) {
    console.error('Error deleting department:', error)
    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    )
  }
}

// Helper function to check for circular hierarchy
async function checkCircularHierarchy(departmentId: string, parentId: string): Promise<boolean> {
  if (departmentId === parentId) {
    return true
  }

  const parent = await prisma.department.findUnique({
    where: { id: parentId },
    select: { parentId: true }
  })

  if (!parent || !parent.parentId) {
    return false
  }

  return checkCircularHierarchy(departmentId, parent.parentId)
}
