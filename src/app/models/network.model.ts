import { LayerConfig, LayerMetadata } from './layer.model';

export interface NetworkArchitecture {
  id: string;
  name: string;
  layers: LayerConfig[];
  optimizer: OptimizerConfig;
  loss: string;
  metrics: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OptimizerConfig {
  type: 'sgd' | 'adam' | 'rmsprop' | 'adagrad' | 'momentum';
  learningRate: number;
  momentum?: number;
  beta1?: number;
  beta2?: number;
  epsilon?: number;
  decay?: number;
}

export interface NetworkMetadata {
  totalLayers: number;
  totalParams: number;
  trainableParams: number;
  nonTrainableParams: number;
  layers: LayerMetadata[];
  inputShape: number[];
  outputShape: number[];
}

export interface ModelWeights {
  layerId: string;
  weights: number[][][];
  biases: number[];
}

export interface GradientFlow {
  layerId: string;
  gradients: number[][];
  magnitude: number;
  direction: number;
}

export interface NetworkState {
  architecture: NetworkArchitecture;
  metadata: NetworkMetadata;
  weights?: ModelWeights[];
  isCompiled: boolean;
  isTrained: boolean;
}

export interface PredictionResult {
  input: number[];
  output: number[];
  predicted: number;
  confidence: number;
  probabilities: { class: number; probability: number }[];
  activations: Map<string, number[]>;
}
