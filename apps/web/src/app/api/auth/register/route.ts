import { prisma } from '@repo/database';
import { checkRateLimit, isValidEmail, isValidPassword, RATE_LIMITS } from '@repo/shared';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger({ module: 'auth/register' });

export async function POST(request: Request) {
  try {
    // Rate limiting by IP
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] ?? 'anonymous';
    const rateLimit = await checkRateLimit(ip, RATE_LIMITS.REGISTER);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          },
        },
      );
    }

    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // Security: Use generic message to prevent user enumeration attacks
    // Reference: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#authentication-and-error-messages
    // In production with email verification, you would send a "check your email" message
    // regardless of whether the account exists
    if (existingUser) {
      log.warn({ email }, 'Registration attempt for existing email');
      // Return same structure as success to prevent timing attacks
      return NextResponse.json({
        message: 'If this email is available, your account has been created. Please try logging in.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    log.info({ userId: user.id }, 'User registered successfully');

    return NextResponse.json({
      message: 'If this email is available, your account has been created. Please try logging in.',
      // Only include user data in development for debugging
      ...(process.env.NODE_ENV !== 'production' && {
        user: { id: user.id, email: user.email, name: user.name },
      }),
    });
  } catch (error) {
    log.error({ err: error }, 'Registration failed');
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
