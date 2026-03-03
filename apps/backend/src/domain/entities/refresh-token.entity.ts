export class RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;

  constructor(props: {
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    isRevoked?: boolean;
    expiresAt: Date;
    createdAt?: Date;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.tokenHash = props.tokenHash;
    this.familyId = props.familyId;
    this.isRevoked = props.isRevoked ?? false;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt ?? new Date();
  }

  revoke(): void {
    this.isRevoked = true;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isRevoked && !this.isExpired();
  }
}
