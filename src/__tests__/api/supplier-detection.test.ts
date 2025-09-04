import { NextRequest } from 'next/server'
import { POST } from '@/app/api/suppliers/[id]/detect-categories/route'
import { prismaMock } from '@/__mocks__/prisma'
import { checkAccess } from '@/lib/server-access-control'
import * as categoryDetection from '@/lib/supplier-category-detection'

// Mock server access control
jest.mock('@/lib/server-access-control')
const mockCheckAccess = checkAccess as jest.MockedFunction<typeof checkAccess>

// Mock supplier category detection
jest.mock('@/lib/supplier-category-detection')
const mockDetectAndUpdateSupplierCategories = jest.spyOn(categoryDetection, 'detectAndUpdateSupplierCategories')

describe('/api/suppliers/[id]/detect-categories', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should detect and update supplier categories successfully', async () => {
    mockCheckAccess.mockResolvedValue({
      hasAccess: true,
      user: { id: 'admin1', role: 'ADMIN' },
      userRole: 'ADMIN'
    })

    const mockDetectionResult = {
      supplierId: 'supplier1',
      categories: ['Office Supplies', 'Furniture'],
      detectedAt: new Date('2024-01-01'),
      itemCount: 5,
      categoryCount: 2,
      detectionMethods: ['item_analysis'],
      suggestions: [
        {
          category: 'Office Supplies',
          confidence: 0.9,
          method: 'item_analysis',
          reasoning: 'Based on supplied items'
        }
      ]
    }

    mockDetectAndUpdateSupplierCategories.mockResolvedValue(mockDetectionResult)

    const request = new NextRequest('http://localhost:3000/api/suppliers/supplier1/detect-categories', {
      method: 'POST'
    })

    const response = await POST(request, { params: { id: 'supplier1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      detection: mockDetectionResult
    })
    expect(mockDetectAndUpdateSupplierCategories).toHaveBeenCalledWith('supplier1')
  })

  it('should return 401 for unauthorized user', async () => {
    mockCheckAccess.mockResolvedValue({
      hasAccess: false,
      error: 'Unauthorized',
      status: 401
    })

    const request = new NextRequest('http://localhost:3000/api/suppliers/supplier1/detect-categories', {
      method: 'POST'
    })

    const response = await POST(request, { params: { id: 'supplier1' } })

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
  })

  it('should handle detection failure gracefully', async () => {
    mockCheckAccess.mockResolvedValue({
      hasAccess: true,
      user: { id: 'admin1', role: 'ADMIN' },
      userRole: 'ADMIN'
    })

    mockDetectAndUpdateSupplierCategories.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/suppliers/supplier1/detect-categories', {
      method: 'POST'
    })

    const response = await POST(request, { params: { id: 'supplier1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: false,
      message: 'No categories could be detected for this supplier'
    })
  })

  it('should handle detection errors', async () => {
    mockCheckAccess.mockResolvedValue({
      hasAccess: true,
      user: { id: 'admin1', role: 'ADMIN' },
      userRole: 'ADMIN'
    })

    mockDetectAndUpdateSupplierCategories.mockRejectedValue(new Error('Detection failed'))

    const request = new NextRequest('http://localhost:3000/api/suppliers/supplier1/detect-categories', {
      method: 'POST'
    })

    const response = await POST(request, { params: { id: 'supplier1' } })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ 
      error: 'Failed to detect categories' 
    })
  })

  it('should return 403 for employee user (insufficient permissions)', async () => {
    mockCheckAccess.mockResolvedValue({
      hasAccess: false,
      error: 'Insufficient permissions',
      status: 403
    })

    const request = new NextRequest('http://localhost:3000/api/suppliers/supplier1/detect-categories', {
      method: 'POST'
    })

    const response = await POST(request, { params: { id: 'supplier1' } })

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Insufficient permissions' })
  })
})