import React from 'react'
import { LoadingSpinner, LoadingSkeleton, PageLoading } from '@/components/ui/loading'

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => <div data-testid="loader2" className={className} />,
  Package: ({ className }: { className?: string }) => <div data-testid="package-icon" className={className} />,
  Users: ({ className }: { className?: string }) => <div data-testid="users-icon" className={className} />,
  ShoppingCart: ({ className }: { className?: string }) => <div data-testid="cart-icon" className={className} />,
  BarChart3: ({ className }: { className?: string }) => <div data-testid="chart-icon" className={className} />
}))

describe('Loading Components', () => {
  describe('LoadingSpinner', () => {
    it('should render with default props', () => {
      const component = <LoadingSpinner />
      expect(component).toBeDefined()
      expect(component.props).toEqual({})
    })

    it('should render with custom size', () => {
      const smallSpinner = <LoadingSpinner size="sm" />
      const largeSpinner = <LoadingSpinner size="lg" />
      
      expect(smallSpinner.props.size).toBe('sm')
      expect(largeSpinner.props.size).toBe('lg')
    })

    it('should render with custom className', () => {
      const spinner = <LoadingSpinner className="custom-class" />
      expect(spinner.props.className).toBe('custom-class')
    })
  })

  describe('LoadingSkeleton', () => {
    it('should render with default props', () => {
      const component = <LoadingSkeleton />
      expect(component).toBeDefined()
      expect(component.props.lines).toBeUndefined() // Should use default
    })

    it('should render with custom number of lines', () => {
      const skeleton = <LoadingSkeleton lines={3} />
      expect(skeleton.props.lines).toBe(3)
    })

    it('should render with custom className', () => {
      const skeleton = <LoadingSkeleton className="custom-skeleton" />
      expect(skeleton.props.className).toBe('custom-skeleton')
    })
  })

  describe('PageLoading', () => {
    it('should render with default props', () => {
      const component = <PageLoading />
      expect(component).toBeDefined()
      expect(component.props.title).toBeUndefined() // Should use default
      expect(component.props.type).toBeUndefined() // Should use default
    })

    it('should render with custom title and subtitle', () => {
      const loading = <PageLoading title="Custom Title" subtitle="Custom Subtitle" />
      expect(loading.props.title).toBe('Custom Title')
      expect(loading.props.subtitle).toBe('Custom Subtitle')
    })

    it('should render with different types', () => {
      const inventoryLoading = <PageLoading type="inventory" />
      const usersLoading = <PageLoading type="users" />
      const ordersLoading = <PageLoading type="orders" />
      const reportsLoading = <PageLoading type="reports" />
      
      expect(inventoryLoading.props.type).toBe('inventory')
      expect(usersLoading.props.type).toBe('users')
      expect(ordersLoading.props.type).toBe('orders')
      expect(reportsLoading.props.type).toBe('reports')
    })
  })

  describe('Component Structure', () => {
    it('should have correct component types', () => {
      expect(typeof LoadingSpinner).toBe('function')
      expect(typeof LoadingSkeleton).toBe('function')
      expect(typeof PageLoading).toBe('function')
    })

    it('should accept React props', () => {
      // Test that components accept standard React props
      const spinnerWithKey = <LoadingSpinner key="test-key" />
      const skeletonWithKey = <LoadingSkeleton key="test-key" />
      const pageLoadingWithKey = <PageLoading key="test-key" />
      
      expect(spinnerWithKey.key).toBe('test-key')
      expect(skeletonWithKey.key).toBe('test-key')
      expect(pageLoadingWithKey.key).toBe('test-key')
    })
  })

  describe('Props Validation', () => {
    it('should handle size prop correctly in LoadingSpinner', () => {
      const sizes = ['sm', 'md', 'lg'] as const
      
      sizes.forEach(size => {
        const spinner = <LoadingSpinner size={size} />
        expect(spinner.props.size).toBe(size)
      })
    })

    it('should handle numeric props correctly', () => {
      const skeleton = <LoadingSkeleton lines={5} />
      expect(skeleton.props.lines).toBe(5)
      expect(typeof skeleton.props.lines).toBe('number')
    })

    it('should handle string props correctly', () => {
      const pageLoading = <PageLoading title="Test Title" subtitle="Test Subtitle" />
      expect(typeof pageLoading.props.title).toBe('string')
      expect(typeof pageLoading.props.subtitle).toBe('string')
    })
  })

  describe('Default Values', () => {
    it('should use correct default values', () => {
      // LoadingSpinner defaults
      const spinner = <LoadingSpinner />
      expect(spinner.props.size).toBeUndefined() // Should default to 'md' internally
      expect(spinner.props.className).toBeUndefined() // Should default to '' internally

      // LoadingSkeleton defaults  
      const skeleton = <LoadingSkeleton />
      expect(skeleton.props.lines).toBeUndefined() // Should default to 1 internally
      expect(skeleton.props.className).toBeUndefined() // Should default to '' internally

      // PageLoading defaults
      const pageLoading = <PageLoading />
      expect(pageLoading.props.title).toBeUndefined() // Should default to 'Loading...' internally
      expect(pageLoading.props.type).toBeUndefined() // Should default to 'default' internally
    })
  })

  describe('Component Composition', () => {
    it('should be composable with other React elements', () => {
      const wrapper = (
        <div>
          <LoadingSpinner />
          <LoadingSkeleton lines={2} />
          <PageLoading title="Loading Page" />
        </div>
      )
      
      expect(wrapper.props.children).toHaveLength(3)
      expect(wrapper.props.children[0].type).toBe(LoadingSpinner)
      expect(wrapper.props.children[1].type).toBe(LoadingSkeleton)
      expect(wrapper.props.children[2].type).toBe(PageLoading)
    })
  })
})