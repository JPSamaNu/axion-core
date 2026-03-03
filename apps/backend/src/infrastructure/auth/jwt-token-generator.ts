import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenGenerator, TokenPayload } from '@domain/services';
import { randomUUID } from 'crypto';

@Injectable()
export class JwtTokenGenerator implements ITokenGenerator {
  constructor(private readonly jwtService: JwtService) {}

  generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign({
      sub: payload.userId,
      tenantId: payload.tenantId,
      roles: payload.roles,
    });
  }

  generateRefreshToken(): string {
    return randomUUID();
  }

  verifyAccessToken(token: string): TokenPayload {
    const decoded = this.jwtService.verify(token);
    return {
      userId: decoded.sub,
      tenantId: decoded.tenantId,
      roles: decoded.roles,
    };
  }
}
