import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('NEXTAUTH_SECRET is required in production')
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
