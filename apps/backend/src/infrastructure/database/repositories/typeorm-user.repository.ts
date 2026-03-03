import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository, QueryOptions } from '@domain/repositories';
import { User } from '@domain/entities';
import { UserOrmEntity } from '../entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async findById(id: string, tenantId: string): Promise<User | null> {
    const entity = await this.repo.findOne({
      where: { id, tenantId },
      relations: ['userRoles'],
    });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findAll(tenantId: string, options?: QueryOptions): Promise<User[]> {
    const qb = this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .where('user.tenantId = :tenantId', { tenantId });

    if (!options?.includeDeleted) {
      qb.andWhere('user.deletedAt IS NULL');
    }

    if (options?.limit) {
      qb.take(options.limit);
    }
    if (options?.page && options?.limit) {
      qb.skip((options.page - 1) * options.limit);
    }

    const entities = await qb.getMany();
    return entities.map(UserMapper.toDomain);
  }

  async save(user: User): Promise<User> {
    const orm = UserMapper.toOrm(user);
    const saved = await this.repo.save(orm);
    return UserMapper.toDomain(saved as UserOrmEntity);
  }

  async softDelete(id: string, tenantId: string, deletedBy: string): Promise<void> {
    await this.repo.update({ id, tenantId }, { updatedBy: deletedBy });
    await this.repo.softDelete({ id, tenantId });
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    const entity = await this.repo.findOne({
      where: { email, tenantId },
      relations: ['userRoles'],
    });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByEmailOnly(email: string): Promise<User | null> {
    const entity = await this.repo.findOne({
      where: { email },
      relations: ['userRoles'],
    });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findWithRoles(userId: string, tenantId: string): Promise<User | null> {
    const qb = this.repo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .where('user.id = :userId', { userId });

    if (tenantId) {
      qb.andWhere('user.tenantId = :tenantId', { tenantId });
    }

    const entity = await qb.getOne();
    return entity ? UserMapper.toDomain(entity) : null;
  }
}
