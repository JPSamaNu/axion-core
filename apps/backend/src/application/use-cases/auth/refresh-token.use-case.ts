import { randomUUID } from 'crypto';
import { IRefreshTokenRepository } from '@domain/repositories';
import { ITokenGenerator } from '@domain/services';
import { IUserRepository } from '@domain/repositories';
import { TokenExpiredError, TokenReuseDetectedError } from '@domain/errors';
import { RefreshToken } from '@domain/entities';
import { RefreshTokenDto, AuthTokensDto } from '../../dto';
import { UserResponseDto } from '../../dto';

export class RefreshTokenUseCase {
  constructor(
    private readonly tokenRepo: IRefreshTokenRepository,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<AuthTokensDto> {
    const existingToken = await this.tokenRepo.findByToken(dto.refreshToken);

    if (!existingToken) {
      throw new TokenExpiredError();
    }

    // Detect reuse: if token is already revoked, revoke entire family
    if (existingToken.isRevoked) {
      await this.tokenRepo.revokeFamily(existingToken.familyId);
      throw new TokenReuseDetectedError();
    }

    if (existingToken.isExpired()) {
      throw new TokenExpiredError();
    }

    // Revoke the current token (rotation)
    existingToken.revoke();
    await this.tokenRepo.save(existingToken);

    // Get user to build new access token
    const user = await this.userRepo.findWithRoles(existingToken.userId, '');
    if (!user) {
      throw new TokenExpiredError();
    }

    const roleNames = user.roles.map((r) => r.roleId);

    const accessToken = this.tokenGenerator.generateAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      roles: roleNames,
    });

    // Generate new refresh token with same familyId
    const newRefreshTokenRaw = this.tokenGenerator.generateRefreshToken();
    const newRefreshToken = new RefreshToken({
      id: randomUUID(),
      userId: user.id,
      tokenHash: newRefreshTokenRaw,
      familyId: existingToken.familyId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await this.tokenRepo.save(newRefreshToken);

    const userResponse = new UserResponseDto(user);

    return new AuthTokensDto({
      accessToken,
      refreshToken: newRefreshTokenRaw,
      user: userResponse,
    });
  }
}
