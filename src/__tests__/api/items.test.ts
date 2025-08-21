import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/items/route'
import { prismaMock } from '@/__mocks__/prisma'
import { getServerSession } from 'next-auth/next'

// Mock next-auth
jest.mock('next-auth/next')
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

// Mock server access control
const mockCheckAccess = jest.fn()
const mockCreateFeatureAccessCheck = jest.fn(() => () => ({}))

jest.mock('@/lib/server-access-control', () => ({
  checkAccess: mockCheckAccess,
  createFeatureAccessCheck: mockCreateFeatureAccessCheck
}))

describe('/api/items', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/items', () => {
    it('should return items with pagination for authorized user', async () => {
      // Mock access control
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'user1', role: 'ADMIN' },
        userRole: 'ADMIN',
        userDepartment: null,
        requiresDepartmentFiltering: false
      })

      // Mock database response
      const mockItems = [
        {
          id: 'item1',
          reference: 'REF001',
          name: 'Test Item 1',
          description: 'Test description',
          unit: 'pcs',
          price: 10.50,
          minStock: 5,
          currentStock: 20,
          isActive: true,
          isEcoFriendly: false,
          ecoRating: null,
          carbonFootprint: null,
          updatedAt: new Date('2024-01-01'),
          category: { name: 'Office Supplies' },
          supplier: { name: 'Test Supplier' }
        }
      ]

      prismaMock.item.findMany.mockResolvedValue(mockItems)
      prismaMock.item.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/items?page=1&limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toHaveLength(1)
      expect(data.items[0]).toMatchObject({
        id: 'item1',
        name: 'Test Item 1',
        category: 'Office Supplies',
        sku: 'REF001',
        quantity: 20,
        status: 'in-stock'
      })
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1
      })
    })

    it('should return 401 for unauthorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: false,
        error: 'Unauthorized',
        status: 401
      })

      const request = new NextRequest('http://localhost:3000/api/items')
      const response = await GET(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should filter items by category', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'user1', role: 'ADMIN' },
        userRole: 'ADMIN',
        userDepartment: null,
        requiresDepartmentFiltering: false
      })

      prismaMock.item.findMany.mockResolvedValue([])
      prismaMock.item.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/items?category=Electronics')
      await GET(request)

      expect(prismaMock.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: { name: 'Electronics' }
          })
        })
      )
    })

    it('should filter items by search term', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'user1', role: 'ADMIN' },
        userRole: 'ADMIN',
        userDepartment: null,
        requiresDepartmentFiltering: false
      })

      prismaMock.item.findMany.mockResolvedValue([])
      prismaMock.item.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/items?search=laptop')
      await GET(request)

      expect(prismaMock.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'laptop', mode: 'insensitive' } },
              { reference: { contains: 'laptop', mode: 'insensitive' } },
              { description: { contains: 'laptop', mode: 'insensitive' } }
            ]
          })
        })
      )
    })

    it('should handle database errors', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'user1', role: 'ADMIN' },
        userRole: 'ADMIN',
        userDepartment: null,
        requiresDepartmentFiltering: false
      })

      prismaMock.item.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/items')
      const response = await GET(request)

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Failed to fetch items' })
    })
  })

  describe('POST /api/items', () => {
    const mockSession = {
      user: { id: 'user1', email: 'admin@test.com', role: 'ADMIN' }
    }

    it('should create a new item for authorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'user1', role: 'ADMIN' },
        userRole: 'ADMIN',
        userDepartment: null,
        requiresDepartmentFiltering: false
      })

      mockGetServerSession.mockResolvedValue(mockSession)

      const mockNewItem = {
        id: 'item1',
        name: 'New Item',
        reference: 'REF001',
        unit: 'pcs',
        price: 15.99,
        minStock: 10,
        currentStock: 50,
        categoryId: 'cat1',
        supplierId: 'sup1',
        isEcoFriendly: true,
        category: { name: 'Office Supplies' },
        supplier: { name: 'Test Supplier' }
      }

      prismaMock.item.findUnique.mockResolvedValue(null) // No existing item
      prismaMock.item.create.mockResolvedValue(mockNewItem)
      prismaMock.auditLog.create.mockResolvedValue({
        id: 'audit1',
        action: 'CREATE',
        entity: 'Item',
        entityId: 'item1',
        performedBy: 'user1',
        details: 'Created item: New Item',
        createdAt: new Date()
      })

      const requestBody = {
        name: 'New Item',
        reference: 'REF001',
        unit: 'pcs',
        price: '15.99',
        minStock: '10',
        currentStock: '50',
        categoryId: 'cat1',
        supplierId: 'sup1',
        isEcoFriendly: true
      }

      const request = new NextRequest('http://localhost:3000/api/items', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: 'item1',
        name: 'New Item',
        reference: 'REF001'
      })
      expect(prismaMock.item.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Item',
            reference: 'REF001',
            price: 15.99,
            minStock: 10,
            currentStock: 50,
            isEcoFriendly: true
          })
        })
      )
      expect(prismaMock.auditLog.create).toHaveBeenCalled()
    })

    it('should return 401 for unauthorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: false,
        error: 'Unauthorized',
        status: 401
      })

      const request = new NextRequest('http://localhost:3000/api/items', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should return 400 for missing required fields', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'user1', role: 'ADMIN' },
        userRole: 'ADMIN',
        userDepartment: null,
        requiresDepartmentFiltering: false
      })

      mockGetServerSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/items', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Incomplete Item'
          // Missing required fields
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Missing required fields' })
    })

    it('should return 400 for duplicate reference', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'user1', role: 'ADMIN' },
        userRole: 'ADMIN',
        userDepartment: null,
        requiresDepartmentFiltering: false
      })

      mockGetServerSession.mockResolvedValue(mockSession)

      // Mock existing item with same reference
      prismaMock.item.findUnique.mockResolvedValue({
        id: 'existing-item',
        reference: 'REF001'
      } as { id: string; reference: string })

      const requestBody = {
        name: 'New Item',
        reference: 'REF001',
        unit: 'pcs',
        price: '15.99',
        categoryId: 'cat1',
        supplierId: 'sup1'
      }

      const request = new NextRequest('http://localhost:3000/api/items', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Item reference already exists' })
    })

    it('should handle database errors during creation', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'user1', role: 'ADMIN' },
        userRole: 'ADMIN',
        userDepartment: null,
        requiresDepartmentFiltering: false
      })

      mockGetServerSession.mockResolvedValue(mockSession)
      prismaMock.item.findUnique.mockResolvedValue(null)
      prismaMock.item.create.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        name: 'New Item',
        reference: 'REF001',
        unit: 'pcs',
        price: '15.99',
        categoryId: 'cat1',
        supplierId: 'sup1'
      }

      const request = new NextRequest('http://localhost:3000/api/items', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Failed to create item' })
    })
  })
})