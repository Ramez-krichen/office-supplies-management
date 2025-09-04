import { NextRequest } from 'next/server'
import { GET, POST, PUT } from '@/app/api/inventory/route'
import { prismaMock } from '@/__mocks__/prisma'
import { checkAccess } from '@/lib/server-access-control'

// Mock server access control
jest.mock('@/lib/server-access-control')
const mockCheckAccess = checkAccess as jest.MockedFunction<typeof checkAccess>

describe('/api/inventory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/inventory', () => {
    it('should return inventory items for authorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN', department: 'IT' },
        userRole: 'ADMIN'
      })

      const mockItems = [
        {
          id: 'item1',
          name: 'Office Chair',
          description: 'Ergonomic office chair',
          sku: 'CHAIR-001',
          currentStock: 25,
          minimumStock: 10,
          maximumStock: 50,
          unitPrice: 299.99,
          unit: 'piece',
          isActive: true,
          location: 'Warehouse A',
          category: {
            id: 'cat1',
            name: 'Furniture'
          },
          supplier: {
            id: 'sup1',
            name: 'Office Furniture Co.'
          },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          stockMovements: [
            {
              id: 'move1',
              type: 'IN',
              quantity: 10,
              reason: 'Purchase order received',
              createdAt: new Date('2024-01-15')
            }
          ]
        }
      ]

      prismaMock.item.findMany.mockResolvedValue(mockItems as any)
      prismaMock.item.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/inventory')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toHaveLength(1)
      expect(data.items[0]).toMatchObject({
        id: 'item1',
        name: 'Office Chair',
        currentStock: 25,
        minimumStock: 10
      })
      expect(data.total).toBe(1)
    })

    it('should filter items by category', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.item.findMany.mockResolvedValue([])
      prismaMock.item.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/inventory?categoryId=cat1')
      await GET(request)

      expect(prismaMock.item.findMany).toHaveBeenCalledWith({
        where: { categoryId: 'cat1', isActive: true },
        include: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: { name: 'asc' }
      })
    })

    it('should filter low stock items', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.item.findMany.mockResolvedValue([])
      prismaMock.item.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/inventory?lowStock=true')
      await GET(request)

      expect(prismaMock.item.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          currentStock: { lte: expect.anything() }
        }),
        include: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: { name: 'asc' }
      })
    })

    it('should search items by name or SKU', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.item.findMany.mockResolvedValue([])
      prismaMock.item.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/inventory?search=chair')
      await GET(request)

      expect(prismaMock.item.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { name: { contains: 'chair', mode: 'insensitive' } },
            { sku: { contains: 'chair', mode: 'insensitive' } },
            { description: { contains: 'chair', mode: 'insensitive' } }
          ]
        },
        include: expect.any(Object),
        skip: 0,
        take: 20,
        orderBy: { name: 'asc' }
      })
    })

    it('should return 401 for unauthorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: false,
        error: 'Unauthorized',
        status: 401
      })

      const request = new NextRequest('http://localhost:3000/api/inventory')
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

      prismaMock.item.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/inventory')
      const response = await GET(request)

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Failed to fetch inventory items' })
    })
  })

  describe('POST /api/inventory', () => {
    it('should create new inventory item for admin', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      const mockNewItem = {
        id: 'item1',
        name: 'New Office Chair',
        description: 'Ergonomic office chair',
        sku: 'CHAIR-002',
        currentStock: 0,
        minimumStock: 5,
        maximumStock: 25,
        unitPrice: 250.00,
        unit: 'piece',
        isActive: true,
        location: 'Warehouse A',
        categoryId: 'cat1',
        supplierId: 'sup1',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      prismaMock.item.findFirst.mockResolvedValue(null) // No existing item
      prismaMock.item.create.mockResolvedValue(mockNewItem as any)

      const requestBody = {
        name: 'New Office Chair',
        description: 'Ergonomic office chair',
        sku: 'CHAIR-002',
        minimumStock: 5,
        maximumStock: 25,
        unitPrice: 250.00,
        unit: 'piece',
        location: 'Warehouse A',
        categoryId: 'cat1',
        supplierId: 'sup1'
      }

      const request = new NextRequest('http://localhost:3000/api/inventory', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: 'item1',
        name: 'New Office Chair',
        sku: 'CHAIR-002'
      })
      expect(prismaMock.item.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Office Chair',
          sku: 'CHAIR-002',
          currentStock: 0
        })
      })
    })

    it('should return 400 for duplicate SKU', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      const existingItem = {
        id: 'existing1',
        sku: 'CHAIR-002'
      }

      prismaMock.item.findFirst.mockResolvedValue(existingItem as any)

      const requestBody = {
        name: 'New Chair',
        sku: 'CHAIR-002',
        categoryId: 'cat1',
        supplierId: 'sup1'
      }

      const request = new NextRequest('http://localhost:3000/api/inventory', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ 
        error: 'An item with this SKU already exists' 
      })
    })

    it('should return 401 for unauthorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: false,
        error: 'Unauthorized',
        status: 401
      })

      const request = new NextRequest('http://localhost:3000/api/inventory', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })
  })

  describe('PUT /api/inventory', () => {
    it('should update inventory item for admin', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      const existingItem = {
        id: 'item1',
        name: 'Office Chair',
        sku: 'CHAIR-001'
      }

      const updatedItem = {
        ...existingItem,
        name: 'Updated Office Chair',
        minimumStock: 15
      }

      prismaMock.item.findUnique.mockResolvedValue(existingItem as any)
      prismaMock.item.findFirst.mockResolvedValue(null) // No SKU conflict
      prismaMock.item.update.mockResolvedValue(updatedItem as any)

      const requestBody = {
        id: 'item1',
        name: 'Updated Office Chair',
        sku: 'CHAIR-001',
        minimumStock: 15
      }

      const request = new NextRequest('http://localhost:3000/api/inventory', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        id: 'item1',
        name: 'Updated Office Chair'
      })
      expect(prismaMock.item.update).toHaveBeenCalledWith({
        where: { id: 'item1' },
        data: expect.objectContaining({
          name: 'Updated Office Chair',
          minimumStock: 15
        })
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
        id: 'nonexistent',
        name: 'Test Item'
      }

      const request = new NextRequest('http://localhost:3000/api/inventory', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request)

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Item not found' })
    })

    it('should return 401 for unauthorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: false,
        error: 'Unauthorized',
        status: 401
      })

      const request = new NextRequest('http://localhost:3000/api/inventory', {
        method: 'PUT',
        body: JSON.stringify({ id: 'item1', name: 'Test' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PUT(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })
  })
})