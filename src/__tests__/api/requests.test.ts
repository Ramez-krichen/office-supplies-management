import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/requests/route'
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

describe('/api/requests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/requests', () => {
    it('should return requests for authorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN',
        userDepartment: null,
        requiresDepartmentFiltering: false
      })

      const mockRequests = [
        {
          id: 'req1',
          title: 'Office Supplies Request',
          description: 'Need office supplies',
          requesterId: 'user1',
          department: 'Sales',
          status: 'PENDING',
          priority: 'MEDIUM',
          totalAmount: 150.00,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          requester: {
            id: 'user1',
            name: 'John Doe',
            email: 'john@test.com'
          },
          items: [
            {
              id: 'reqitem1',
              quantity: 10,
              unitPrice: 5.00,
              totalPrice: 50.00,
              notes: 'Blue pens',
              item: {
                id: 'item1',
                name: 'Pen',
                reference: 'PEN001',
                unit: 'pcs',
                category: { name: 'Office Supplies' }
              }
            }
          ],
          approvals: [
            {
              id: 'approval1',
              level: 1,
              status: 'PENDING',
              comments: null,
              updatedAt: new Date('2024-01-01'),
              approver: {
                id: 'manager1',
                name: 'Jane Manager',
                email: 'jane@test.com'
              }
            }
          ]
        }
      ]

      prismaMock.request.findMany.mockResolvedValue(mockRequests)
      prismaMock.request.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/requests?page=1&limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.requests).toHaveLength(1)
      expect(data.requests[0]).toMatchObject({
        id: 'req1',
        title: 'Office Supplies Request',
        requester: 'John Doe',
        department: 'Sales',
        status: 'PENDING',
        priority: 'MEDIUM',
        totalAmount: 150.00
      })
      expect(data.requests[0].items).toHaveLength(1)
      expect(data.requests[0].items[0]).toMatchObject({
        itemId: 'item1',
        name: 'Pen',
        quantity: 10,
        unitPrice: 5.00,
        totalPrice: 50.00
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

      const request = new NextRequest('http://localhost:3000/api/requests')
      const response = await GET(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should filter requests for employee (own requests only)', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'employee1', role: 'EMPLOYEE' },
        userRole: 'EMPLOYEE',
        userDepartment: 'Sales',
        requiresDepartmentFiltering: true
      })

      prismaMock.request.findMany.mockResolvedValue([])
      prismaMock.request.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/requests')
      await GET(request)

      expect(prismaMock.request.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            requesterId: 'employee1'
          })
        })
      )
    })

    it('should filter requests for manager (department only)', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'manager1', role: 'MANAGER', department: 'Sales' },
        userRole: 'MANAGER',
        userDepartment: 'Sales',
        requiresDepartmentFiltering: true
      })

      prismaMock.request.findMany.mockResolvedValue([])
      prismaMock.request.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/requests')
      await GET(request)

      expect(prismaMock.request.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            department: 'Sales'
          })
        })
      )
    })

    it('should filter by status', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN',
        userDepartment: null,
        requiresDepartmentFiltering: false
      })

      prismaMock.request.findMany.mockResolvedValue([])
      prismaMock.request.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/requests?status=APPROVED')
      await GET(request)

      expect(prismaMock.request.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'APPROVED'
          })
        })
      )
    })

    it('should filter by search term', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN',
        userDepartment: null,
        requiresDepartmentFiltering: false
      })

      prismaMock.request.findMany.mockResolvedValue([])
      prismaMock.request.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/requests?search=office')
      await GET(request)

      expect(prismaMock.request.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'office', mode: 'insensitive' } },
              { description: { contains: 'office', mode: 'insensitive' } },
              {
                requester: {
                  name: { contains: 'office', mode: 'insensitive' }
                }
              }
            ]
          })
        })
      )
    })

    it('should handle database errors', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN',
        userDepartment: null,
        requiresDepartmentFiltering: false
      })

      prismaMock.request.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/requests')
      const response = await GET(request)

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Failed to fetch requests' })
    })
  })

  describe('POST /api/requests', () => {
    const mockSession = {
      user: { id: 'user1', email: 'user@test.com', role: 'EMPLOYEE' }
    }

    const mockUser = {
      id: 'user1',
      name: 'John Doe',
      email: 'user@test.com',
      role: 'EMPLOYEE',
      department: 'Sales'
    }

    it('should create a new request for authorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: mockUser,
        userRole: 'EMPLOYEE',
        userDepartment: 'Sales'
      })

      mockGetServerSession.mockResolvedValue(mockSession)

      const mockNewRequest = {
        id: 'req1',
        title: 'New Request',
        description: 'Test request',
        department: 'Sales',
        priority: 'MEDIUM',
        totalAmount: 100.00,
        requesterId: 'user1',
        requester: {
          id: 'user1',
          name: 'John Doe',
          email: 'user@test.com'
        },
        items: [
          {
            id: 'reqitem1',
            itemId: 'item1',
            quantity: 5,
            unitPrice: 20.00,
            totalPrice: 100.00,
            item: {
              id: 'item1',
              name: 'Test Item'
            }
          }
        ]
      }

      const mockManagers = [
        {
          id: 'manager1',
          name: 'Jane Manager',
          email: 'jane@test.com',
          role: 'MANAGER',
          status: 'ACTIVE'
        }
      ]

      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      prismaMock.request.create.mockResolvedValue(mockNewRequest)
      prismaMock.user.findMany.mockResolvedValue(mockManagers)
      prismaMock.approval.create.mockResolvedValue({
        id: 'approval1',
        requestId: 'req1',
        approverId: 'manager1',
        level: 1
      })
      prismaMock.auditLog.create.mockResolvedValue({
        id: 'audit1',
        action: 'CREATE',
        entity: 'Request',
        entityId: 'req1',
        performedBy: 'user1',
        details: 'Created request: New Request',
        createdAt: new Date()
      })

      const requestBody = {
        title: 'New Request',
        description: 'Test request',
        department: 'Sales',
        priority: 'MEDIUM',
        items: [
          {
            itemId: 'item1',
            quantity: 5,
            unitPrice: 20.00,
            notes: 'Test item'
          }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/requests', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: 'req1',
        title: 'New Request',
        totalAmount: 100.00
      })
      expect(prismaMock.request.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New Request',
            description: 'Test request',
            department: 'Sales',
            priority: 'MEDIUM',
            totalAmount: 100.00,
            requesterId: 'user1'
          })
        })
      )
      expect(prismaMock.approval.create).toHaveBeenCalled()
      expect(prismaMock.auditLog.create).toHaveBeenCalled()
    })

    it('should return 401 for unauthorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: false,
        error: 'Unauthorized',
        status: 401
      })

      const request = new NextRequest('http://localhost:3000/api/requests', {
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
        user: mockUser,
        userRole: 'EMPLOYEE',
        userDepartment: 'Sales'
      })

      mockGetServerSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Incomplete Request'
          // Missing required fields
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Missing required fields' })
    })

    it('should return 400 for invalid items', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: mockUser,
        userRole: 'EMPLOYEE',
        userDepartment: 'Sales'
      })

      mockGetServerSession.mockResolvedValue(mockSession)

      const requestBody = {
        title: 'Request with Invalid Items',
        department: 'Sales',
        items: [
          {
            // Missing required fields
            quantity: 5
          }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/requests', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ 
        error: 'Item 1 is missing required fields (itemId, quantity, or unitPrice)' 
      })
    })

    it('should return 400 for user not found in database', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: mockUser,
        userRole: 'EMPLOYEE',
        userDepartment: 'Sales'
      })

      mockGetServerSession.mockResolvedValue(mockSession)
      prismaMock.user.findUnique.mockResolvedValue(null) // User not found

      const requestBody = {
        title: 'New Request',
        department: 'Sales',
        items: [
          {
            itemId: 'item1',
            quantity: 5,
            unitPrice: 20.00
          }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/requests', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'User not found in database' })
    })

    it('should handle database errors during creation', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: mockUser,
        userRole: 'EMPLOYEE',
        userDepartment: 'Sales'
      })

      mockGetServerSession.mockResolvedValue(mockSession)
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      prismaMock.request.create.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        title: 'New Request',
        department: 'Sales',
        items: [
          {
            itemId: 'item1',
            quantity: 5,
            unitPrice: 20.00
          }
        ]
      }

      const request = new NextRequest('http://localhost:3000/api/requests', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Failed to create request' })
    })
  })
})