import { Injectable, signal } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import {
  NetworkArchitecture,
  NetworkMetadata,
  PredictionResult,
  ModelWeights,
} from '../models/network.model';
import { LayerConfig, LayerMetadata, LayerActivation, NeuronData } from '../models/layer.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NeuralNetworkService {
  private model: tf.LayersModel | null = null;
  private architecture: NetworkArchitecture | null = null;

  // Signals for reactive state
  readonly modelLoaded = signal(false);
  readonly isCompiled = signal(false);
  readonly isTrained = signal(false);

  // Observable for layer activations
  private layerActivations$ = new BehaviorSubject<Map<string, LayerActivation>>(new Map());

  constructor() {}

  // Build a model from architecture
  buildModel(architecture: NetworkArchitecture): tf.LayersModel {
    console.log('NeuralNetworkService: Building model from architecture', architecture);
    const layers: tf.layers.Layer[] = [];

    architecture.layers.forEach((layerConfig, index) => {
      console.log(`Creating layer ${index}:`, layerConfig);
      let layer: tf.layers.Layer;

      switch (layerConfig.type) {
        case 'dense':
          layer = tf.layers.dense({
            units: layerConfig.units!,
            activation: layerConfig.activation as any,
            inputShape: index === 0 ? layerConfig.inputShape : undefined,
            useBias: layerConfig.useBias !== false,
            kernelInitializer: (layerConfig.kernelInitializer as any) || 'glorotUniform',
            name: layerConfig.name || `dense_${index}`,
          });
          break;

        case 'conv2d':
          layer = tf.layers.conv2d({
            filters: layerConfig.filters!,
            kernelSize: layerConfig.kernelSize as any,
            strides: layerConfig.strides as any,
            activation: layerConfig.activation as any,
            inputShape: index === 0 ? layerConfig.inputShape : undefined,
            name: layerConfig.name || `conv2d_${index}`,
          });
          break;

        case 'maxPooling2d':
          layer = tf.layers.maxPooling2d({
            poolSize: layerConfig.poolSize as any,
            strides: layerConfig.strides as any,
            inputShape: index === 0 ? layerConfig.inputShape : undefined,
            name: layerConfig.name || `maxPool_${index}`,
          });
          break;

        case 'flatten':
          layer = tf.layers.flatten({
            inputShape: index === 0 ? layerConfig.inputShape : undefined,
            name: layerConfig.name || `flatten_${index}`,
          });
          break;

        case 'dropout':
          layer = tf.layers.dropout({
            rate: layerConfig.rate!,
            inputShape: index === 0 ? layerConfig.inputShape : undefined,
            name: layerConfig.name || `dropout_${index}`,
          });
          break;

        case 'batchNormalization':
          layer = tf.layers.batchNormalization({
            name: layerConfig.name || `batchNorm_${index}`,
          });
          break;

        default:
          throw new Error(`Unknown layer type: ${layerConfig.type}`);
      }

      layers.push(layer);
    });

    this.model = tf.sequential({ layers });
    this.architecture = architecture;

    // Compile the model
    console.log('Compiling model with optimizer:', architecture.optimizer);
    const optimizer = this.createOptimizer(architecture.optimizer);

    this.model.compile({
      optimizer: optimizer,
      loss: architecture.loss,
      metrics: architecture.metrics,
    });

    this.modelLoaded.set(true);
    this.isCompiled.set(true);
    console.log('Model compiled successfully');

    return this.model;
  }

  // Create optimizer from config
  private createOptimizer(optimizerConfig: any): tf.Optimizer {
    const config = optimizerConfig;

    switch (config.type) {
      case 'sgd':
        return tf.train.sgd(config.learningRate);
      case 'momentum':
        return tf.train.momentum(config.learningRate, config.momentum || 0.9);
      case 'adam':
        return tf.train.adam(
          config.learningRate,
          config.beta1 || 0.9,
          config.beta2 || 0.999,
          config.epsilon || 1e-7
        );
      case 'rmsprop':
        return tf.train.rmsprop(
          config.learningRate,
          config.decay || 0.9,
          config.momentum,
          config.epsilon || 1e-7
        );
      case 'adagrad':
        return tf.train.adagrad(config.learningRate);
      default:
        return tf.train.adam(config.learningRate || 0.001);
    }
  }

  // Train the model
  async trainModel(
    x: tf.Tensor,
    y: tf.Tensor,
    epochs: number,
    batchSize: number,
    onEpochEnd?: (epoch: number, logs: any) => void
  ): Promise<tf.History> {
    if (!this.model) {
      throw new Error('Model not built. Call buildModel() first.');
    }

    return await this.model.fit(x, y, {
      epochs,
      batchSize,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (onEpochEnd) {
            onEpochEnd(epoch, logs);
          }
        },
      },
    });
  }

  // Make predictions
  predict(input: tf.Tensor): tf.Tensor {
    if (!this.model) {
      throw new Error('Model not built.');
    }
    return this.model.predict(input) as tf.Tensor;
  }

  // Get model summary
  getModelSummary(): string {
    if (!this.model) {
      return 'No model built';
    }

    let summary = '';
    this.model.summary(undefined, undefined, (line) => {
      summary += line + '\n';
    });
    return summary;
  }

  // Get layer outputs for visualization
  async getLayerOutputs(input: tf.Tensor): Promise<tf.Tensor[]> {
    if (!this.model) {
      throw new Error('Model not built.');
    }

    const outputs: tf.Tensor[] = [];

    for (let i = 0; i < this.model.layers.length; i++) {
      const layerModel = tf.model({
        inputs: this.model.inputs,
        outputs: this.model.layers[i].output as tf.SymbolicTensor,
      });

      const output = layerModel.predict(input) as tf.Tensor;
      outputs.push(output);
    }

    return outputs;
  }

  // Get layer activations with metadata
  async getLayerActivations(input: tf.Tensor): Promise<Map<string, LayerActivation>> {
    if (!this.model) {
      throw new Error('Model not built.');
    }

    const activations = new Map<string, LayerActivation>();

    for (let i = 0; i < this.model.layers.length; i++) {
      const layer = this.model.layers[i];
      const layerModel = tf.model({
        inputs: this.model.inputs,
        outputs: layer.output as tf.SymbolicTensor,
      });

      const output = layerModel.predict(input) as tf.Tensor;
      const values = (await output.array()) as number[][];
      const shape = output.shape;

      // Calculate statistics
      const flatValues = values.flat(Infinity) as number[];
      const min = Math.min(...flatValues);
      const max = Math.max(...flatValues);
      const mean = flatValues.reduce((a, b) => a + b, 0) / flatValues.length;

      activations.set(layer.name, {
        layerId: layer.name,
        values,
        shape,
        min,
        max,
        mean,
      });

      output.dispose();
      layerModel.dispose();
    }

    this.layerActivations$.next(activations);
    return activations;
  }

  // Get observable for layer activations
  getLayerActivationsObservable(): Observable<Map<string, LayerActivation>> {
    return this.layerActivations$.asObservable();
  }

  // Get network metadata
  getNetworkMetadata(): NetworkMetadata | null {
    if (!this.model) {
      return null;
    }

    const layers: LayerMetadata[] = [];
    let totalParams = 0;
    let trainableParams = 0;
    let nonTrainableParams = 0;

    this.model.layers.forEach((layer) => {
      const weights = layer.getWeights();
      const layerParams = weights.reduce((sum, w) => sum + w.size, 0);
      const trainable = layer.trainable ? layerParams : 0;
      const nonTrainable = layer.trainable ? 0 : layerParams;

      totalParams += layerParams;
      trainableParams += trainable;
      nonTrainableParams += nonTrainable;

      layers.push({
        id: layer.name,
        name: layer.name,
        type: layer.getClassName() as any,
        outputShape: layer.outputShape as number[],
        paramCount: layerParams,
        trainableParams: trainable,
        nonTrainableParams: nonTrainable,
      });
    });

    return {
      totalLayers: this.model.layers.length,
      totalParams,
      trainableParams,
      nonTrainableParams,
      layers,
      inputShape: this.model.inputs[0].shape.slice(1) as number[],
      outputShape: this.model.outputs[0].shape.slice(1) as number[],
    };
  }

  // Enhanced prediction with detailed results
  async predictWithDetails(input: tf.Tensor): Promise<PredictionResult> {
    if (!this.model) {
      throw new Error('Model not built.');
    }

    const output = this.model.predict(input) as tf.Tensor;
    const outputArray = (await output.array()) as number[][];
    const inputArray = (await input.array()) as number[][];

    const probabilities = outputArray[0];
    const predicted = probabilities.indexOf(Math.max(...probabilities));
    const confidence = probabilities[predicted];

    const probabilitiesMap = probabilities
      .map((prob, idx) => ({
        class: idx,
        probability: prob,
      }))
      .sort((a, b) => b.probability - a.probability);

    // Get activations for all layers
    const activations = await this.getLayerActivations(input);
    const activationsMap = new Map<string, number[]>();

    activations.forEach((activation, layerId) => {
      activationsMap.set(layerId, activation.values.flat(Infinity) as number[]);
    });

    output.dispose();

    return {
      input: inputArray[0],
      output: probabilities,
      predicted,
      confidence,
      probabilities: probabilitiesMap,
      activations: activationsMap,
    };
  }

  // Get model weights
  getModelWeights(): ModelWeights[] {
    if (!this.model) {
      return [];
    }

    const weights: ModelWeights[] = [];

    this.model.layers.forEach((layer) => {
      const layerWeights = layer.getWeights();
      if (layerWeights.length > 0) {
        const w = layerWeights[0].arraySync() as number[][][];
        const b = layerWeights.length > 1 ? (layerWeights[1].arraySync() as number[]) : [];

        weights.push({
          layerId: layer.name,
          weights: w,
          biases: b,
        });
      }
    });

    return weights;
  }

  // Save model
  async saveModel(name: string): Promise<void> {
    if (!this.model) {
      throw new Error('Model not built.');
    }
    await this.model.save(`localstorage://${name}`);
  }

  // Load model
  async loadModel(name: string): Promise<void> {
    this.model = await tf.loadLayersModel(`localstorage://${name}`);
    this.modelLoaded.set(true);
    this.isCompiled.set(true);
    this.isTrained.set(true);
  }

  // Export model architecture as JSON
  exportArchitecture(): string {
    if (!this.architecture) {
      throw new Error('No architecture available.');
    }
    return JSON.stringify(this.architecture, null, 2);
  }

  // Import model architecture from JSON
  importArchitecture(json: string): NetworkArchitecture {
    const architecture = JSON.parse(json) as NetworkArchitecture;
    this.buildModel(architecture);
    return architecture;
  }

  // Download model
  async downloadModel(name: string): Promise<void> {
    if (!this.model) {
      throw new Error('Model not built.');
    }
    await this.model.save(`downloads://${name}`);
  }

  // Get current architecture
  getArchitecture(): NetworkArchitecture | null {
    return this.architecture;
  }

  // Get current model
  getModel(): tf.LayersModel | null {
    return this.model;
  }

  // Dispose model
  disposeModel(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.architecture = null;
      this.modelLoaded.set(false);
      this.isCompiled.set(false);
      this.isTrained.set(false);
    }
  }

  // Validate architecture
  validateArchitecture(architecture: NetworkArchitecture): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!architecture.layers || architecture.layers.length === 0) {
      errors.push('Architecture must have at least one layer');
    }

    // Check first layer has input shape
    if (architecture.layers.length > 0 && !architecture.layers[0].inputShape) {
      errors.push('First layer must have an inputShape');
    }

    // Validate each layer
    architecture.layers.forEach((layer, index) => {
      switch (layer.type) {
        case 'dense':
          if (!layer.units || layer.units <= 0) {
            errors.push(`Layer ${index}: Dense layer must have positive units`);
          }
          break;
        case 'conv2d':
          if (!layer.filters || layer.filters <= 0) {
            errors.push(`Layer ${index}: Conv2D layer must have positive filters`);
          }
          if (!layer.kernelSize) {
            errors.push(`Layer ${index}: Conv2D layer must have kernelSize`);
          }
          break;
        case 'dropout':
          if (layer.rate === undefined || layer.rate < 0 || layer.rate >= 1) {
            errors.push(`Layer ${index}: Dropout rate must be between 0 and 1`);
          }
          break;
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
