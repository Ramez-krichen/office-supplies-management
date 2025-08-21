import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  // Use fallback database URL that matches the expected location
  const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/comprehensive.db'
  
  console.log('Database URL:', databaseUrl)
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  })
}

// Create a singleton instance of the Prisma client
export const db = globalForPrisma.prisma ?? prismaClientSingleton()

// In development, save the client to avoid multiple instances during hot reloading
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Graceful shutdown
process.on('beforeExit', async () => {
  try {
    await db.$disconnect()
  } catch (error) {
    console.error('Error during database disconnect:', error)
  }
})

// Handle potential connection errors with better error handling
db.$connect()
  .then(() => {
    console.log('✅ Database connection established successfully')
  })
  .catch((e) => {
    console.error('❌ Failed to connect to the database:', e)
    // Format the error for better debugging
    if (e instanceof Error) {
      console.error(`Error name: ${e.name}, Message: ${e.message}`)
      if (e.stack) {
        console.error('Stack trace:', e.stack)
      }
    }
    
    // In production, we might want to exit the process or implement retry logic
    if (process.env.NODE_ENV === 'production') {
      console.error('Database connection failure in production environment')
      // process.exit(1) // Uncomment to exit on connection failure in production
    }
  })

// Add a connection status check function
export const checkDbConnection = async () => {
  try {
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
    return await operation()
  } catch (error) {
    console.error('Database operation failed:', error)
    return fallback || null
  }
}