import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from './db'

// Fallback secret for development - in production, always set NEXTAUTH_SECRET
const fallbackSecret = process.env.NODE_ENV === 'development' 
  ? 'dev-secret-key-change-in-production' 
  : undefined

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || fallbackSecret,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const user = await db.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            return null
          }

          // Check if user is active
          if (user.status !== 'ACTIVE') {
            console.log('User account is not active:', credentials.email)
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log('Password validation failed for:', credentials.email)
            return null
          }
          
          console.log('Authentication successful for:', credentials.email)

          // Update lastSignIn time
          await db.user.update({
            where: { id: user.id },
            data: { lastSignIn: new Date() }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
            lastSignIn: new Date(),
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id  // Store the actual user ID
          token.role = user.role
          token.department = user.department
          token.lastSignIn = user.lastSignIn?.toISOString() || null
        }
        return token
      } catch (error) {
        console.error('JWT callback error:', error)
        return token
      }
    },
    async session({ session, token }) {
      try {
        // Guard against undefined session/user to avoid runtime errors that cause HTML responses
        if (token && session && session.user) {
          session.user = {
            ...session.user,
            id: (token.id as string) ?? session.user?.id,
            role: (token.role as string) ?? (session.user as { role?: string })?.role,
            department: (token.department as string | null | undefined) ?? session.user?.department,
            lastSignIn: (token.lastSignIn as string | null | undefined) ?? session.user?.lastSignIn,
          } as typeof session.user
        }
        return session
      } catch (error) {
        console.error('Session callback error:', error)
        return session
      }
    },
    async redirect({ url, baseUrl }) {
      try {
        // If the URL is already a role-specific dashboard, use it
        if (url.includes('/dashboard/admin') || url.includes('/dashboard/manager') || url.includes('/dashboard/employee')) {
          return url
        }

        // For any other redirect, go to the base URL (which will handle role-based redirect)
        return baseUrl
      } catch (error) {
        console.error('Redirect callback error:', error)
        return baseUrl
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  // Disable default redirects to prevent intermediate page flashes
  redirectProxyUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000'
}
