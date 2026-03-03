import { BaseEntity } from './base.entity';

export class Module extends BaseEntity {
  name: string;
  description: string;
  isCore: boolean;

  constructor(props: {
    id: string;
    name: string;
    description: string;
    isCore?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
  }) {
    super(props);
    this.name = props.name;
    this.description = props.description;
    this.isCore = props.isCore ?? false;
  }
}
