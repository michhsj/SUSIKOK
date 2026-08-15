import { z } from "zod";

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "이름은 2자 이상 입력해주세요.")
      .max(20, "이름은 20자 이하로 입력해주세요."),

    email: z
      .string()
      .email("올바른 이메일 주소를 입력해주세요."),

    password: z
      .string()
      .min(8, "비밀번호는 8자 이상 입력해주세요.")
      .max(100, "비밀번호가 너무 깁니다.")
      .regex(
        /^(?=.*[a-zA-Z])(?=.*[0-9])/,
        "비밀번호는 영문과 숫자를 포함해야 합니다."
      ),

    passwordConfirm: z.string(),

    schoolId: z.string().min(1, "학교를 선택해주세요."),

    gradeLevel: z.number().int().min(1).max(4),

    termsConsent: z.boolean().refine((val) => val === true, {
      message: "이용약관에 동의해주세요.",
    }),

    privacyConsent: z.boolean().refine((val) => val === true, {
      message: "개인정보처리방침에 동의해주세요.",
    }),

    marketingConsent: z.boolean().optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });

export type SignupInput = z.infer<typeof signupSchema>;
