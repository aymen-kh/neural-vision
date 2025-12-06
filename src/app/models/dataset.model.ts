export interface DatasetInfo {
  name: string;
  description: string;
  samples: number;
  features: number;
  classes: number;
  inputShape: number[];
  type?: 'classification' | 'regression';
  classWeights?: { [key: number]: number };
}

export interface DatasetSplit {
  trainImages: number[][];
  trainLabels: number[];
  testImages: number[][];
  testLabels: number[];
}

export interface DataAugmentationConfig {
  rotation: boolean;
  rotationRange: number;
  zoom: boolean;
  zoomRange: number;
  flip: boolean;
  brightness: boolean;
  brightnessRange: number;
  noise: boolean;
  noiseLevel: number;
}

export interface DataPoint {
  id: string;
  input: number[];
  label: number;
  prediction?: number;
  correct?: boolean;
}
