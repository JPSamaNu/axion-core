import { Action, PermissionScope } from '@axion/types';

export class Permission {
  id: string;
  resource: string;
  action: Action;
  scope: PermissionScope;
  moduleId: string | null;
  description: string;

  constructor(props: {
    id: string;
    resource: string;
    action: Action;
    scope: PermissionScope;
    moduleId?: string | null;
    description: string;
  }) {
    this.id = props.id;
    this.resource = props.resource;
    this.action = props.action;
    this.scope = props.scope;
    this.moduleId = props.moduleId ?? null;
    this.description = props.description;
  }
}
