import { UserRole } from './access-control-config'
import { db } from '@/lib/db'

/**
 * General Manager Access Control
 * 
 * This module provides specialized access control functions for the General Manager role
 * with strict segregation of duties and audit trail capabilities.
 */

/**
 * Check if a user is a General Manager
 */
export function isGeneralManager(role: string | undefined): boolean {
  return role === 'GENERAL_MANAGER'
}

/**
 * Check if General Manager has permission to approve a specific request
 * 
 * This function enforces that General Managers can only approve/reject requests
 * and have no other permissions.
 */
export async function canGeneralManagerApproveRequest(
  userId: string,
  requestId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Verify the request exists
    const request = await db.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        status: true
      }
    })

    if (!request) {
      return { allowed: false, reason: 'Request not found' }
    }

    // Check if request is already approved or rejected
    if (request.status === 'APPROVED' || request.status === 'REJECTED') {
      return { allowed: false, reason: `Request is already ${request.status.toLowerCase()}` }
    }

    // General Managers can approve any pending request
    return { allowed: true }
  } catch (error) {
    console.error('Error checking General Manager approval permission:', error)
    return { allowed: false, reason: 'System error occurred' }
  }
}

/**
 * Log General Manager approval actions for audit trail
 */
export async function logGeneralManagerAction(
  userId: string,
  action: 'APPROVE' | 'REJECT',
  entityId: string,
  details?: string
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action,
        entity: 'Request',
        entityId,
        performedBy: userId,
        details: `General Manager ${action.toLowerCase()}d request${details ? `: ${details}` : ''}`
      }
    })
  } catch (error) {
    console.error('Error logging General Manager action:', error)
    // We don't throw here as we don't want to fail the approval process if logging fails
  }
}

/**
 * Get all pending requests that a General Manager can approve
 * 
 * This function provides visibility into all pending requests for approval purposes
 * while maintaining strict segregation of duties.
 */
export async function getPendingRequestsForGeneralManager(): Promise<any[]> {
  try {
    const pendingRequests = await db.request.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        requester: {
          select: {
            name: true,
            email: true,
            departmentRef: {
              select: {
                name: true
              }
            }
          }
        },
        items: {
          include: {
            item: {
              select: {
                name: true,
                reference: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return pendingRequests
  } catch (error) {
    console.error('Error fetching pending requests for General Manager:', error)
    return []
  }
}

/**
 * Validate that General Manager actions are within allowed boundaries
 * 
 * This function ensures strict segregation of duties by validating that
 * General Managers only perform approve/reject actions.
 */
export function validateGeneralManagerAction(
  action: string
): { valid: boolean; reason?: string } {
  const allowedActions = ['approve', 'reject']
  
  if (!allowedActions.includes(action.toLowerCase())) {
    return {
      valid: false,
      reason: 'General Managers can only approve or reject requests'
    }
  }
  
  return { valid: true }
}