import type { AuthSession, AuthUser } from '../models/auth.models';

export function parseAuthSession(serializedSession: string): AuthSession | null {
  try {
    const value: unknown = JSON.parse(serializedSession);

    if (!isRecord(value)) {
      return null;
    }

    const user = parseAuthUser(value['user']);
    const accessToken = value['accessToken'];
    const refreshToken = value['refreshToken'];

    if (
      !user ||
      typeof accessToken !== 'string' ||
      !accessToken ||
      typeof refreshToken !== 'string' ||
      !refreshToken
    ) {
      return null;
    }

    return { user, accessToken, refreshToken };
  } catch {
    return null;
  }
}

function parseAuthUser(value: unknown): AuthUser | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = value['id'];
  const username = value['username'];
  const email = value['email'];
  const firstName = value['firstName'];
  const lastName = value['lastName'];
  const gender = value['gender'];
  const image = value['image'];

  if (
    typeof id !== 'number' ||
    typeof username !== 'string' ||
    typeof email !== 'string' ||
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    typeof gender !== 'string' ||
    typeof image !== 'string'
  ) {
    return null;
  }

  return { id, username, email, firstName, lastName, gender, image };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
