import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      department?: string | null
      lastSignIn?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
    department?: string | null
    lastSignIn?: Date | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    department?: string | null
    lastSignIn?: string | null
  }
}
