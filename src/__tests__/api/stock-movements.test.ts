import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/inventory/stock-movements/route'
import { prismaMock } from '@/__mocks__/prisma'
import { checkAccess } from '@/lib/server-access-control'

// Mock server access control
jest.mock('@/lib/server-access-control')
const mockCheckAccess = checkAccess as jest.MockedFunction<typeof checkAccess>

describe('/api/inventory/stock-movements', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/inventory/stock-movements', () => {
    it('should return stock movements for authorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN', department: 'IT' },
        userRole: 'ADMIN'
      })

      const mockMovements = [
        {
          id: 'move1',
          type: 'IN',
          quantity: 10,
          reason: 'Purchase order received',
          notes: 'Shipment #12345',
          createdAt: new Date('2024-01-15'),
          item: {
            id: 'item1',
            name: 'Office Chair',
            sku: 'CHAIR-001'
          },
          user: {
            id: 'user1',
            name: 'John Doe'
          }
        },
        {
          id: 'move2',
          type: 'OUT',
          quantity: 5,
          reason: 'Request fulfillment',
          notes: 'Request #REQ-001',
          createdAt: new Date('2024-01-20'),
          item: {
            id: 'item1',
            name: 'Office Chair',
            sku: 'CHAIR-001'
          },
          user: {
            id: 'user2',
            name: 'Jane Smith'
          }
        }
      ]

      prismaMock.stockMovement.findMany.mockResolvedValue(mockMovements as any)
      prismaMock.stockMovement.count.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/inventory/stock-movements')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.movements).toHaveLength(2)
      expect(data.movements[0]).toMatchObject({
        id: 'move1',
        type: 'IN',
        quantity: 10,
        reason: 'Purchase order received'
      })
      expect(data.total).toBe(2)
    })

    it('should filter movements by item ID', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.stockMovement.findMany.mockResolvedValue([])
      prismaMock.stockMovement.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/inventory/stock-movements?itemId=item1')
      await GET(request)

      expect(prismaMock.stockMovement.findMany).toHaveBeenCalledWith({
        where: { itemId: 'item1' },
        include: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should filter movements by type', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.stockMovement.findMany.mockResolvedValue([])
      prismaMock.stockMovement.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/inventory/stock-movements?type=IN')
      await GET(request)

      expect(prismaMock.stockMovement.findMany).toHaveBeenCalledWith({
        where: { type: 'IN' },
        include: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should filter movements by date range', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.stockMovement.findMany.mockResolvedValue([])
      prismaMock.stockMovement.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/inventory/stock-movements?startDate=2024-01-01&endDate=2024-01-31')
      await GET(request)

      expect(prismaMock.stockMovement.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
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

      const request = new NextRequest('http://localhost:3000/api/inventory/stock-movements')
      const response = await GET(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })
  })

  describe('POST /api/inventory/stock-movements', () => {
    it('should create stock movement and update item stock for admin', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      const existingItem = {
        id: 'item1',
        name: 'Office Chair',
        currentStock: 20
      }

      const mockMovement = {
        id: 'move1',
        itemId: 'item1',
        type: 'IN',
        quantity: 10,
        reason: 'Stock replenishment',
        notes: 'Weekly restock',
        userId: 'admin1',
        createdAt: new Date()
      }

      const updatedItem = {
        ...existingItem,
        currentStock: 30
      }

      prismaMock.item.findUnique.mockResolvedValue(existingItem as any)
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          stockMovement: {
            create: jest.fn().mockResolvedValue(mockMovement)
          },
          item: {
            update: jest.fn().mockResolvedValue(updatedItem)
          }
        })
      })

      const requestBody = {
        itemId: 'item1',
        type: 'IN',
        quantity: 10,
        reason: 'Stock replenishment',
        notes: 'Weekly restock'
      }

      const request = new NextRequest('http://localhost:3000/api/inventory/stock-movements', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: 'move1',
        type: 'IN',
        quantity: 10
      })
    })

    it('should prevent negative stock for OUT movements', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      const existingItem = {
        id: 'item1',
        name: 'Office Chair',
        currentStock: 5
      }

      prismaMock.item.findUnique.mockResolvedValue(existingItem as any)

      const requestBody = {
        itemId: 'item1',
        type: 'OUT',
        quantity: 10, // More than current stock
        reason: 'Request fulfillment'
      }

      const request = new NextRequest('http://localhost:3000/api/inventory/stock-movements', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ 
        error: 'Insufficient stock. Current stock: 5, requested: 10' 
      })
    })

    it('should return 404 for non-existent item', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.item.findUnique.mockResolvedValue(null)

      const requestBody = {
        itemId: 'nonexistent',
        type: 'IN',
        quantity: 10,
        reason: 'Test'
      }

      const request = new NextRequest('http://localhost:3000/api/inventory/stock-movements', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Item not found' })
    })

    it('should return 401 for unauthorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: false,
        error: 'Unauthorized',
        status: 401
      })

      const request = new NextRequest('http://localhost:3000/api/inventory/stock-movements', {
        method: 'POST',
        body: JSON.stringify({ itemId: 'item1', type: 'IN', quantity: 10 }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should validate required fields', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      const request = new NextRequest('http://localhost:3000/api/inventory/stock-movements', {
        method: 'POST',
        body: JSON.stringify({ itemId: 'item1' }), // Missing required fields
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const errorData = await response.json()
      expect(errorData).toHaveProperty('error')
    })
  })
})