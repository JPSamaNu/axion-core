export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

export interface TokenPayload {
  userId: string;
  tenantId: string;
  roles: string[];
}

export interface ITokenGenerator {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(): string;
  verifyAccessToken(token: string): TokenPayload;
}
