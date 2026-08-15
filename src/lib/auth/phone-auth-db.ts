import "server-only";

export type PhoneRequestRateLimitInput = {
  normalizedPhoneNumber: string;
  requestIp: string | null;
  purpose: "signup";
};

export type PhoneRequestRateLimitResult = {
  ok: boolean;
  retryAfterSeconds?: number;
};

export type CreatePhoneVerificationRequestInput = {
  studentAccountId: string | null;
  purpose: "signup";
  phoneNumber: string;
  normalizedPhoneNumber: string;
  verificationCodeHash: string;
  status: "pending";
  sendCount: number;
  verifyAttemptCount: number;
  requestIp: string | null;
  requestUserAgent: string | null;
  requestedAt: Date;
  expiresAt: Date;
  provider: string | null;
  providerMessageId: string | null;
  failureReason: string | null;
};

export type CreatePhoneVerificationRequestResult = {
  id: string;
};

export type PhoneVerificationRequestRecord = {
  id: string;
  studentAccountId: string | null;
  purpose: "signup";
  phoneNumber: string;
  normalizedPhoneNumber: string;
  verificationCodeHash: string;
  verificationTicketHash: string | null;
  verificationTicketExpiresAt: Date | null;
  status: "pending" | "verified" | "expired" | "blocked" | "failed" | "consumed";
  sendCount: number;
  verifyAttemptCount: number;
  requestIp: string | null;
  requestUserAgent: string | null;
  requestedAt: Date;
  expiresAt: Date;
  verifiedAt: Date | null;
  consumedAt: Date | null;
  provider: string | null;
  providerMessageId: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 현재 최소 동작본(stub)
 * - TypeScript import 오류 제거 목적
 * - 실제 DB 저장은 아직 하지 않음
 * - 이후 Supabase 실제 연동본으로 교체 가능
 */

export async function findActiveStudentByNormalizedPhone(
  normalizedPhoneNumber: string
): Promise<null> {
  console.log(
    "[phone-auth-db] findActiveStudentByNormalizedPhone",
    normalizedPhoneNumber
  );

  return null;
}

export async function assertPhoneRequestRateLimit(
  input: PhoneRequestRateLimitInput
): Promise<PhoneRequestRateLimitResult> {
  console.log("[phone-auth-db] assertPhoneRequestRateLimit", input);

  return {
    ok: true,
    retryAfterSeconds: 60,
  };
}

export async function createPhoneVerificationRequest(
  input: CreatePhoneVerificationRequestInput
): Promise<CreatePhoneVerificationRequestResult> {
  console.log("[phone-auth-db] createPhoneVerificationRequest", input);

  return {
    id: `temp-${Date.now()}`,
  };
}

export async function updatePhoneVerificationRequestProviderInfo(input: {
  requestId: string;
  provider: string | null;
  providerMessageId: string | null;
}): Promise<void> {
  console.log(
    "[phone-auth-db] updatePhoneVerificationRequestProviderInfo",
    input
  );
}

export async function markPhoneVerificationRequestFailed(input: {
  requestId: string;
  failureReason: string;
}): Promise<void> {
  console.log("[phone-auth-db] markPhoneVerificationRequestFailed", input);
}

/**
 * verify 단계용 추가 exports
 */

export async function findLatestPendingPhoneVerificationRequest(
  normalizedPhoneNumber: string
): Promise<PhoneVerificationRequestRecord | null> {
  console.log(
    "[phone-auth-db] findLatestPendingPhoneVerificationRequest",
    normalizedPhoneNumber
  );

  return null;
}

export async function markPhoneVerificationRequestExpired(input: {
  requestId: string;
}): Promise<void> {
  console.log("[phone-auth-db] markPhoneVerificationRequestExpired", input);
}

export async function incrementPhoneVerificationVerifyAttempt(input: {
  requestId: string;
  nextVerifyAttemptCount: number;
}): Promise<void> {
  console.log("[phone-auth-db] incrementPhoneVerificationVerifyAttempt", input);
}

export async function markPhoneVerificationRequestBlocked(input: {
  requestId: string;
  failureReason?: string | null;
}): Promise<void> {
  console.log("[phone-auth-db] markPhoneVerificationRequestBlocked", input);
}

export async function markPhoneVerificationRequestVerified(input: {
  requestId: string;
  verificationTicketHash: string;
  verificationTicketExpiresAt: Date;
}): Promise<void> {
  console.log("[phone-auth-db] markPhoneVerificationRequestVerified", input);
}
