import { Injectable, signal } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import {
  DatasetInfo,
  DatasetSplit,
  DataAugmentationConfig,
  DataPoint,
} from '../models/dataset.model';

@Injectable({
  providedIn: 'root',
})
export class Dataset {
  private currentDataset: DatasetSplit | null = null;
  readonly datasetLoaded = signal(false);
  readonly datasetInfo = signal<DatasetInfo | null>(null);

  // Persist CSV config
  readonly csvConfig = signal<{
    hasHeader: boolean;
    labelColumn: number;
    testSplit: number;
  }>({
    hasHeader: true,
    labelColumn: 0,
    testSplit: 0.2,
  });

  constructor() { }

  // Load MNIST dataset
  async loadMNIST(): Promise<DatasetSplit> {
    const MNIST_IMAGE_SIZE = 28;
    const MNIST_NUM_CLASSES = 10;
    const TRAIN_SAMPLES = 5000; // Reduced for demo
    const TEST_SAMPLES = 1000;

    // Generate synthetic MNIST-like data for demonstration
    // In production, you'd fetch from a server or use tfjs-data
    const trainImages: number[][] = [];
    const trainLabels: number[] = [];
    const testImages: number[][] = [];
    const testLabels: number[] = [];

    // Generate training data
    for (let i = 0; i < TRAIN_SAMPLES; i++) {
      const label = i % MNIST_NUM_CLASSES;
      const image = this.generateSyntheticDigit(label);
      trainImages.push(image);
      trainLabels.push(label);
    }

    // Generate test data
    for (let i = 0; i < TEST_SAMPLES; i++) {
      const label = i % MNIST_NUM_CLASSES;
      const image = this.generateSyntheticDigit(label);
      testImages.push(image);
      testLabels.push(label);
    }

    this.currentDataset = {
      trainImages,
      trainLabels,
      testImages,
      testLabels,
    };

    this.datasetInfo.set({
      name: 'MNIST',
      description: 'Handwritten digit recognition dataset',
      samples: TRAIN_SAMPLES + TEST_SAMPLES,
      features: MNIST_IMAGE_SIZE * MNIST_IMAGE_SIZE,
      classes: MNIST_NUM_CLASSES,
      inputShape: [MNIST_IMAGE_SIZE, MNIST_IMAGE_SIZE, 1],
    });

    this.datasetLoaded.set(true);
    return this.currentDataset;
  }

  // Generate synthetic digit for demonstration
  private generateSyntheticDigit(label: number): number[] {
    const size = 28 * 28;
    const image = new Array(size).fill(0);

    // Create simple patterns for each digit
    const centerX = 14;
    const centerY = 14;
    const radius = 8;

    for (let i = 0; i < size; i++) {
      const x = i % 28;
      const y = Math.floor(i / 28);
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Create digit-like patterns
      if (label === 0) {
        // Circle
        if (dist > radius - 2 && dist < radius + 2) {
          image[i] = Math.random() * 0.5 + 0.5;
        }
      } else if (label === 1) {
        // Vertical line
        if (Math.abs(dx) < 2) {
          image[i] = Math.random() * 0.5 + 0.5;
        }
      } else {
        // Random pattern based on label
        const pattern = Math.sin(dx * 0.3 + label) * Math.cos(dy * 0.3 + label);
        if (pattern > 0.3) {
          image[i] = Math.random() * 0.5 + 0.5;
        }
      }
    }

    return image;
  }

  // Load custom dataset from arrays
  loadCustomDataset(
    trainImages: number[][],
    trainLabels: number[],
    testImages: number[][],
    testLabels: number[],
    info: DatasetInfo
  ): DatasetSplit {
    this.currentDataset = {
      trainImages,
      trainLabels,
      testImages,
      testLabels,
    };

    this.datasetInfo.set(info);
    this.datasetLoaded.set(true);

    return this.currentDataset;
  }

