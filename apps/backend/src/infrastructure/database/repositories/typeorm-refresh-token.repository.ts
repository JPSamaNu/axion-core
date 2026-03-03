import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRefreshTokenRepository } from '@domain/repositories';
import { RefreshToken } from '@domain/entities';
import { RefreshTokenOrmEntity } from '../entities/refresh-token.entity';

@Injectable()
export class TypeOrmRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenOrmEntity)
    private readonly repo: Repository<RefreshTokenOrmEntity>,
  ) {}

  async save(token: RefreshToken): Promise<RefreshToken> {
    const saved = await this.repo.save({
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      familyId: token.familyId,
      isRevoked: token.isRevoked,
      expiresAt: token.expiresAt,
    });
    return this.toDomain(saved as RefreshTokenOrmEntity);
  }

  async findByToken(tokenHash: string): Promise<RefreshToken | null> {
    const entity = await this.repo.findOne({ where: { tokenHash } });
    return entity ? this.toDomain(entity) : null;
  }

  async revokeByUserId(userId: string): Promise<void> {
    await this.repo.update({ userId, isRevoked: false }, { isRevoked: true });
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.repo.update({ familyId }, { isRevoked: true });
  }

  private toDomain(orm: RefreshTokenOrmEntity): RefreshToken {
    return new RefreshToken({
      id: orm.id,
      userId: orm.userId,
      tokenHash: orm.tokenHash,
      familyId: orm.familyId,
      isRevoked: orm.isRevoked,
      expiresAt: orm.expiresAt,
      createdAt: orm.createdAt,
    });
  }
}
