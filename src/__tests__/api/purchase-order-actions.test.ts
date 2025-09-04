import { NextRequest } from 'next/server'
import { PUT as approveOrder } from '@/app/api/purchase-orders/[id]/approve/route'
import { PUT as receiveOrder } from '@/app/api/purchase-orders/[id]/receive/route'
import { prismaMock } from '@/__mocks__/prisma'
import { checkAccess } from '@/lib/server-access-control'

// Mock server access control
jest.mock('@/lib/server-access-control')
const mockCheckAccess = checkAccess as jest.MockedFunction<typeof checkAccess>

describe('Purchase Order Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('PUT /api/purchase-orders/[id]/approve', () => {
    it('should approve purchase order for authorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'manager1', role: 'MANAGER', department: 'IT' },
        userRole: 'MANAGER'
      })

      const existingOrder = {
        id: 'po1',
        orderNumber: 'PO-2024-001',
        status: 'PENDING',
        totalAmount: 1500.00,
        supplierId: 'sup1',
        createdById: 'user1'
      }

      const approvedOrder = {
        ...existingOrder,
        status: 'APPROVED',
        approvedById: 'manager1',
        approvedAt: new Date()
      }

      prismaMock.purchaseOrder.findUnique.mockResolvedValue(existingOrder as any)
      prismaMock.purchaseOrder.update.mockResolvedValue(approvedOrder as any)

      const request = new NextRequest('http://localhost:3000/api/purchase-orders/po1/approve', {
        method: 'PUT'
      })

      const response = await approveOrder(request, { params: { id: 'po1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        id: 'po1',
        status: 'APPROVED'
      })
      expect(prismaMock.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po1' },
        data: {
          status: 'APPROVED',
          approvedById: 'manager1',
          approvedAt: expect.any(Date)
        }
      })
    })

    it('should return 404 for non-existent order', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'manager1', role: 'MANAGER' },
        userRole: 'MANAGER'
      })

      prismaMock.purchaseOrder.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/purchase-orders/nonexistent/approve', {
        method: 'PUT'
      })

      const response = await approveOrder(request, { params: { id: 'nonexistent' } })

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Purchase order not found' })
    })

    it('should return 400 for already approved order', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'manager1', role: 'MANAGER' },
        userRole: 'MANAGER'
      })

      const approvedOrder = {
        id: 'po1',
        status: 'APPROVED'
      }

      prismaMock.purchaseOrder.findUnique.mockResolvedValue(approvedOrder as any)

      const request = new NextRequest('http://localhost:3000/api/purchase-orders/po1/approve', {
        method: 'PUT'
      })

      const response = await approveOrder(request, { params: { id: 'po1' } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ 
        error: 'Purchase order is not in pending status' 
      })
    })

    it('should return 401 for unauthorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: false,
        error: 'Unauthorized',
        status: 401
      })

      const request = new NextRequest('http://localhost:3000/api/purchase-orders/po1/approve', {
        method: 'PUT'
      })

      const response = await approveOrder(request, { params: { id: 'po1' } })

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should return 403 for employee user (insufficient permissions)', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: false,
        error: 'Insufficient permissions',
        status: 403
      })

      const request = new NextRequest('http://localhost:3000/api/purchase-orders/po1/approve', {
        method: 'PUT'
      })

      const response = await approveOrder(request, { params: { id: 'po1' } })

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({ error: 'Insufficient permissions' })
    })
  })

  describe('PUT /api/purchase-orders/[id]/receive', () => {
    it('should receive purchase order and update inventory', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      const approvedOrder = {
        id: 'po1',
        orderNumber: 'PO-2024-001',
        status: 'APPROVED',
        totalAmount: 1500.00,
        items: [
          {
            id: 'poi1',
            itemId: 'item1',
            quantity: 10,
            unitPrice: 150.00,
            item: {
              id: 'item1',
              name: 'Office Chair',
              currentStock: 20
            }
          }
        ]
      }

      const receivedOrder = {
        ...approvedOrder,
        status: 'RECEIVED',
        receivedById: 'admin1',
        receivedAt: new Date()
      }

      prismaMock.purchaseOrder.findUnique.mockResolvedValue(approvedOrder as any)
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          purchaseOrder: {
            update: jest.fn().mockResolvedValue(receivedOrder)
          },
          item: {
            update: jest.fn().mockResolvedValue({
              id: 'item1',
              currentStock: 30
            })
          },
          stockMovement: {
            create: jest.fn().mockResolvedValue({
              id: 'move1',
              type: 'IN',
              quantity: 10
            })
          }
        })
      })

      const request = new NextRequest('http://localhost:3000/api/purchase-orders/po1/receive', {
        method: 'PUT'
      })

      const response = await receiveOrder(request, { params: { id: 'po1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        id: 'po1',
        status: 'RECEIVED'
      })
    })

    it('should return 404 for non-existent order', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.purchaseOrder.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/purchase-orders/nonexistent/receive', {
        method: 'PUT'
      })

      const response = await receiveOrder(request, { params: { id: 'nonexistent' } })

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Purchase order not found' })
    })

    it('should return 400 for non-approved order', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      const pendingOrder = {
        id: 'po1',
        status: 'PENDING'
      }

      prismaMock.purchaseOrder.findUnique.mockResolvedValue(pendingOrder as any)

      const request = new NextRequest('http://localhost:3000/api/purchase-orders/po1/receive', {
        method: 'PUT'
      })

      const response = await receiveOrder(request, { params: { id: 'po1' } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ 
        error: 'Purchase order must be approved before receiving' 
      })
    })

    it('should return 400 for already received order', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      const receivedOrder = {
        id: 'po1',
        status: 'RECEIVED'
      }

      prismaMock.purchaseOrder.findUnique.mockResolvedValue(receivedOrder as any)

      const request = new NextRequest('http://localhost:3000/api/purchase-orders/po1/receive', {
        method: 'PUT'
      })

      const response = await receiveOrder(request, { params: { id: 'po1' } })

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ 
        error: 'Purchase order has already been received' 
      })
    })

    it('should return 401 for unauthorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: false,
        error: 'Unauthorized',
        status: 401
      })

      const request = new NextRequest('http://localhost:3000/api/purchase-orders/po1/receive', {
        method: 'PUT'
      })

      const response = await receiveOrder(request, { params: { id: 'po1' } })

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should handle partial receiving with quantity discrepancies', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      const approvedOrder = {
        id: 'po1',
        status: 'APPROVED',
        items: [
          {
            id: 'poi1',
            itemId: 'item1',
            quantity: 10,
            item: {
              id: 'item1',
              currentStock: 20
            }
          }
        ]
      }

      prismaMock.purchaseOrder.findUnique.mockResolvedValue(approvedOrder as any)
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          purchaseOrder: {
            update: jest.fn().mockResolvedValue({
              ...approvedOrder,
              status: 'RECEIVED'
            })
          },
          item: {
            update: jest.fn().mockResolvedValue({
              id: 'item1',
              currentStock: 27 // Only 7 received instead of 10
            })
          },
          stockMovement: {
            create: jest.fn().mockResolvedValue({
              id: 'move1',
              type: 'IN',
              quantity: 7
            })
          }
        })
      })

      const requestBody = {
        items: [
          {
            itemId: 'item1',
            receivedQuantity: 7, // Partial delivery
            notes: 'Partial shipment - 3 items damaged'
          }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/purchase-orders/po1/receive', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await receiveOrder(request, { params: { id: 'po1' } })

      expect(response.status).toBe(200)
    })
  })
})