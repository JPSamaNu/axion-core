import { RefreshToken } from '../entities';

export interface IRefreshTokenRepository {
  save(token: RefreshToken): Promise<RefreshToken>;
  findByToken(tokenHash: string): Promise<RefreshToken | null>;
  revokeByUserId(userId: string): Promise<void>;
  revokeFamily(familyId: string): Promise<void>;
}