  // Get dataset split as tensors
  getDatasetTensors(split: 'train' | 'test', oneHot: boolean = true): { x: tf.Tensor; y: tf.Tensor } {
    if (!this.currentDataset) {
      throw new Error('No dataset loaded');
    }

    const images =
      split === 'train' ? this.currentDataset.trainImages : this.currentDataset.testImages;
    const labels =
      split === 'train' ? this.currentDataset.trainLabels : this.currentDataset.testLabels;

    const info = this.datasetInfo();
    if (!info) {
      throw new Error('Dataset info not available');
    }

    // Convert to tensors
    const x = tf.tensor2d(images);

    // Reshape if needed for CNN
    let xReshaped = x;
    if (info.inputShape.length > 1) {
      xReshaped = x.reshape([-1, ...info.inputShape]);
    }

    // Handle label encoding
    let yProcessed: tf.Tensor;

    if (info.type === 'regression') {
      // Regression: use float32 and shape [batch, 1]
      const y = tf.tensor1d(labels, 'float32');
      yProcessed = y.reshape([-1, 1]);
      y.dispose();
    } else {
      // Classification: use int32
      const y = tf.tensor1d(labels, 'int32');
      if (oneHot) {
        yProcessed = tf.oneHot(y, info.classes);
      } else {
        // For binary/regression, reshape to [batch, 1]
        yProcessed = y.reshape([-1, 1]);
      }
      y.dispose();
    }

    return { x: xReshaped, y: yProcessed };
  }

  // Get batch of data
  getBatch(
    split: 'train' | 'test',
    batchSize: number,
    offset: number = 0,
    oneHot: boolean = true
  ): { x: tf.Tensor; y: tf.Tensor } {
    if (!this.currentDataset) {
      throw new Error('No dataset loaded');
    }

    const images =
      split === 'train' ? this.currentDataset.trainImages : this.currentDataset.testImages;
    const labels =
      split === 'train' ? this.currentDataset.trainLabels : this.currentDataset.testLabels;

    const endIndex = Math.min(offset + batchSize, images.length);
    const batchImages = images.slice(offset, endIndex);
    const batchLabels = labels.slice(offset, endIndex);

    const info = this.datasetInfo();
    if (!info) {
      throw new Error('Dataset info not available');
    }

    const x = tf.tensor2d(batchImages);
    let xReshaped = x;
    if (info.inputShape.length > 1) {
      xReshaped = x.reshape([-1, ...info.inputShape]);
    }

    let yProcessed: tf.Tensor;

    if (info.type === 'regression') {
      const y = tf.tensor1d(batchLabels, 'float32');
      yProcessed = y.reshape([-1, 1]);
      y.dispose();
    } else {
      const y = tf.tensor1d(batchLabels, 'int32');
      if (oneHot) {
        yProcessed = tf.oneHot(y, info.classes);
      } else {
        yProcessed = y.reshape([-1, 1]);
      }
      y.dispose();
    }

    return { x: xReshaped, y: yProcessed };
  }

  // Apply data augmentation
  augmentData(images: tf.Tensor, config: DataAugmentationConfig): tf.Tensor {
    let augmented = images;

    if (config.rotation && config.rotationRange > 0) {
      // Random rotation
      const angle = ((Math.random() - 0.5) * 2 * config.rotationRange * Math.PI) / 180;
      // Note: TensorFlow.js doesn't have built-in rotation, would need custom implementation
    }

    if (config.flip) {
      // Random horizontal flip
      if (Math.random() > 0.5) {
        augmented = tf.image.flipLeftRight(augmented as tf.Tensor4D) as tf.Tensor;
      }
    }

    if (config.brightness && config.brightnessRange > 0) {
      // Random brightness adjustment
      const delta = (Math.random() - 0.5) * 2 * config.brightnessRange;
      augmented = tf.add(augmented, delta);
      augmented = tf.clipByValue(augmented, 0, 1);
    }

    if (config.noise && config.noiseLevel > 0) {
      // Add random noise
      const noise = tf.randomNormal(augmented.shape, 0, config.noiseLevel);
      augmented = tf.add(augmented, noise);
      augmented = tf.clipByValue(augmented, 0, 1);
    }

    return augmented;
  }

  // Get random samples
  getRandomSamples(split: 'train' | 'test', count: number): DataPoint[] {
    if (!this.currentDataset) {
      throw new Error('No dataset loaded');
    }

    const images =
      split === 'train' ? this.currentDataset.trainImages : this.currentDataset.testImages;
    const labels =
      split === 'train' ? this.currentDataset.trainLabels : this.currentDataset.testLabels;

    const samples: DataPoint[] = [];
    const indices = new Set<number>();

    while (indices.size < Math.min(count, images.length)) {
      indices.add(Math.floor(Math.random() * images.length));
    }

    Array.from(indices).forEach((idx, i) => {
      samples.push({
        id: `${split}_${idx}`,
        input: images[idx],
        label: labels[idx],
      });
    });

    return samples;
  }

