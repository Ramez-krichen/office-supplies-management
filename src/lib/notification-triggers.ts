import { notificationService } from './notification-service'
import { broadcastToUser, updateUnreadCount } from '@/app/api/notifications/stream/route'
import { db as prisma } from '@/lib/db'

export interface RequestStatusChangeData {
  requestId: string
  requestTitle: string
  oldStatus: string
  newStatus: string
  approverName?: string
  comments?: string
  department?: string
  requesterName?: string
}

export interface EmployeeAssignmentData {
  employeeId: string
  employeeName: string
  employeeEmail: string
  departmentId: string
  departmentName: string
  managerId: string
  managerName: string
  assignmentDate: Date
}

/**
 * Trigger notification when request status changes
 */
export async function triggerRequestStatusNotification(data: RequestStatusChangeData) {
  try {
    // Get the request details
    const request = await prisma.request.findUnique({
      where: { id: data.requestId },
      include: {
        requester: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!request) {
      console.error('Request not found for notification:', data.requestId)
      return
    }

    const requester = request.requester
    let title = ''
    let message = ''
    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM'
    let actionUrl = `/requests/${data.requestId}`

    // Determine notification content based on status change
    switch (data.newStatus) {
      case 'APPROVED':
        title = `Request Approved: ${data.requestTitle}`
        message = `Your request "${data.requestTitle}" has been approved${data.approverName ? ` by ${data.approverName}` : ''}.${data.comments ? ` Comments: ${data.comments}` : ''}`
        priority = 'HIGH'
        break

      case 'REJECTED':
        title = `Request Rejected: ${data.requestTitle}`
        message = `Your request "${data.requestTitle}" has been rejected${data.approverName ? ` by ${data.approverName}` : ''}.${data.comments ? ` Reason: ${data.comments}` : ''}`
        priority = 'HIGH'
        break

      case 'IN_PROGRESS':
        title = `Request In Progress: ${data.requestTitle}`
        message = `Your request "${data.requestTitle}" is now being processed${data.approverName ? ` by ${data.approverName}` : ''}.${data.comments ? ` Comments: ${data.comments}` : ''}`
        priority = 'MEDIUM'
        break

      case 'COMPLETED':
        title = `Request Completed: ${data.requestTitle}`
        message = `Your request "${data.requestTitle}" has been completed and is ready for delivery.`
        priority = 'HIGH'
        break

      case 'CANCELLED':
        title = `Request Cancelled: ${data.requestTitle}`
        message = `Your request "${data.requestTitle}" has been cancelled.${data.comments ? ` Reason: ${data.comments}` : ''}`
        priority = 'MEDIUM'
        break

      default:
        title = `Request Status Updated: ${data.requestTitle}`
        message = `Your request "${data.requestTitle}" status has been updated to ${data.newStatus}.${data.comments ? ` Comments: ${data.comments}` : ''}`
        priority = 'MEDIUM'
    }

    // Create notification
    const notificationId = await notificationService.createNotification({
      type: 'REQUEST_STATUS_CHANGE',
      title,
      message,
      data: {
        requestId: data.requestId,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
        approverName: data.approverName,
        comments: data.comments,
      },
      priority,
      targetUserId: requester.id,
      category: 'REQUEST_UPDATE',
      actionUrl,
      actionLabel: 'View Request',
      metadata: {
        requestTitle: data.requestTitle,
        department: data.department,
      }
    })

    // Broadcast real-time notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    })

    if (notification) {
      broadcastToUser(requester.id, notification)
      
      // Update unread count
      const unreadNotifications = await notificationService.getUserNotifications(
        requester.id,
        { status: 'UNREAD' }
      )
      updateUnreadCount(requester.id, unreadNotifications.length)
    }

    console.log(`Request status notification sent to ${requester.name} for request ${data.requestId}`)
    return notificationId
  } catch (error) {
    console.error('Error triggering request status notification:', error)
    throw error
  }
}

/**
 * Trigger notification when employee is assigned to a manager's department
 */
export async function triggerEmployeeAssignmentNotification(data: EmployeeAssignmentData) {
  try {
    const title = `New Employee Assigned: ${data.employeeName}`
    const message = `${data.employeeName} (${data.employeeEmail}) has been assigned to your department "${data.departmentName}" on ${data.assignmentDate.toLocaleDateString()}.`

    // Create notification for the manager
    const notificationId = await notificationService.createNotification({
      type: 'EMPLOYEE_ASSIGNMENT',
      title,
      message,
      data: {
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        employeeEmail: data.employeeEmail,
        departmentId: data.departmentId,
        departmentName: data.departmentName,
        assignmentDate: data.assignmentDate.toISOString(),
      },
      priority: 'MEDIUM',
      targetUserId: data.managerId,
      category: 'EMPLOYEE_MANAGEMENT',
      actionUrl: `/admin/users/${data.employeeId}`,
      actionLabel: 'View Employee',
      metadata: {
        departmentName: data.departmentName,
        assignmentType: 'NEW_EMPLOYEE',
      }
    })

    // Broadcast real-time notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    })

    if (notification) {
      broadcastToUser(data.managerId, notification)
      
      // Update unread count
      const unreadNotifications = await notificationService.getUserNotifications(
        data.managerId,
        { status: 'UNREAD' }
      )
      updateUnreadCount(data.managerId, unreadNotifications.length)
    }

    console.log(`Employee assignment notification sent to manager ${data.managerName} for employee ${data.employeeName}`)
    return notificationId
  } catch (error) {
    console.error('Error triggering employee assignment notification:', error)
    throw error
  }
}

/**
 * Trigger system alert notification
 */
export async function triggerSystemAlert(
  title: string,
  message: string,
  targetRole?: string,
  targetUserId?: string,
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'HIGH',
  actionUrl?: string,
  actionLabel?: string
) {
  try {
    const notificationId = await notificationService.createNotification({
      type: 'SYSTEM_ALERT',
      title,
      message,
      priority,
      targetRole,
      targetUserId,
      category: 'SYSTEM',
      actionUrl,
      actionLabel,
      metadata: {
        alertType: 'SYSTEM_ALERT',
        timestamp: new Date().toISOString(),
      }
    })

    // Broadcast to all if no specific target
    if (!targetRole && !targetUserId) {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      })

      if (notification) {
        // This would broadcast to all connected users
        // broadcastToAll(notification)
      }
    }

    console.log(`System alert notification created: ${title}`)
    return notificationId
  } catch (error) {
    console.error('Error triggering system alert:', error)
    throw error
  }
}

