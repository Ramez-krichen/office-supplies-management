import { prismaMock } from '@/__mocks__/prisma'
import {
  detectSupplierCategories,
  detectAndUpdateSupplierCategories,
  parseSupplierCategories,
  parseSupplierCategoriesEnhanced,
  updateSupplierCategories,
  updateSupplierCategoriesEnhanced
} from '@/lib/supplier-category-detection'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  db: prismaMock
}))

describe('Supplier Category Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('detectSupplierCategories', () => {
    it('should detect categories based on supplier items', async () => {
      const mockItems = [
        {
          id: 'item1',
          name: 'Office Chair',
          category: { name: 'Furniture' }
        },
        {
          id: 'item2',
          name: 'Desk Lamp',
          category: { name: 'Furniture' }
        },
        {
          id: 'item3',
          name: 'Paper Clips',
          category: { name: 'Office Supplies' }
        }
      ]

      prismaMock.item.findMany.mockResolvedValue(mockItems as any)

      const result = await detectSupplierCategories('supplier1')

      expect(result).toBeDefined()
      expect(result?.categories).toEqual(['Furniture', 'Office Supplies'])
      expect(result?.itemCount).toBe(3)
      expect(result?.categoryCount).toBe(2)
      expect(result?.detectionMethods).toContain('basic_item_analysis')
    })

    it('should return null when supplier has no items', async () => {
      prismaMock.item.findMany.mockResolvedValue([])

      const result = await detectSupplierCategories('supplier1')

      expect(result).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      prismaMock.item.findMany.mockRejectedValue(new Error('Database error'))

      const result = await detectSupplierCategories('supplier1')

      expect(result).toBeNull()
    })
  })

  describe('detectAndUpdateSupplierCategories', () => {
    it('should detect categories and update supplier', async () => {
      const mockItems = [
        {
          id: 'item1',
          name: 'Office Chair',
          category: { name: 'Furniture' }
        }
      ]

      prismaMock.item.findMany.mockResolvedValue(mockItems as any)
      prismaMock.supplier.update.mockResolvedValue({
        id: 'supplier1',
        categories: JSON.stringify(['Furniture'])
      } as any)

      const result = await detectAndUpdateSupplierCategories('supplier1')

      expect(result).toBeDefined()
      expect(result?.categories).toEqual(['Furniture'])
      expect(prismaMock.supplier.update).toHaveBeenCalledWith({
        where: { id: 'supplier1' },
        data: {
          categories: expect.stringContaining('Furniture'),
          categoriesDetectedAt: expect.any(Date)
        }
      })
    })

    it('should return null when no categories detected', async () => {
      prismaMock.item.findMany.mockResolvedValue([])

      const result = await detectAndUpdateSupplierCategories('supplier1')

      expect(result).toBeNull()
      expect(prismaMock.supplier.update).not.toHaveBeenCalled()
    })
  })

  describe('parseSupplierCategories', () => {
    it('should parse array format categories', () => {
      const categoriesJson = JSON.stringify(['Office Supplies', 'Furniture'])
      
      const result = parseSupplierCategories(categoriesJson)
      
      expect(result).toEqual(['Office Supplies', 'Furniture'])
    })

    it('should parse object format categories', () => {
      const categoriesJson = JSON.stringify({
        categories: ['Office Supplies', 'Furniture'],
        confidence: 0.8
      })
      
      const result = parseSupplierCategories(categoriesJson)
      
      expect(result).toEqual(['Office Supplies', 'Furniture'])
    })

    it('should return empty array for null input', () => {
      const result = parseSupplierCategories(null)
      
      expect(result).toEqual([])
    })

    it('should return empty array for invalid JSON', () => {
      const result = parseSupplierCategories('invalid json')
      
      expect(result).toEqual([])
    })
  })

  describe('parseSupplierCategoriesEnhanced', () => {
    it('should parse enhanced categories with metadata', () => {
      const categoriesJson = JSON.stringify({
        categories: ['Office Supplies', 'Furniture'],
        confidence: 0.85,
        detectionMethods: ['item_analysis'],
        suggestions: [
          {
            category: 'Office Supplies',
            confidence: 0.9,
            method: 'item_analysis',
            reasoning: 'Based on supplied items'
          }
        ],
        detectedAt: '2024-01-01T00:00:00.000Z'
      })
      
      const result = parseSupplierCategoriesEnhanced(categoriesJson)
      
      expect(result.categories).toEqual(['Office Supplies', 'Furniture'])
      expect(result.confidence).toBe(0.85)
      expect(result.detectionMethods).toEqual(['item_analysis'])
      expect(result.suggestions).toHaveLength(1)
      expect(result.detectedAt).toBe('2024-01-01T00:00:00.000Z')
    })

    it('should handle legacy array format', () => {
      const categoriesJson = JSON.stringify(['Office Supplies'])
      
      const result = parseSupplierCategoriesEnhanced(categoriesJson)
      
      expect(result.categories).toEqual(['Office Supplies'])
      expect(result.confidence).toBeUndefined()
    })

    it('should return empty categories for null input', () => {
      const result = parseSupplierCategoriesEnhanced(null)
      
      expect(result.categories).toEqual([])
    })
  })

  describe('updateSupplierCategories', () => {
    it('should update supplier categories successfully', async () => {
      prismaMock.supplier.update.mockResolvedValue({
        id: 'supplier1',
        categories: JSON.stringify(['Office Supplies'])
      } as any)

      const result = await updateSupplierCategories('supplier1', ['Office Supplies'])

      expect(result).toBe(true)
      expect(prismaMock.supplier.update).toHaveBeenCalledWith({
        where: { id: 'supplier1' },
        data: {
          categories: JSON.stringify(['Office Supplies']),
          categoriesDetectedAt: expect.any(Date)
        }
      })
    })

    it('should return false on database error', async () => {
      prismaMock.supplier.update.mockRejectedValue(new Error('Database error'))

      const result = await updateSupplierCategories('supplier1', ['Office Supplies'])

      expect(result).toBe(false)
    })
  })

  describe('updateSupplierCategoriesEnhanced', () => {
    it('should update supplier with enhanced category data', async () => {
      const detection = {
        supplierId: 'supplier1',
        categories: ['Office Supplies'],
        confidence: 0.9,
        detectionMethods: ['item_analysis'],
        suggestions: [
          {
            category: 'Office Supplies',
            confidence: 0.9,
            method: 'item_analysis',
            reasoning: 'Based on items'
          }
        ],
        detectedAt: new Date('2024-01-01'),
        itemCount: 5,
        categoryCount: 1
      }

      prismaMock.supplier.update.mockResolvedValue({
        id: 'supplier1'
      } as any)

      const result = await updateSupplierCategoriesEnhanced('supplier1', detection)

      expect(result).toBe(true)
      expect(prismaMock.supplier.update).toHaveBeenCalledWith({
        where: { id: 'supplier1' },
        data: {
          categories: expect.stringContaining('Office Supplies'),
          categoriesDetectedAt: detection.detectedAt
        }
      })
    })

    it('should return false on database error', async () => {
      const detection = {
        supplierId: 'supplier1',
        categories: ['Office Supplies'],
        confidence: 0.9,
        detectionMethods: ['item_analysis'],
        suggestions: [],
        detectedAt: new Date(),
        itemCount: 1,
        categoryCount: 1
      }

      prismaMock.supplier.update.mockRejectedValue(new Error('Database error'))

      const result = await updateSupplierCategoriesEnhanced('supplier1', detection)

      expect(result).toBe(false)
    })
  })
})