  // Normalize data
  normalizeData(data: tf.Tensor, mean?: number, std?: number): tf.Tensor {
    if (mean !== undefined && std !== undefined) {
      return tf.div(tf.sub(data, mean), std);
    }

    // Calculate mean and std if not provided
    const dataMean = data.mean();
    const dataStd = data.sub(dataMean).square().mean().sqrt();

    return tf.div(tf.sub(data, dataMean), dataStd);
  }

  // Get current dataset
  getCurrentDataset(): DatasetSplit | null {
    return this.currentDataset;
  }

  // Clear dataset
  clearDataset(): void {
    this.currentDataset = null;
    this.datasetLoaded.set(false);
    this.datasetInfo.set(null);
  }

  // Parse CSV line handling quotes
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' || char === "'") {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    return values;
  }

  private parseValue(val: string): number {
    if (!val) return 0;
    const cleanVal = val.trim().replace(/^['"]+|['"]+$/g, '');
    const lower = cleanVal.toLowerCase();

    if (lower === 'true' || lower === 'yes') return 1;
    if (lower === 'false' || lower === 'no') return 0;
    if (lower === 'male') return 1;
    if (lower === 'female') return 0;

    const num = parseFloat(cleanVal);
    return isNaN(num) ? NaN : num;
  }

  // Preprocess data (handle categorical & normalize)
  private preprocessData(
    rawRows: string[][],
    config: { labelColumn: number; featureColumns?: number[] }
  ): { features: number[]; label: number }[] {
    const processedData: { features: number[]; label: number }[] = [];
    const columnMaps = new Map<number, Map<string, number>>();
    const columnStats = new Map<number, { min: number; max: number }>();

    // 1. Analyze columns to build vocabularies and stats
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];

      row.forEach((val, colIndex) => {
        // Skip if not a feature or label
        const isLabel = colIndex === config.labelColumn;
        const isFeature = !config.featureColumns || config.featureColumns.includes(colIndex);

        if (!isLabel && !isFeature) return;

        const numVal = this.parseValue(val);

        if (isNaN(numVal)) {
          // Categorical: add to map
          if (!columnMaps.has(colIndex)) {
            columnMaps.set(colIndex, new Map());
          }
          const map = columnMaps.get(colIndex)!;
          const cleanVal = val.trim().replace(/^['"]+|['"]+$/g, '').toLowerCase();
          if (!map.has(cleanVal)) {
            map.set(cleanVal, map.size);
          }
        } else {
          // Numeric: update stats
          if (!columnStats.has(colIndex)) {
            columnStats.set(colIndex, { min: numVal, max: numVal });
          }
          const stats = columnStats.get(colIndex)!;
          stats.min = Math.min(stats.min, numVal);
          stats.max = Math.max(stats.max, numVal);
        }
      });
    }

    // 2. Transform data
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const features: number[] = [];
      let label = 0;

      // Process label
      const labelVal = row[config.labelColumn];
      const labelNum = this.parseValue(labelVal);

      if (isNaN(labelNum)) {
        // Categorical label
        const map = columnMaps.get(config.labelColumn);
        if (map) {
          const cleanVal = labelVal.trim().replace(/^['"]+|['"]+$/g, '').toLowerCase();
          label = map.get(cleanVal) || 0;
        }
      } else {
        label = labelNum;
      }

      // Process features
      row.forEach((val, colIndex) => {
        if (colIndex === config.labelColumn) return;
        if (config.featureColumns && !config.featureColumns.includes(colIndex)) return;

        let featureVal = 0;
        const numVal = this.parseValue(val);

        if (isNaN(numVal)) {
          // Categorical feature
          const map = columnMaps.get(colIndex);
          if (map) {
            const cleanVal = val.trim().replace(/^['"]+|['"]+$/g, '').toLowerCase();
            featureVal = map.get(cleanVal) || 0;
          }
        } else {
          // Numeric feature: Normalize to 0-1
          const stats = columnStats.get(colIndex);
          if (stats && stats.max > stats.min) {
            featureVal = (numVal - stats.min) / (stats.max - stats.min);
          } else {
            featureVal = numVal;
          }
        }
        features.push(featureVal);
      });

      processedData.push({ features, label });
    }

    return processedData;
  }

  // Load dataset from CSV file
  async loadFromCSV(
    file: File,
    config: {
      hasHeader: boolean;
      labelColumn: number;
      featureColumns?: number[];
      testSplit?: number;
    }
  ): Promise<DatasetSplit> {
    const text = await file.text();
    const lines = text.trim().split('\n');

    let startIndex = config.hasHeader ? 1 : 0;
    const rawRows: string[][] = [];

    // Parse all lines first
    for (let i = startIndex; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = this.parseCSVLine(lines[i]);
      if (values.length > 0) {
        rawRows.push(values);
      }
    }

    // Preprocess data (handle categorical, normalize, etc.)
    const allData = this.preprocessData(rawRows, config);

    if (allData.length === 0) {
      throw new Error(
        'No valid data found in CSV. Please check the label column index and ensure data is numeric.'
      );
    }

    // Shuffle data
    for (let i = allData.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allData[i], allData[j]] = [allData[j], allData[i]];
    }

    // Split into train/test
    const testSplit = config.testSplit || 0.2;
    const testSize = Math.floor(allData.length * testSplit);
    const trainSize = allData.length - testSize;

    const trainImages = allData.slice(0, trainSize).map((d) => d.features);
    const trainLabels = allData.slice(0, trainSize).map((d) => d.label);
    const testImages = allData.slice(trainSize).map((d) => d.features);
    const testLabels = allData.slice(trainSize).map((d) => d.label);

    // Determine number of classes and type
    const uniqueLabels = new Set([...trainLabels, ...testLabels]);

    // Check if labels are floats or if there are too many unique values
    const isFloat = [...trainLabels, ...testLabels].some(l => !Number.isInteger(l));
    const numUnique = uniqueLabels.size;

    let type: 'classification' | 'regression' = 'classification';
    let numClasses = 0;

    // Heuristic: If labels are floats OR too many unique values (> 50), assume regression
    if (isFloat || numUnique > 50) {
      type = 'regression';
      numClasses = 1;
    } else {
      type = 'classification';
      numClasses = Math.max(...uniqueLabels) + 1;
    }

    // Calculate class weights for classification
    let classWeights: { [key: number]: number } | undefined;
    if (type === 'classification') {
      const counts: { [key: number]: number } = {};
      trainLabels.forEach((l) => (counts[l] = (counts[l] || 0) + 1));

      classWeights = {};
      const numSamples = trainLabels.length;
      const numClassesFound = Object.keys(counts).length;

      Object.keys(counts).forEach((cls) => {
        const c = Number(cls);
        // Standard formula: total / (n_classes * count)
        classWeights![c] = numSamples / (numClassesFound * counts[c]);
      });

      console.log('Class Weights:', classWeights);
    }

    const info: DatasetInfo = {
      name: file.name.replace('.csv', ''),
      description: `Custom dataset from ${file.name}`,
      samples: allData.length,
      features: allData[0].features.length,
      classes: numClasses,
      inputShape: [allData[0].features.length],
      type: type,
      classWeights: classWeights,
    };

    return this.loadCustomDataset(trainImages, trainLabels, testImages, testLabels, info);
  }

  // Load dataset from JSON file
  async loadFromJSON(file: File): Promise<DatasetSplit> {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.trainImages || !data.trainLabels || !data.testImages || !data.testLabels) {
      throw new Error(
        'Invalid JSON format. Expected trainImages, trainLabels, testImages, testLabels'
      );
    }

    const info: DatasetInfo = data.info || {
      name: file.name.replace('.json', ''),
      description: `Custom dataset from ${file.name}`,
      samples: data.trainImages.length + data.testImages.length,
      features: data.trainImages[0].length,
      classes: Math.max(...data.trainLabels, ...data.testLabels) + 1,
      inputShape: [data.trainImages[0].length],
    };

    return this.loadCustomDataset(
      data.trainImages,
      data.trainLabels,
      data.testImages,
      data.testLabels,
      info
    );
  }

  // Validate dataset format
  validateDataset(
    trainImages: number[][],
    trainLabels: number[]
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (trainImages.length === 0) {
      errors.push('No training images provided');
    }

    if (trainLabels.length === 0) {
      errors.push('No training labels provided');
    }

    if (trainImages.length !== trainLabels.length) {
      errors.push('Number of images does not match number of labels');
    }

    if (trainImages.length > 0) {
      const featureLength = trainImages[0].length;
      const inconsistent = trainImages.some((img) => img.length !== featureLength);
      if (inconsistent) {
        errors.push('Inconsistent feature dimensions across samples');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
