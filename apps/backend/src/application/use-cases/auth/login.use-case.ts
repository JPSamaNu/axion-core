import { randomUUID } from 'crypto';
import { IUserRepository } from '@domain/repositories';
import { IRefreshTokenRepository } from '@domain/repositories';
import { IPasswordHasher, ITokenGenerator } from '@domain/services';
import { IEventDispatcher } from '@domain/events';
import { InvalidCredentialsError } from '@domain/errors';
import { RefreshToken } from '@domain/entities';
import { UserCreatedEvent } from '@domain/events';
import { LoginDto, AuthTokensDto } from '../../dto';
import { UserResponseDto } from '../../dto';

export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenRepo: IRefreshTokenRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  async execute(dto: LoginDto, tenantId?: string): Promise<AuthTokensDto> {
    let user;
    if (tenantId) {
      user = await this.userRepo.findByEmail(dto.email, tenantId);
    } else {
      user = await this.userRepo.findByEmailOnly(dto.email);
    }
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValid = await this.hasher.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    const roleNames = user.roles.map((r) => r.roleId);

    const accessToken = this.tokenGenerator.generateAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      roles: roleNames,
    });

    const refreshTokenRaw = this.tokenGenerator.generateRefreshToken();
    const refreshTokenHash = refreshTokenRaw; // UUID is already cryptographically random
    const familyId = randomUUID();

    const refreshToken = new RefreshToken({
      id: randomUUID(),
      userId: user.id,
      tokenHash: refreshTokenHash,
      familyId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await this.tokenRepo.save(refreshToken);

    const userResponse = new UserResponseDto(user);

    return new AuthTokensDto({
      accessToken,
      refreshToken: refreshTokenRaw,
      user: userResponse,
    });
  }
}
