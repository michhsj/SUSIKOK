import "server-only";
import crypto from "node:crypto";

const PHONE_OTP_SECRET =
  process.env.PHONE_OTP_SECRET?.trim() || "dev-phone-otp-secret-change-me";

const PHONE_VERIFICATION_TICKET_SECRET =
  process.env.PHONE_VERIFICATION_TICKET_SECRET?.trim() ||
  "dev-phone-ticket-secret-change-me";

function digitsOnly(value: string): string {
  return value.replace(/\D+/g, "");
}

/**
 * 전화번호를 숫자-only 국제번호(82...) 형식으로 정규화
 * 예:
 * 010-1234-5678 -> 821012345678
 * +82 10 1234 5678 -> 821012345678
 */
export function normalizePhoneNumber(input: string): string {
  const digits = digitsOnly(String(input ?? ""));

  if (!digits) return "";

  if (digits.startsWith("82")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `82${digits.slice(1)}`;
  }

  return digits;
}

/**
 * 한국 휴대폰 번호 검사
 * normalizePhoneNumber() 결과 기준
 */
export function isValidKoreanMobilePhone(normalizedPhoneNumber: string): boolean {
  return /^82(10|11|16|17|18|19)\d{7,8}$/.test(
    String(normalizedPhoneNumber ?? "")
  );
}

/**
 * 6자리 인증번호 생성
 */
export function generateSixDigitCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * OTP 코드 해시
 */
export function hashOtpCode(input: {
  normalizedPhoneNumber: string;
  code: string;
}): string {
  const normalizedPhoneNumber = normalizePhoneNumber(
    input.normalizedPhoneNumber
  );
  const code = String(input.code ?? "").trim();

  return crypto
    .createHmac("sha256", PHONE_OTP_SECRET)
    .update(`${normalizedPhoneNumber}:${code}`)
    .digest("hex");
}

/**
 * 회원가입 완료 전 임시 verification ticket 생성
 */
export function generateVerificationTicket(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * verification ticket 해시
 */
export function hashVerificationTicket(ticket: string): string {
  return crypto
    .createHmac("sha256", PHONE_VERIFICATION_TICKET_SECRET)
    .update(String(ticket ?? "").trim())
    .digest("hex");
}

/**
 * Date + minutes
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * timing-safe 문자열 비교
 */
export function safeEqualText(a: string, b: string): boolean {
  const aBuffer = Buffer.from(String(a ?? ""));
  const bBuffer = Buffer.from(String(b ?? ""));

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}
