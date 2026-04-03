import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { MANAGER_INTERNAL_EMAIL, resolveManagerLoginId } from '@/lib/roles'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'ログインID', type: 'text' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const rawLogin = String(credentials.email).trim()
        const email = resolveManagerLoginId(rawLogin)
          ? MANAGER_INTERNAL_EMAIL
          : String(credentials.email).toLowerCase().trim()
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return null
        const ok = await bcrypt.compare(String(credentials.password), user.passwordHash)
        if (!ok) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role ?? 'USER'
        return token
      }
      const uid = token.id as string | undefined
      if (uid) {
        const row = await prisma.user.findUnique({
          where: { id: uid },
          select: { id: true, role: true },
        })
        if (!row) {
          delete token.id
          delete token.role
          delete token.email
          delete token.name
          delete token.picture
          if (token.sub === uid) {
            delete (token as { sub?: string }).sub
          }
        } else {
          token.role = row.role
        }
      }
      return token
    },
    session({ session, token }) {
      if (!token.id) {
        return { expires: session.expires }
      }
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.role = (token.role as 'USER' | 'ADMIN' | undefined) ?? 'USER'
      }
      return session
    },
  },
})
