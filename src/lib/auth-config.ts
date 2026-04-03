import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

/**
 * Auth.js (NextAuth v5) configuration.
 * - Google OAuth provider
 * - Restricts access to ALLOWED_EMAIL (single-user app)
 * - JWT session strategy (no DB session table needed)
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/sign-in',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    /**
     * Only allow sign-in if the email matches ALLOWED_EMAIL.
     * This is the core security gate for a single-user app.
     */
    async signIn({ user }) {
      const allowedEmail = process.env.ALLOWED_EMAIL;
      if (!allowedEmail) {
        // If ALLOWED_EMAIL isn't set, deny all logins as a safety measure
        console.error('ALLOWED_EMAIL env var not set — denying all sign-ins');
        return false;
      }
      return user.email?.toLowerCase() === allowedEmail.toLowerCase();
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
});
