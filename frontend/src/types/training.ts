export type ModelType = "baseline" | "balanced";

export interface DatasetUploadResponse {
  dataset_id: string;
  filename: string;
  stored_filename: string;

  rows: number;
  columns: string[];

  normal_count: number;
  fraud_count: number;
  fraud_rate: number;

  status: string;
}

export interface TrainingResponse {
  training_id: string;
}

export interface TrainingRequest {
  dataset_id: string;
}

export interface ConfusionMatrix {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
}

export interface ModelMetrics {
  confusion_matrix: ConfusionMatrix;
  precision: number;
  recall: number;
  f1: number;
  pr_auc: number;
}

export interface CandidateModel {
  threshold: number;
  validation_loss: number;
  test_loss: number;
  metrics: ModelMetrics;
}

export interface CandidatesResponse {
  training_id: string;

  dataset: {
    rows: number;
    train_rows: number;
    validation_rows: number;
    test_rows: number;
  };

  baseline: CandidateModel;
  balanced: CandidateModel;
}

export interface ActivateModelRequest {
  training_id: string;
  model_type: ModelType;
}