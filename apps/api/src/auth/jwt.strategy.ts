import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

interface JwtPayload {
  sub: string;
}

function getJwtSecret(): string {
  // Use JWT_SECRET for JWT secret (must match apps/web)
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable must be set');
  }
  return secret;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    @InjectPinoLogger(JwtStrategy.name)
    private readonly logger: PinoLogger,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: JwtPayload) {
    this.logger.debug({ fn: 'validate', userId: payload.sub }, 'Validating JWT payload');

    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      this.logger.warn(
        { fn: 'validate', userId: payload.sub },
        'JWT validation failed: user not found',
      );
      throw new UnauthorizedException();
    }

    this.logger.debug({ fn: 'validate', userId: user.id }, 'JWT validation successful');

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      sub: user.id,
    };
  }
}
