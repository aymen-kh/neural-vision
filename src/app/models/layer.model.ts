export type LayerType =
  | 'dense'
  | 'conv2d'
  | 'maxPooling2d'
  | 'flatten'
  | 'dropout'
  | 'batchNormalization'
  | 'input';

export type ActivationFunction =
  | 'relu'
  | 'sigmoid'
  | 'tanh'
  | 'softmax'
  | 'linear'
  | 'elu'
  | 'selu'
  | 'leakyReLU';

export interface LayerConfig {
  id: string;
  type: LayerType;
  name: string;
  units?: number;
  activation?: ActivationFunction;
  filters?: number;
  kernelSize?: number | [number, number];
  strides?: number | [number, number];
  poolSize?: number | [number, number];
  rate?: number;
  inputShape?: number[];
  useBias?: boolean;
  kernelInitializer?: string;
  biasInitializer?: string;
  position?: { x: number; y: number };
}

export interface LayerMetadata {
  id: string;
  name: string;
  type: LayerType;
  outputShape: number[];
  paramCount: number;
  trainableParams: number;
  nonTrainableParams: number;
}

export interface LayerActivation {
  layerId: string;
  values: number[][];
  shape: number[];
  min: number;
  max: number;
  mean: number;
}

export interface NeuronData {
  layerIndex: number;
  neuronIndex: number;
  activation: number;
  weights: number[];
  bias: number;
  position: { x: number; y: number; z: number };
}
