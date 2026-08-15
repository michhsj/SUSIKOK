// src/contents/home/hero.ts

export const heroContent = {
  eyebrow: "학생부 기반 대학별 환산 분석 서비스",
  title: `학생부 성적을 입력하면
대학별 환산점수와 지원 가능성을
한눈에 확인할 수 있습니다`,
  description:
    "수시KOK는 학교생활기록부 성적을 바탕으로 대학별 반영 기준에 맞는 환산점수를 계산하고, 대학 발표 기준과 비교하여 수시 지원 전략 수립에 필요한 참고 정보를 제공합니다.",
  primaryCta: {
    label: "무료로 시작하기",
    href: "/signup",
  },
  secondaryCta: {
    label: "서비스 안내 보기",
    href: "#service-overview",
  },
  helperText:
    "엑셀 업로드 또는 직접 입력 방식으로 간편하게 시작할 수 있습니다.",
  preview: {
    title: "내 분석 결과 예시",
    university: "OO대학교 학생부교과",
    myScore: "92.35",
    maxScore: "100",
    baseScore: "91.80",
    resultLabel: "적정 지원",
    percentile: "상위 28%",
  },
} as const;