/**
 * Trigger low stock alert
 */
export async function triggerLowStockAlert(itemName: string, currentStock: number, minStock: number) {
  try {
    const title = `Low Stock Alert: ${itemName}`
    const message = `Item "${itemName}" is running low on stock. Current: ${currentStock}, Minimum: ${minStock}. Please reorder soon.`

    return await triggerSystemAlert(
      title,
      message,
      'ADMIN', // Target admins
      undefined,
      'HIGH',
      '/inventory',
      'View Inventory'
    )
  } catch (error) {
    console.error('Error triggering low stock alert:', error)
    throw error
  }
}

/**
 * Trigger purchase order status notification
 */
export async function triggerPurchaseOrderNotification(
  orderId: string,
  orderNumber: string,
  status: string,
  createdById: string,
  supplierName?: string
) {
  try {
    let title = ''
    let message = ''
    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM'

    switch (status) {
      case 'SENT':
        title = `Purchase Order Sent: ${orderNumber}`
        message = `Purchase order ${orderNumber}${supplierName ? ` to ${supplierName}` : ''} has been sent successfully.`
        priority = 'MEDIUM'
        break
      case 'RECEIVED':
        title = `Purchase Order Received: ${orderNumber}`
        message = `Purchase order ${orderNumber}${supplierName ? ` from ${supplierName}` : ''} has been received and processed.`
        priority = 'HIGH'
        break
      case 'CANCELLED':
        title = `Purchase Order Cancelled: ${orderNumber}`
        message = `Purchase order ${orderNumber} has been cancelled.`
        priority = 'MEDIUM'
        break
      default:
        title = `Purchase Order Updated: ${orderNumber}`
        message = `Purchase order ${orderNumber} status has been updated to ${status}.`
    }

    const notificationId = await notificationService.createNotification({
      type: 'PURCHASE_ORDER_UPDATE',
      title,
      message,
      data: {
        orderId,
        orderNumber,
        status,
        supplierName,
      },
      priority,
      targetUserId: createdById,
      category: 'PURCHASE_ORDER',
      actionUrl: `/orders/${orderId}`,
      actionLabel: 'View Order',
      metadata: {
        orderNumber,
        supplierName,
      }
    })

    // Broadcast real-time notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    })

    if (notification) {
      broadcastToUser(createdById, notification)
      
      // Update unread count
      const unreadNotifications = await notificationService.getUserNotifications(
        createdById,
        { status: 'UNREAD' }
      )
      updateUnreadCount(createdById, unreadNotifications.length)
    }

    console.log(`Purchase order notification sent for order ${orderNumber}`)
    return notificationId
  } catch (error) {
    console.error('Error triggering purchase order notification:', error)
    throw error
  }
}