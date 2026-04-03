import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    role?: 'USER' | 'ADMIN'
  }
  interface Session {
    /** DB と JWT がずれたときなど、未ログインと同等にするため undefined になり得る */
    user?: ({ id: string; role: 'USER' | 'ADMIN' } & DefaultSession['user']) | undefined
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: 'USER' | 'ADMIN'
  }
}
