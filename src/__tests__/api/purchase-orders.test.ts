import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/purchase-orders/route'
import { prismaMock } from '@/__mocks__/prisma'
import { checkAccess } from '@/lib/server-access-control'

// Mock server access control
jest.mock('@/lib/server-access-control')
const mockCheckAccess = checkAccess as jest.MockedFunction<typeof checkAccess>

describe('/api/purchase-orders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/purchase-orders', () => {
    it('should return purchase orders for authorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN', department: 'IT' },
        userRole: 'ADMIN'
      })

      const mockOrders = [
        {
          id: 'po1',
          orderNumber: 'PO-2024-001',
          status: 'PENDING',
          orderDate: new Date('2024-01-15'),
          expectedDeliveryDate: new Date('2024-01-25'),
          totalAmount: 1500.00,
          notes: 'Urgent order',
          supplier: {
            id: 'sup1',
            name: 'Office Supplies Co.',
            email: 'orders@officesupplies.com'
          },
          createdBy: {
            id: 'user1',
            name: 'John Doe',
            email: 'john@company.com'
          },
          items: [
            {
              id: 'poi1',
              quantity: 10,
              unitPrice: 150.00,
              totalPrice: 1500.00,
              item: {
                id: 'item1',
                name: 'Office Chair',
                sku: 'CHAIR-001'
              }
            }
          ],
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        }
      ]

      prismaMock.purchaseOrder.findMany.mockResolvedValue(mockOrders as any)
      prismaMock.purchaseOrder.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/purchase-orders')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.orders).toHaveLength(1)
      expect(data.orders[0]).toMatchObject({
        id: 'po1',
        orderNumber: 'PO-2024-001',
        status: 'PENDING',
        totalAmount: 1500.00
      })
      expect(data.total).toBe(1)
    })

    it('should filter orders by status', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.purchaseOrder.findMany.mockResolvedValue([])
      prismaMock.purchaseOrder.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/purchase-orders?status=APPROVED')
      await GET(request)

      expect(prismaMock.purchaseOrder.findMany).toHaveBeenCalledWith({
        where: { status: 'APPROVED' },
        include: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should filter orders by supplier', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.purchaseOrder.findMany.mockResolvedValue([])
      prismaMock.purchaseOrder.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/purchase-orders?supplierId=sup1')
      await GET(request)

      expect(prismaMock.purchaseOrder.findMany).toHaveBeenCalledWith({
        where: { supplierId: 'sup1' },
        include: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should filter orders by date range', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.purchaseOrder.findMany.mockResolvedValue([])
      prismaMock.purchaseOrder.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/purchase-orders?startDate=2024-01-01&endDate=2024-01-31')
      await GET(request)

      expect(prismaMock.purchaseOrder.findMany).toHaveBeenCalledWith({
        where: {
          orderDate: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31')
          }
        },
        include: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should return 401 for unauthorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: false,
        error: 'Unauthorized',
        status: 401
      })

      const request = new NextRequest('http://localhost:3000/api/purchase-orders')
      const response = await GET(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should handle database errors', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.purchaseOrder.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/purchase-orders')
      const response = await GET(request)

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Failed to fetch purchase orders' })
    })
  })

  describe('POST /api/purchase-orders', () => {
    it('should create new purchase order for admin', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      const mockNewOrder = {
        id: 'po1',
        orderNumber: 'PO-2024-001',
        status: 'PENDING',
        orderDate: new Date('2024-01-15'),
        expectedDeliveryDate: new Date('2024-01-25'),
        totalAmount: 1500.00,
        supplierId: 'sup1',
        createdById: 'admin1',
        notes: 'Urgent order',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Mock order number generation
      prismaMock.purchaseOrder.count.mockResolvedValue(0)
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          purchaseOrder: {
            create: jest.fn().mockResolvedValue(mockNewOrder)
          },
          purchaseOrderItem: {
            createMany: jest.fn().mockResolvedValue({ count: 1 })
          }
        })
      })

      const requestBody = {
        supplierId: 'sup1',
        orderDate: '2024-01-15',
        expectedDeliveryDate: '2024-01-25',
        notes: 'Urgent order',
        items: [
          {
            itemId: 'item1',
            quantity: 10,
            unitPrice: 150.00
          }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: 'po1',
        orderNumber: 'PO-2024-001',
        status: 'PENDING'
      })
    })

    it('should validate items before creating order', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      const requestBody = {
        supplierId: 'sup1',
        orderDate: '2024-01-15',
        items: [] // Empty items array
      }

      const request = new NextRequest('http://localhost:3000/api/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const errorData = await response.json()
      expect(errorData).toHaveProperty('error')
    })

    it('should return 401 for unauthorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: false,
        error: 'Unauthorized',
        status: 401
      })

      const request = new NextRequest('http://localhost:3000/api/purchase-orders', {
        method: 'POST',
        body: JSON.stringify({ supplierId: 'sup1' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should return 403 for employee user (insufficient permissions)', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: false,
        error: 'Insufficient permissions',
        status: 403
      })

      const request = new NextRequest('http://localhost:3000/api/purchase-orders', {
        method: 'POST',
        body: JSON.stringify({ supplierId: 'sup1' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({ error: 'Insufficient permissions' })
    })

    it('should handle database errors during creation', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.purchaseOrder.count.mockResolvedValue(0)
      prismaMock.$transaction.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        supplierId: 'sup1',
        orderDate: '2024-01-15',
        items: [
          {
            itemId: 'item1',
            quantity: 10,
            unitPrice: 150.00
          }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Failed to create purchase order' })
    })
  })
})