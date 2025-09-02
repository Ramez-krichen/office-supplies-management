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
          console.log('Auth attempt for email:', credentials?.email)
          
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials')
            return null
          }

          // Check database connection first
          try {
            await db.$queryRaw`SELECT 1`;
            console.log('Database connection successful');
          } catch (dbError) {
            console.error('Database connection error:', dbError);
            // Return null instead of throwing an error to allow for graceful failure
            return null;
          }

          // Find user
          console.log('Looking up user:', credentials.email)
          const user = await db.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            console.log('User not found:', credentials.email)
            return null
          }

          console.log('User found:', user.email, 'Status:', user.status, 'Role:', user.role)

          // Check if user is active
          if (user.status !== 'ACTIVE') {
            console.log('User account is not active:', credentials.email)
            return null
          }

          // Debug password info (don't log actual passwords)
          console.log('Comparing password for:', credentials.email, 
                     'Password length:', credentials.password.length,
                     'Stored hash length:', user.password.length)

          // Verify password
          try {
            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              user.password
            )

            if (!isPasswordValid) {
              console.log('Password validation failed for:', credentials.email)
              return null
            }
            
            console.log('Password validation successful for:', credentials.email)
          } catch (bcryptError) {
            console.error('bcrypt error:', bcryptError)
            throw new Error('Password verification failed')
          }
          
          console.log('Authentication successful for:', credentials.email)

          // Update lastSignIn time
          try {
            await db.user.update({
              where: { id: user.id },
              data: { lastSignIn: new Date() }
            })
            console.log('Updated last sign-in time for:', credentials.email)
          } catch (updateError) {
            console.error('Failed to update last sign-in time:', updateError)
            // Continue anyway - this shouldn't block login
          }

          // Return user data
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
          // Rethrow with more details to help debugging
          throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
          // Validate that the user still exists in the database
          if (token.id) {
            try {
              const userExists = await db.user.findUnique({
                where: { id: token.id as string },
                select: { id: true, status: true, role: true, department: true }
              })
              
              if (!userExists || userExists.status !== 'ACTIVE') {
                console.log('User no longer exists or is inactive, invalidating session:', token.id)
                // Instead of returning null, clear the user data to trigger re-auth
                session.user.id = ''
                session.user.role = ''
                return session
              }
              
              // Update session with fresh data from database
              session.user = {
                ...session.user,
                id: userExists.id,
                role: userExists.role,
                department: userExists.department,
                lastSignIn: (token.lastSignIn as string | null | undefined) ?? session.user?.lastSignIn,
              } as typeof session.user
            } catch (dbError) {
              console.error('Database error during session validation:', dbError)
              // If we can't validate the user, clear the user ID to trigger re-auth
              session.user.id = ''
              session.user.role = ''
              return session
            }
          } else {
            // No user ID in token, clear session data
            console.log('No user ID in token, clearing session data')
            session.user.id = ''
            session.user.role = ''
          }
        }
        return session
      } catch (error) {
        console.error('Session callback error:', error)
        // On critical errors, clear user data instead of returning null
        if (session && session.user) {
          session.user.id = ''
          session.user.role = ''
        }
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
  }
}