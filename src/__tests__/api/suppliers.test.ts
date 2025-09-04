import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/suppliers/route'
import { prismaMock } from '@/__mocks__/prisma'
import { checkAccess } from '@/lib/server-access-control'

// Mock server access control
jest.mock('@/lib/server-access-control')
const mockCheckAccess = checkAccess as jest.MockedFunction<typeof checkAccess>

// Mock supplier category detection
jest.mock('@/lib/supplier-category-detection', () => ({
  parseSupplierCategoriesEnhanced: jest.fn(() => ({
    categories: ['Office Supplies'],
    confidence: 0.8,
    detectionMethods: ['item_analysis']
  }))
}))

describe('/api/suppliers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/suppliers', () => {
    it('should return suppliers for admin user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN', department: 'IT' },
        userRole: 'ADMIN'
      })

      const mockSuppliers = [
        {
          id: 'supplier1',
          name: 'Clean & Fresh Supplies',
          email: 'sales@cleanfresh.com',
          phone: '+1-555-0105',
          address: '9725 Business St, Suite 480, City, State 52741',
          contactPerson: 'David Wilson',
          contactTitle: 'Sales Manager',
          paymentTerms: 'Net 30',
          status: 'ACTIVE',
          categories: JSON.stringify(['Cleaning Supplies', 'Furniture']),
          categoriesDetectedAt: new Date('2024-01-01'),
          notes: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          items: [
            {
              id: 'item1',
              name: 'Office Chair',
              category: { name: 'Furniture' }
            }
          ],
          purchaseOrders: [
            {
              id: 'po1',
              orderDate: new Date('2024-01-15')
            }
          ]
        }
      ]

      prismaMock.supplier.findMany.mockResolvedValue(mockSuppliers)
      prismaMock.supplier.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/suppliers')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.suppliers).toHaveLength(1)
      expect(data.suppliers[0]).toMatchObject({
        id: 'supplier1',
        name: 'Clean & Fresh Supplies',
        email: 'sales@cleanfresh.com'
      })
      expect(data.total).toBe(1)
    })

    it('should return 401 for unauthorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: false,
        error: 'Unauthorized',
        status: 401
      })

      const request = new NextRequest('http://localhost:3000/api/suppliers')
      const response = await GET(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should handle pagination parameters', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.supplier.findMany.mockResolvedValue([])
      prismaMock.supplier.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/suppliers?page=2&limit=5')
      await GET(request)

      expect(prismaMock.supplier.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        skip: 5, // (page 2 - 1) * limit 5
        take: 5,
        orderBy: { name: 'asc' }
      })
    })

    it('should handle search query', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.supplier.findMany.mockResolvedValue([])
      prismaMock.supplier.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/suppliers?search=Clean')
      await GET(request)

      expect(prismaMock.supplier.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'Clean', mode: 'insensitive' } },
            { email: { contains: 'Clean', mode: 'insensitive' } },
            { contactPerson: { contains: 'Clean', mode: 'insensitive' } }
          ]
        },
        include: expect.any(Object),
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' }
      })
    })

    it('should handle database errors', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.supplier.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/suppliers')
      const response = await GET(request)

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Failed to fetch suppliers' })
    })
  })

  describe('POST /api/suppliers', () => {
    it('should create a new supplier for admin', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      const mockNewSupplier = {
        id: 'supplier1',
        name: 'New Supplier Co.',
        email: 'contact@newsupplier.com',
        phone: '+1-555-0100',
        address: '123 Business Ave',
        contactPerson: 'John Doe',
        contactTitle: 'Sales Rep',
        paymentTerms: 'Net 30',
        status: 'ACTIVE',
        categories: null,
        categoriesDetectedAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      prismaMock.supplier.findUnique.mockResolvedValue(null) // No existing supplier
      prismaMock.supplier.create.mockResolvedValue(mockNewSupplier)

      const requestBody = {
        name: 'New Supplier Co.',
        email: 'contact@newsupplier.com',
        phone: '+1-555-0100',
        address: '123 Business Ave',
        contactPerson: 'John Doe',
        contactTitle: 'Sales Rep',
        paymentTerms: 'Net 30',
        status: 'ACTIVE'
      }

      const request = new NextRequest('http://localhost:3000/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: 'supplier1',
        name: 'New Supplier Co.',
        email: 'contact@newsupplier.com'
      })
      expect(prismaMock.supplier.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Supplier Co.',
          email: 'contact@newsupplier.com',
          status: 'ACTIVE'
        })
      })
    })

    it('should return 400 for duplicate email', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      const existingSupplier = {
        id: 'existing1',
        email: 'existing@supplier.com'
      }

      prismaMock.supplier.findUnique.mockResolvedValue(existingSupplier as any)

      const requestBody = {
        name: 'New Supplier',
        email: 'existing@supplier.com',
        phone: '+1-555-0100',
        address: '123 Business Ave',
        contactPerson: 'John Doe'
      }

      const request = new NextRequest('http://localhost:3000/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ 
        error: 'A supplier with this email already exists' 
      })
    })

    it('should return 401 for unauthorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: false,
        error: 'Unauthorized',
        status: 401
      })

      const request = new NextRequest('http://localhost:3000/api/suppliers', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should return 400 for missing required fields', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      const request = new NextRequest('http://localhost:3000/api/suppliers', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }), // Missing required fields
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const errorData = await response.json()
      expect(errorData).toHaveProperty('error')
    })

    it('should handle database errors during creation', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.supplier.findUnique.mockResolvedValue(null)
      prismaMock.supplier.create.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        name: 'New Supplier',
        email: 'new@supplier.com',
        phone: '+1-555-0100',
        address: '123 Business Ave',
        contactPerson: 'John Doe'
      }

      const request = new NextRequest('http://localhost:3000/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Failed to create supplier' })
    })
  })
})