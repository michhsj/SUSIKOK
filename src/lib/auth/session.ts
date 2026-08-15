import crypto from "node:crypto";

export const SESSION_COOKIE_NAME = "susikok_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7일

function getAuthSecret() {
  return (
    process.env.AUTH_SECRET ||
    "susikok-dev-secret-change-this-before-production"
  );
}

function sign(value: string) {
  return crypto
    .createHmac("sha256", getAuthSecret())
    .update(value)
    .digest("hex");
}

export function createSessionToken(userId: string) {
  const issuedAt = Date.now().toString();
  const payload = `${userId}.${issuedAt}`;
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null) {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, issuedAt, signature] = parts;
  const payload = `${userId}.${issuedAt}`;
  const expected = sign(payload);

  if (signature !== expected) {
    return null;
  }

  const issuedAtNumber = Number(issuedAt);
  if (!Number.isFinite(issuedAtNumber)) {
    return null;
  }

  const expiresAt = issuedAtNumber + SESSION_MAX_AGE * 1000;
  if (Date.now() > expiresAt) {
    return null;
  }

  return { userId, issuedAt: issuedAtNumber };
}
