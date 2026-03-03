import { Action, PermissionScope } from '@axion/types';

export class PermissionSpec {
  constructor(
    readonly resource: string,
    readonly action: Action,
    readonly scope: PermissionScope,
  ) {}

  matches(required: { resource: string; action: Action }): boolean {
    return this.resource === required.resource && this.action === required.action;
  }

  toString(): string {
    return `${this.resource}:${this.action}:${this.scope}`;
  }
}
