import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      sub: string;
    } & DefaultSession['user'];
    accessToken: string;
    accessTokenIssuedAt: number;
    accessTokenExpiry: number;
    serverTimestamp: number;
    expires: string;
  }

  interface User {
    id: string;
    email: string;
    sub?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    sub: string;
    accessToken?: string;
    accessTokenIssuedAt?: number;
    accessTokenExpiry?: number;
  }
}
