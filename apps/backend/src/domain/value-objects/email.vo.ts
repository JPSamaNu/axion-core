const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private readonly value: string;

  constructor(value: string) {
    if (!value || !EMAIL_REGEX.test(value)) {
      throw new Error(`Invalid email: ${value}`);
    }
    this.value = value.toLowerCase();
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
