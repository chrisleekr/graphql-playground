import { prisma } from '@repo/database';
import { checkRateLimit, RATE_LIMITS } from '@repo/shared';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

/**
 * Token Expiry Configuration
 *
 * Security Strategy:
 * - Access tokens (for API): Short-lived (1 hour) for security
 * - Session (NextAuth): Longer-lived (7 days) to reduce re-login friction
 *
 * The JWT callback automatically refreshes expired access tokens as long as
 * the session is still valid, providing seamless UX with strong security.
 *
 * Reference: https://next-auth.js.org/configuration/options#session
 */
const ACCESS_TOKEN_EXPIRY_SECONDS = 3600; // 1 hour
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getJwtSecret(): string {
  // Use NEXTAUTH_SECRET for JWT secret
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET environment variable must be set');
  }
  return secret;
}

function generateAccessToken(userId: string): {
  token: string;
  issuedAt: number;
  expiry: number;
} {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiry = issuedAt + ACCESS_TOKEN_EXPIRY_SECONDS;

  const token = jwt.sign({ sub: userId, iat: issuedAt, exp: expiry }, getJwtSecret());

  return { token, issuedAt, expiry };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Security: Rate limit login attempts per email to prevent brute-force attacks
        // Reference: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#protect-against-automated-attacks
        const rateLimit = await checkRateLimit(credentials.email.toLowerCase(), RATE_LIMITS.LOGIN);
        if (!rateLimit.success) {
          throw new Error('Too many login attempts. Please try again later.');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValidPassword) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          sub: user.id,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id;

        // Generate access token on login
        const { token: accessToken, issuedAt, expiry } = generateAccessToken(user.id);
        token.accessToken = accessToken;
        token.accessTokenIssuedAt = issuedAt;
        token.accessTokenExpiry = expiry;
      }

      // Refresh access token if expired
      if (token.accessTokenExpiry && Date.now() / 1000 > token.accessTokenExpiry) {
        const { token: accessToken, issuedAt, expiry } = generateAccessToken(token.id as string);
        token.accessToken = accessToken;
        token.accessTokenIssuedAt = issuedAt;
        token.accessTokenExpiry = expiry;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.sub = token.sub as string;
      }
      session.accessToken = token.accessToken as string;
      session.accessTokenIssuedAt = token.accessTokenIssuedAt as number;
      session.accessTokenExpiry = token.accessTokenExpiry as number;
      session.serverTimestamp = Math.floor(Date.now() / 1000);

      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
