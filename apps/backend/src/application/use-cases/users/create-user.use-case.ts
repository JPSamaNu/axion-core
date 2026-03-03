import { randomUUID } from 'crypto';
import { IUserRepository } from '@domain/repositories';
import { IPasswordHasher } from '@domain/services';
import { IEventDispatcher, UserCreatedEvent } from '@domain/events';
import { User } from '@domain/entities';
import { CreateUserDto, UserResponseDto } from '../../dto';
import { TenantContext } from '../../types';

export class CreateUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  async execute(dto: CreateUserDto, context: TenantContext): Promise<UserResponseDto> {
    const passwordHash = await this.hasher.hash(dto.password);

    const user = new User({
      id: randomUUID(),
      tenantId: context.tenantId,
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      createdBy: context.userId,
      updatedBy: context.userId,
    });

    const saved = await this.userRepo.save(user);

    await this.eventDispatcher.dispatch(
      new UserCreatedEvent(saved.id, {
        userId: saved.id,
        tenantId: saved.tenantId,
        email: saved.email,
      }),
    );

    return new UserResponseDto(saved);
  }
}
