export interface ExplanationItem {
  feature: string;
  impact: number;
  direction: "FRAUD" | "NORMAL";
}

export interface AnalysisResult {
  training_id: string;
  model_type: "baseline" | "balanced";

  probability: number;
  threshold: number;

  prediction: "FRAUD" | "NORMAL";

  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";

  decision: "ALLOW" | "REVIEW" | "BLOCK";

  explanation: ExplanationItem[];
}