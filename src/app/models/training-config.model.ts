export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  validationSplit: number;
  shuffle: boolean;
  callbacks: TrainingCallback[];
  verbose: number;
  classWeight?: { [key: number]: number };
}

export type TrainingCallback =
  | 'earlyStopping'
  | 'modelCheckpoint'
  | 'reduceLROnPlateau'
  | 'tensorBoard';

export interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss?: number;
  valAccuracy?: number;
  learningRate: number;
  batchLoss?: number[];
  timestamp: number;
}

export interface TrainingProgress {
  currentEpoch: number;
  totalEpochs: number;
  currentBatch: number;
  totalBatches: number;
  elapsedTime: number;
  eta: number;
  status: TrainingStatus;
}

export type TrainingStatus =
  | 'idle'
  | 'preparing'
  | 'training'
  | 'validating'
  | 'paused'
  | 'completed'
  | 'error';

export interface TrainingHistory {
  history: TrainingMetrics[];
  bestEpoch: number;
  bestLoss: number;
  bestAccuracy: number;
  totalTime: number;
  converged: boolean;
}

export interface EarlyStoppingConfig {
  monitor: 'loss' | 'accuracy' | 'valLoss' | 'valAccuracy';
  patience: number;
  minDelta: number;
  mode: 'min' | 'max';
  baseline?: number;
  restoreBestWeights: boolean;
}

export interface ReduceLRConfig {
  monitor: 'loss' | 'accuracy' | 'valLoss' | 'valAccuracy';
  factor: number;
  patience: number;
  minLearningRate: number;
  mode: 'min' | 'max';
}

export interface ConfusionMatrix {
  matrix: number[][];
  classes: number[];
  accuracy: number;
  precision: number[];
  recall: number[];
  f1Score: number[];
}

export interface BatchMetrics {
  batchIndex: number;
  loss: number;
  accuracy: number;
  size: number;
  time: number;
}
