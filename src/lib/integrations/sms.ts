import "server-only";

export type SendSignupVerificationSmsInput = {
  phoneNumber: string;
  code: string;
  ttlMinutes: number;
};

export type SendSignupVerificationSmsResult = {
  provider: string;
  messageId: string;
};

function digitsOnly(value: string): string {
  return value.replace(/\D+/g, "");
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`[sms] Missing required environment variable: ${name}`);
  }

  return value;
}

/**
 * 내부 정규화 번호를 Solapi 전송용 국내 번호 형식으로 변환
 * 예:
 * 821012345678 -> 01012345678
 * 01012345678 -> 01012345678
 */
function toDomesticKoreanPhoneNumber(phoneNumber: string): string {
  const digits = digitsOnly(phoneNumber);

  if (!digits) {
    return "";
  }

  if (digits.startsWith("82") && digits.length >= 11) {
    return `0${digits.slice(2)}`;
  }

  return digits;
}

function maskPhoneNumber(phoneNumber: string): string {
  const digits = digitsOnly(phoneNumber);

  if (digits.length >= 8) {
    return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
  }

  if (digits.length >= 4) {
    return `${digits.slice(0, 2)}**${digits.slice(-2)}`;
  }

  return digits;
}

function buildSmsText(input: SendSignupVerificationSmsInput): string {
  return `[탐구링크] 인증번호는 ${input.code} 입니다. ${input.ttlMinutes}분 내에 입력해 주세요.`;
}

function extractMessageId(response: unknown): string {
  if (!response || typeof response !== "object") {
    return `solapi-${Date.now()}`;
  }

  const value = response as Record<string, unknown>;

  if (typeof value.messageId === "string" && value.messageId) {
    return value.messageId;
  }

  if (Array.isArray(value.messages) && value.messages.length > 0) {
    const first = value.messages[0];
    if (first && typeof first === "object") {
      const firstRecord = first as Record<string, unknown>;

      if (
        typeof firstRecord.messageId === "string" &&
        firstRecord.messageId
      ) {
        return firstRecord.messageId;
      }

      if (typeof firstRecord.id === "string" && firstRecord.id) {
        return firstRecord.id;
      }
    }
  }

  if (typeof value.id === "string" && value.id) {
    return value.id;
  }

  return `solapi-${Date.now()}`;
}

type SolapiMessageServiceCtor = new (
  apiKey: string,
  apiSecret: string,
) => {
  send(payload: {
    to: string;
    from: string;
    text: string;
    autoTypeDetect?: boolean;
  }): Promise<unknown>;
};

async function getSolapiMessageService(): Promise<InstanceType<SolapiMessageServiceCtor>> {
  const mod = (await import("solapi")) as unknown as {
    SolapiMessageService: SolapiMessageServiceCtor;
  };

  if (!mod?.SolapiMessageService) {
    throw new Error(
      "[sms] Failed to load SolapiMessageService from 'solapi' package.",
    );
  }

  const apiKey = getRequiredEnv("SOLAPI_API_KEY");
  const apiSecret = getRequiredEnv("SOLAPI_API_SECRET");

  return new mod.SolapiMessageService(apiKey, apiSecret);
}

/**
 * Solapi/Nurigo 실제 SMS 발송
 */
export async function sendSignupVerificationSms(
  input: SendSignupVerificationSmsInput,
): Promise<SendSignupVerificationSmsResult> {
  const service = await getSolapiMessageService();

  const to = toDomesticKoreanPhoneNumber(input.phoneNumber);
  const from = digitsOnly(getRequiredEnv("SOLAPI_SENDER_NUMBER"));
  const text = buildSmsText(input);

  if (!to) {
    throw new Error("[sms] Invalid destination phone number.");
  }

  if (!from) {
    throw new Error("[sms] Invalid sender phone number.");
  }

  try {
    const response = await service.send({
      to,
      from,
      text,
      autoTypeDetect: false,
    });

    const messageId = extractMessageId(response);

    console.log("[sms] solapi sms sent", {
      provider: "solapi",
      messageId,
      to: maskPhoneNumber(to),
    });

    return {
      provider: "solapi",
      messageId,
    };
  } catch (error) {
    console.error("[sms] solapi send failed", {
      to: maskPhoneNumber(to),
      error,
    });

    throw error;
  }
}
