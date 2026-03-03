const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class TenantId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || !UUID_REGEX.test(value)) {
      throw new Error(`Invalid TenantId: ${value}`);
    }
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TenantId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
