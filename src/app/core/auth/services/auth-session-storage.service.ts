import { AuthSession } from '../models/auth.models';

export abstract class AuthSessionStorage {
  abstract read(): AuthSession | null;
  abstract write(session: AuthSession): void;
  abstract clear(): void;
}
