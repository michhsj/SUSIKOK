export type ChartSeries = {
  name: string;
  data: Array<number | null>;
};

export type ChartBlock = {
  title: string;
  labels: string[];
  series: ChartSeries[];
};

export type ComprehensiveCompetencyChartItem = {
  key: "academic" | "career" | "community";
  label: string;
  description: string;
  universityRatioPercent: number;
  questionCount: number;
  userScore: number | null;
  userMaxScore: number | null;
  userPercent: number | null;
  weightedPercent: number | null;
};

export type ComprehensiveCompetencyChartBlock = {
  title: string;
  subtitle: string;
  locked: boolean;
  items: ComprehensiveCompetencyChartItem[];
};

export type DetailItem = {
  id: string;
  identity: {
    region: string;
    universityName: string;
    admissionType: string;
    admissionName: string;
    track: string;
    collegeName: string;
    recruitmentUnit: string;
  };
  recruitmentCount2027: {
    label: string;
    shortLabel: string;
    raw: string | null;
    display: string;
  };
  summaryFields: {
    label: string;
    value: string;
  }[];
  yearTable: {
    columns: string[];
    rows: {
      year: string;
      recruitmentCount: string;
      applicantCount: string;
      competitionRate: string;
      additionalPassCount: string;
      minSatisfiedRate: string;
      minSatisfiedCount: string;
      actualCompetitionRate: string;
      score50: string;
      score70: string;
      converted50: string;
      converted70: string;
    }[];
  };
  charts: {
    competitionRate: ChartBlock;
    scoreTrend: ChartBlock;
    comprehensiveCompetency?: ComprehensiveCompetencyChartBlock | null;
  };
  premium: {
    locked: boolean;
    title: string;
    items: {
      label: string;
      description?: string;
      locked: boolean;
    }[];
    saveAction?: {
      label: string;
    };
  };
};

export type SummaryField = DetailItem["summaryFields"][number];
export type YearRow = DetailItem["yearTable"]["rows"][number];
