// Jest setup for Node.js environment (API tests)
// Mock global functions that might be referenced in utility code

// Mock IntersectionObserver for Node.js environment
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  disconnect: jest.fn(),
  observe: jest.fn(),
  unobserve: jest.fn(),
}))

// Mock ResizeObserver for Node.js environment
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  disconnect: jest.fn(),
  observe: jest.fn(),
  unobserve: jest.fn(),
}))