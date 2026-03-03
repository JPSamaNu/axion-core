export interface QueryOptions {
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

export interface IBaseRepository<T> {
  findById(id: string, tenantId: string): Promise<T | null>;
  findAll(tenantId: string, options?: QueryOptions): Promise<T[]>;
  save(entity: T): Promise<T>;
  softDelete(id: string, tenantId: string, deletedBy: string): Promise<void>;
}
