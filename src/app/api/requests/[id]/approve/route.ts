import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control'
import { isGeneralManager, canGeneralManagerApproveRequest, logGeneralManagerAction } from '@/lib/general-manager-access-control'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 POST /api/requests/[id]/approve - Starting...')

  try {
    console.log('🔐 Checking access...')
    const accessCheck = await checkAccess(createFeatureAccessCheck('REQUESTS', 'approve')())
    if (!accessCheck.hasAccess) {
      console.log(`❌ Access denied: ${accessCheck.error}`)
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { user, userRole } = accessCheck
    console.log(`✅ Access granted: ${user.name} (${userRole})`)

    console.log('📋 Parsing request parameters...')
    const { id: requestId } = await params
    console.log(`📋 Request ID: ${requestId}`)

    console.log('📦 Parsing request body...')
    const body = await request.json()
    const { status, comments } = body

    console.log(`🔧 API Route called for request ${requestId}`)
    console.log(`📦 Request body:`, body)
    console.log(`👤 User: ${user.name} (${userRole})`)
    console.log(`🔍 User ID: ${user.id}`)

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      console.error(`❌ Invalid status: ${status}`)
      return NextResponse.json(
        { error: 'Invalid status. Must be APPROVED or REJECTED' },
        { status: 400 }
      )
    }

    // If rejecting, comments are required
    if (status === 'REJECTED' && !comments) {
      return NextResponse.json(
        { error: 'Comments are required when rejecting a request' },
        { status: 400 }
      )
    }

    // Check if request exists
    console.log('🔍 Checking if request exists...')
    const existingRequest = await db.request.findUnique({
      where: { id: requestId },
      include: {
        approvals: {
          orderBy: {
            level: 'asc'
          }
        }
      }
    })
    console.log(`📋 Request found: ${existingRequest ? 'Yes' : 'No'}`)

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    console.log(`📋 Request found: ${existingRequest.title} (Status: ${existingRequest.status})`)
    console.log(`🔄 Existing approvals:`, existingRequest.approvals.map(a => ({
      id: a.id,
      approverId: a.approverId,
      status: a.status,
      level: a.level
    })))

    // Check if request is already approved or rejected
    if (existingRequest.status === 'APPROVED' || existingRequest.status === 'REJECTED') {
      return NextResponse.json(
        { error: `Request is already ${existingRequest.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Find the current approval level for this request
    let currentApproval = existingRequest.approvals.find(
      approval => approval.status === 'PENDING' && approval.approverId === user.id
    )

    // If no specific approval found, check if user has approval permissions
    if (!currentApproval && (userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'GENERAL_MANAGER')) {
      // Find any pending approval for this request
      const anyPendingApproval = existingRequest.approvals.find(
        approval => approval.status === 'PENDING'
      )

      if (anyPendingApproval) {
        // Create or reassign the approval to the current user (admin or manager)
        console.log(`🔄 Reassigning approval from ${anyPendingApproval.approverId} to ${user.id} (${userRole})`)
        currentApproval = await db.approval.upsert({
          where: {
            requestId_approverId_level: {
              requestId: requestId,
              approverId: user.id,
              level: anyPendingApproval.level
            }
          },
          update: {
            status: 'PENDING'
          },
          create: {
            requestId: requestId,
            approverId: user.id,
            level: anyPendingApproval.level,
            status: 'PENDING'
          }
        })
      } else {
        // No pending approvals, create a new one for the current user
        console.log(`🆕 Creating new approval for ${user.id} (${userRole})`)
        currentApproval = await db.approval.create({
          data: {
            requestId: requestId,
            approverId: user.id,
            level: 1,
            status: 'PENDING'
          }
        })
      }
    }

    if (!currentApproval) {
      return NextResponse.json(
        { error: 'You are not assigned to approve this request' },
        { status: 403 }
      )
    }

    // Update the approval
    console.log(`🔄 Updating approval ${currentApproval.id} with status: ${status}`)
    await db.approval.update({
      where: { id: currentApproval.id },
      data: {
        status,
        comments: comments || null,
        updatedAt: new Date()
      }
    })
    console.log(`✅ Approval updated successfully`)

    // Update the request status if this is the final approval or if rejected
    console.log(`🔄 Updating request status...`)
    if (status === 'REJECTED') {
      console.log(`❌ Rejecting request ${requestId}`)
      await db.request.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          updatedAt: new Date()
        }
      })
      console.log(`✅ Request status updated to REJECTED`)
    } else {
      // For approvals, we need to check the approval workflow more intelligently
      // Get fresh approval data after our update
      const updatedRequest = await db.request.findUnique({
        where: { id: requestId },
        include: {
          approvals: {
            orderBy: {
              level: 'asc'
            }
          }
        }
      })

      console.log(`🔍 Checking approval workflow completion...`)
      console.log(`📊 Current approval status:`)

      // Group approvals by level
      const approvalsByLevel = {}
      updatedRequest.approvals.forEach(approval => {
        if (!approvalsByLevel[approval.level]) {
          approvalsByLevel[approval.level] = []
        }
        approvalsByLevel[approval.level].push(approval)
      })

      // Check if all required levels are satisfied
      let allLevelsApproved = true
      let hasAnyApproval = false
      const levels = Object.keys(approvalsByLevel).sort((a, b) => parseInt(a) - parseInt(b))

      for (const level of levels) {
        const levelApprovals = approvalsByLevel[level]
        const hasApprovedInLevel = levelApprovals.some(approval => approval.status === 'APPROVED')

        console.log(`   Level ${level}: ${levelApprovals.length} approvals, approved: ${hasApprovedInLevel}`)

        if (hasApprovedInLevel) {
          hasAnyApproval = true
        }

        if (!hasApprovedInLevel) {
          allLevelsApproved = false
          console.log(`   ❌ Level ${level} not yet approved`)
        } else {
          console.log(`   ✅ Level ${level} approved`)
        }
      }

      // Determine the new status based on approval progress
      let newStatus = 'PENDING'

      if (allLevelsApproved && levels.length > 0) {
        // All levels approved - mark as APPROVED
        newStatus = 'APPROVED'
        console.log(`✅ All approval levels satisfied - Approving request ${requestId}`)
      } else if (hasAnyApproval) {
        // Some approvals given but not all - mark as IN_PROGRESS
        newStatus = 'IN_PROGRESS'
        console.log(`🔄 Partial approvals received - Moving request ${requestId} to IN_PROGRESS`)
      } else {
        // No approvals yet - keep as PENDING (shouldn't happen in this flow)
        console.log(`⏳ Request ${requestId} remains PENDING`)
      }

      // Update request status
      await db.request.update({
        where: { id: requestId },
        data: {
          status: newStatus,
          updatedAt: new Date()
        }
      })
      console.log(`✅ Request status updated to ${newStatus}`)
    }

    // Create audit log
    console.log(`📝 Creating audit log...`)
    // Use General Manager specific audit logging if user is a General Manager
    if (userRole === 'GENERAL_MANAGER') {
      await logGeneralManagerAction(
        user.id,
        status === 'APPROVED' ? 'APPROVE' : 'REJECT',
        requestId,
        `${existingRequest.title}${comments ? ` - Comments: ${comments}` : ''}`
      )
    } else {
      await db.auditLog.create({
        data: {
          action: status === 'APPROVED' ? 'APPROVE' : 'REJECT',
          entity: 'Request',
          entityId: requestId,
          performedBy: user.id,
          details: `${status === 'APPROVED' ? 'Approved' : 'Rejected'} request: ${existingRequest.title}${comments ? ` - Comments: ${comments}` : ''}`
        }
      })
    }
    console.log(`✅ Audit log created successfully`)

    console.log(`✅ Request ${requestId} ${status.toLowerCase()} successfully`)

    const responseData = {
      success: true,
      message: `Request ${status.toLowerCase()} successfully`
    }

    console.log('📤 Sending response:', responseData)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('❌ Error approving/rejecting request:', error)
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })

    const errorResponse = { error: 'Failed to process approval' }
    console.log('📤 Sending error response:', errorResponse)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}