import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  try {
    // Use standard development database URL
    const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'
    
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      errorFormat: 'pretty',
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    })
  } catch (error) {
    console.error('Failed to create Prisma client:', error)
    throw new Error('Prisma client initialization failed.')
  }
}

// Create a singleton instance with error handling
export const db = globalForPrisma.prisma ?? prismaClientSingleton()

// In development, save the client to avoid multiple instances during hot reloading
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Test the connection
db.$connect()
  .then(() => {
    // Connection established successfully
  })
  .catch((e) => {
    console.error('❌ Failed to connect to the database:', e)
  })

// Graceful shutdown
process.on('beforeExit', async () => {
  try {
    if (db) {
      await db.$disconnect()
    }
  } catch (error) {
    console.error('Error during database disconnect:', error)
  }
})

// Add a connection status check function
export const checkDbConnection = async () => {
  try {
    if (!db) return false
    await db.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}

// Add a safe database operation wrapper
export const safeDbOperation = async <T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | null> => {
  try {
    if (!db) {
      console.warn('Database not available, using fallback')
      return fallback || null
    }
    return await operation()
  } catch (error) {
    console.error('Database operation failed:', error)
    return fallback || null
  }
}