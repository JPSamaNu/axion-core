import { IRefreshTokenRepository } from '@domain/repositories';

export class LogoutUseCase {
  constructor(private readonly tokenRepo: IRefreshTokenRepository) {}

  async execute(userId: string): Promise<void> {
    await this.tokenRepo.revokeByUserId(userId);
  }
}
