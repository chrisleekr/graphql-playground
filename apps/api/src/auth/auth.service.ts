import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
  ) {}

  async validateUser(userId: string) {
    // Use trace level - jwt.strategy.ts handles the business-level logging
    this.logger.trace({ fn: 'validateUser', userId }, 'Looking up user in database');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    this.logger.trace(
      { fn: 'validateUser', userId, found: !!user },
      'User lookup completed',
    );

    return user;
  }
}
