import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/users/route'
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

describe('/api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/users', () => {
    it('should return users for admin user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN', department: 'IT' },
        userRole: 'ADMIN'
      })

      const mockUsers = [
        {
          id: 'user1',
          name: 'John Doe',
          email: 'john@test.com',
          role: 'EMPLOYEE',
          department: 'Sales',
          status: 'ACTIVE',
          lastSignIn: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: 'user2',
          name: 'Jane Smith',
          email: 'jane@test.com',
          role: 'MANAGER',
          department: 'HR',
          status: 'ACTIVE',
          lastSignIn: new Date('2024-01-02'),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ]

      prismaMock.user.findMany.mockResolvedValue(mockUsers)

      const request = new NextRequest('http://localhost:3000/api/users')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0]).toMatchObject({
        id: 'user2', // Manager should come first due to sorting
        name: 'Jane Smith',
        role: 'MANAGER'
      })
      expect(data[1]).toMatchObject({
        id: 'user1', // Employee should come second
        name: 'John Doe',
        role: 'EMPLOYEE'
      })
    })

    it('should return 401 for unauthorized user', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: false,
        error: 'Unauthorized',
        status: 401
      })

      const request = new NextRequest('http://localhost:3000/api/users')
      const response = await GET(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should filter users by department for manager', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'manager1', role: 'MANAGER', department: 'Sales' },
        userRole: 'MANAGER'
      })

      prismaMock.user.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/users')
      await GET(request)

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: { department: 'Sales' },
        select: expect.any(Object)
      })
    })

    it('should allow admin to filter by department', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN', department: 'IT' },
        userRole: 'ADMIN'
      })

      prismaMock.user.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/users?department=HR')
      await GET(request)

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: { department: 'HR' },
        select: expect.any(Object)
      })
    })

    it('should handle database errors', async () => {
      mockCheckAccess.mockResolvedValue({
        hasAccess: true,
        user: { id: 'admin1', role: 'ADMIN' },
        userRole: 'ADMIN'
      })

      prismaMock.user.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/users')
      const response = await GET(request)

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Failed to fetch users' })
    })
  })

  describe('POST /api/users', () => {
    const mockAdminSession = {
      user: { id: 'admin1', email: 'admin@test.com', role: 'ADMIN' }
    }

    it('should create a new user for admin', async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession)

      const mockNewUser = {
        id: 'user1',
        name: 'New User',
        email: 'newuser@test.com',
        role: 'EMPLOYEE',
        department: 'Sales',
        status: 'ACTIVE'
      }

      prismaMock.user.findUnique.mockResolvedValue(null) // No existing user
      prismaMock.user.count.mockResolvedValue(1) // One admin exists
      prismaMock.user.create.mockResolvedValue(mockNewUser)

      const requestBody = {
        name: 'New User',
        email: 'newuser@test.com',
        password: 'password123',
        role: 'EMPLOYEE',
        department: 'Sales',
        status: 'ACTIVE'
      }

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: 'user1',
        name: 'New User',
        email: 'newuser@test.com',
        role: 'EMPLOYEE'
      })
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New User',
          email: 'newuser@test.com',
          role: 'EMPLOYEE',
          department: 'Sales',
          status: 'ACTIVE'
        })
      })
    })

    it('should return 401 for non-admin user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'user@test.com', role: 'EMPLOYEE' }
      })

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('should return 400 for missing required fields', async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession)

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Incomplete User'
          // Missing required fields
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Missing required fields' })
    })

    it('should return 409 for duplicate email', async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession)

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'existing@test.com'
      } as { id: string; email: string })

      const requestBody = {
        name: 'New User',
        email: 'existing@test.com',
        password: 'password123',
        role: 'EMPLOYEE',
        department: 'Sales'
      }

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({ error: 'Email already in use' })
    })

    it('should prevent creating multiple admin accounts', async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession)

      prismaMock.user.findUnique.mockResolvedValue(null)
      prismaMock.user.count.mockResolvedValue(1) // One admin already exists

      const requestBody = {
        name: 'Another Admin',
        email: 'admin2@test.com',
        password: 'password123',
        role: 'ADMIN',
        department: 'IT'
      }

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({ error: 'Only one admin account is allowed' })
    })

    it('should allow creating admin when none exists', async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession)

      const mockNewAdmin = {
        id: 'admin2',
        name: 'New Admin',
        email: 'admin2@test.com',
        role: 'ADMIN',
        department: 'IT',
        status: 'ACTIVE'
      }

      prismaMock.user.findUnique.mockResolvedValue(null)
      prismaMock.user.count.mockResolvedValue(0) // No admin exists
      prismaMock.user.create.mockResolvedValue(mockNewAdmin)

      const requestBody = {
        name: 'New Admin',
        email: 'admin2@test.com',
        password: 'password123',
        role: 'ADMIN',
        department: 'IT'
      }

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(await response.json()).toMatchObject({
        id: 'admin2',
        role: 'ADMIN'
      })
    })

    it('should handle database errors during creation', async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession)

      prismaMock.user.findUnique.mockResolvedValue(null)
      prismaMock.user.count.mockResolvedValue(1)
      prismaMock.user.create.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        name: 'New User',
        email: 'newuser@test.com',
        password: 'password123',
        role: 'EMPLOYEE',
        department: 'Sales'
      }

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Failed to create user' })
    })
  })
})