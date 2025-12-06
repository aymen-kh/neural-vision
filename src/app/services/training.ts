import { Injectable, signal } from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  TrainingConfig,
  TrainingMetrics,
  TrainingProgress,
  TrainingHistory,
  TrainingStatus,
  EarlyStoppingConfig,
  ReduceLRConfig,
  ConfusionMatrix,
  BatchMetrics,
} from '../models/training-config.model';

@Injectable({
  providedIn: 'root',
})
export class Training {
  // Training state
  readonly trainingStatus = signal<TrainingStatus>('idle');
  readonly currentProgress = signal<TrainingProgress | null>(null);

  // Observables for real-time updates
  private metricsSubject = new BehaviorSubject<TrainingMetrics | null>(null);
  private batchMetricsSubject = new Subject<BatchMetrics>();
  private progressSubject = new BehaviorSubject<TrainingProgress | null>(null);

  // Training history
  private history: TrainingMetrics[] = [];
  private startTime: number = 0;
  private pausedTime: number = 0;

  // Early stopping
  private earlyStopping: {
    bestValue: number;
    bestEpoch: number;
    waitCount: number;
    bestWeights?: tf.Tensor[];
  } | null = null;

  // Learning rate scheduling
  private reduceLR: {
    bestValue: number;
    waitCount: number;
    currentLR: number;
  } | null = null;

  constructor() { }

  // Train model with callbacks
  async trainModel(
    model: tf.LayersModel,
    x: tf.Tensor,
    y: tf.Tensor,
    config: TrainingConfig
  ): Promise<TrainingHistory> {
    console.log('Starting training with config:', config);
    this.trainingStatus.set('preparing');
    this.history = [];
    this.startTime = Date.now();
    this.pausedTime = 0;

    const totalSamples = x.shape[0];
    const totalBatches = Math.ceil(totalSamples / config.batchSize);
    console.log(`Total samples: ${totalSamples}, Total batches: ${totalBatches}`);

    try {
      const fitHistory = await model.fit(x, y, {
        epochs: config.epochs,
        batchSize: config.batchSize,
        validationSplit: config.validationSplit,
        shuffle: config.shuffle,
        classWeight: config.classWeight,
        verbose: 0,
        callbacks: {
          onTrainBegin: () => {
            console.log('Training begun');
            this.trainingStatus.set('training');
          },

          onEpochBegin: (epoch) => {
            console.log(`Epoch ${epoch + 1}/${config.epochs} started`);
            const progress: TrainingProgress = {
              currentEpoch: epoch,
              totalEpochs: config.epochs,
              currentBatch: 0,
              totalBatches: totalBatches,
              elapsedTime: Date.now() - this.startTime - this.pausedTime,
              eta: 0,
              status: 'training',
            };

            this.currentProgress.set(progress);
            this.progressSubject.next(progress);
          },

          onEpochEnd: async (epoch, logs) => {
            console.log(`Epoch ${epoch + 1} ended. Logs:`, logs);
            const metrics: TrainingMetrics = {
              epoch: epoch,
              loss: logs?.['loss'] || 0,
              accuracy: logs?.['acc'] || 0,
              valLoss: logs?.['val_loss'],
              valAccuracy: logs?.['val_acc'],
              learningRate: this.getCurrentLearningRate(model),
              timestamp: Date.now(),
            };

            this.history.push(metrics);
            this.metricsSubject.next(metrics);

            // Update progress with ETA
            const elapsedTime = Date.now() - this.startTime - this.pausedTime;
            const avgTimePerEpoch = elapsedTime / (epoch + 1);
            const remainingEpochs = config.epochs - epoch - 1;
            const eta = avgTimePerEpoch * remainingEpochs;

            const progress: TrainingProgress = {
              currentEpoch: epoch + 1,
              totalEpochs: config.epochs,
              currentBatch: totalBatches,
              totalBatches: totalBatches,
              elapsedTime: elapsedTime,
              eta: eta,
              status: 'training',
            };

            this.currentProgress.set(progress);
            this.progressSubject.next(progress);

            // Check early stopping
            if (config.callbacks.includes('earlyStopping')) {
              const shouldStop = await this.checkEarlyStopping(model, metrics);
              if (shouldStop) {
                model.stopTraining = true;
              }
            }

            // Check learning rate reduction
            if (config.callbacks.includes('reduceLROnPlateau')) {
              await this.checkReduceLR(model, metrics);
            }
          },

          onBatchEnd: (batch, logs) => {
            const batchMetrics: BatchMetrics = {
              batchIndex: batch,
              loss: logs?.['loss'] || 0,
              accuracy: logs?.['acc'] || 0,
              size: config.batchSize,
              time: Date.now(),
            };

            this.batchMetricsSubject.next(batchMetrics);

            // Update progress
            const progress = this.currentProgress();
            if (progress) {
              progress.currentBatch = batch;
              this.currentProgress.set({ ...progress });
              this.progressSubject.next({ ...progress });
            }
          },
        },
      });

      this.trainingStatus.set('completed');

      // Build training history
      const totalTime = Date.now() - this.startTime - this.pausedTime;
      const bestMetrics = this.findBestMetrics();

      const trainingHistory: TrainingHistory = {
        history: this.history,
        bestEpoch: bestMetrics.epoch,
        bestLoss: bestMetrics.loss,
        bestAccuracy: bestMetrics.accuracy,
        totalTime: totalTime,
        converged: this.checkConvergence(),
      };

      return trainingHistory;
    } catch (error) {
      this.trainingStatus.set('error');
      throw error;
    }
  }

  // Get current learning rate from model
  private getCurrentLearningRate(model: tf.LayersModel): number {
    const optimizer = model.optimizer as any;
    if (optimizer && optimizer.learningRate !== undefined) {
      return optimizer.learningRate;
    }
    return 0.001; // Default
  }

  // Early stopping check
  private async checkEarlyStopping(
    model: tf.LayersModel,
    metrics: TrainingMetrics
  ): Promise<boolean> {
    const config: EarlyStoppingConfig = {
      monitor: 'valLoss',
      patience: 10,
      minDelta: 0.001,
      mode: 'min',
      restoreBestWeights: true,
    };

    if (!this.earlyStopping) {
      this.earlyStopping = {
        bestValue: metrics.valLoss || metrics.loss,
        bestEpoch: metrics.epoch,
        waitCount: 0,
        bestWeights: config.restoreBestWeights ? model.getWeights() : undefined,
      };
      return false;
    }

    const currentValue = metrics.valLoss || metrics.loss;
    const improved =
      config.mode === 'min'
        ? currentValue < this.earlyStopping.bestValue - config.minDelta
        : currentValue > this.earlyStopping.bestValue + config.minDelta;

    if (improved) {
      this.earlyStopping.bestValue = currentValue;
      this.earlyStopping.bestEpoch = metrics.epoch;
      this.earlyStopping.waitCount = 0;
      if (config.restoreBestWeights) {
        this.earlyStopping.bestWeights = model.getWeights();
      }
      return false;
    }

    this.earlyStopping.waitCount++;

    if (this.earlyStopping.waitCount >= config.patience) {
      if (config.restoreBestWeights && this.earlyStopping.bestWeights) {
        model.setWeights(this.earlyStopping.bestWeights);
      }
      return true;
    }

    return false;
  }

  // Learning rate reduction check
  private async checkReduceLR(model: tf.LayersModel, metrics: TrainingMetrics): Promise<void> {
    const config: ReduceLRConfig = {
      monitor: 'valLoss',
      factor: 0.5,
      patience: 5,
      minLearningRate: 1e-7,
      mode: 'min',
    };

    const optimizer = model.optimizer as any;
    if (!optimizer || !optimizer.learningRate) {
      return;
    }

    if (!this.reduceLR) {
      this.reduceLR = {
        bestValue: metrics.valLoss || metrics.loss,
        waitCount: 0,
        currentLR: optimizer.learningRate,
      };
      return;
    }

    const currentValue = metrics.valLoss || metrics.loss;
    const improved =
      config.mode === 'min'
        ? currentValue < this.reduceLR.bestValue
        : currentValue > this.reduceLR.bestValue;

    if (improved) {
      this.reduceLR.bestValue = currentValue;
      this.reduceLR.waitCount = 0;
    } else {
      this.reduceLR.waitCount++;

      if (this.reduceLR.waitCount >= config.patience) {
        const newLR = Math.max(this.reduceLR.currentLR * config.factor, config.minLearningRate);

        if (newLR < this.reduceLR.currentLR) {
          optimizer.learningRate = newLR;
          this.reduceLR.currentLR = newLR;
          this.reduceLR.waitCount = 0;
        }
      }
    }
  }

  // Find best metrics
  private findBestMetrics(): TrainingMetrics {
    if (this.history.length === 0) {
      return {
        epoch: 0,
        loss: 0,
        accuracy: 0,
        learningRate: 0,
        timestamp: Date.now(),
      };
    }

    return this.history.reduce((best, current) => {
      return current.accuracy > best.accuracy ? current : best;
    });
  }

  // Check convergence
  private checkConvergence(): boolean {
    if (this.history.length < 5) {
      return false;
    }

    const recentHistory = this.history.slice(-5);
    const lossChanges = [];

    for (let i = 1; i < recentHistory.length; i++) {
      lossChanges.push(Math.abs(recentHistory[i].loss - recentHistory[i - 1].loss));
    }

    const avgChange = lossChanges.reduce((a, b) => a + b, 0) / lossChanges.length;
    return avgChange < 0.001;
  }

  // Compute confusion matrix
  async computeConfusionMatrix(
    model: tf.LayersModel,
    x: tf.Tensor,
    y: tf.Tensor,
    numClasses: number
  ): Promise<ConfusionMatrix> {
    const predictions = model.predict(x) as tf.Tensor;
    let predClasses: tf.Tensor;
    let trueClasses: tf.Tensor;

    // Handle binary classification (shape [N, 1])
    if (predictions.shape[1] === 1) {
      predClasses = predictions.greater(0.5).cast('int32').reshape([-1]);
      trueClasses = y.cast('int32').reshape([-1]);
    } else {
      // Handle multi-class (shape [N, numClasses])
      predClasses = predictions.argMax(-1);
      trueClasses = y.argMax(-1);
    }

    const predArray = (await predClasses.array()) as number[];
    const trueArray = (await trueClasses.array()) as number[];

    // Build confusion matrix
    const matrix: number[][] = Array(numClasses)
      .fill(0)
      .map(() => Array(numClasses).fill(0));

    for (let i = 0; i < predArray.length; i++) {
      matrix[trueArray[i]][predArray[i]]++;
    }

    // Calculate metrics
    const precision: number[] = [];
    const recall: number[] = [];
    const f1Score: number[] = [];
    let correct = 0;

    for (let i = 0; i < numClasses; i++) {
      const tp = matrix[i][i];
      const fp = matrix.reduce((sum, row, idx) => (idx !== i ? sum + row[i] : sum), 0);
      const fn = matrix[i].reduce((sum, val, idx) => (idx !== i ? sum + val : sum), 0);

      correct += tp;

      const p = tp + fp > 0 ? tp / (tp + fp) : 0;
      const r = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1 = p + r > 0 ? (2 * p * r) / (p + r) : 0;

      precision.push(p);
      recall.push(r);
      f1Score.push(f1);
    }

    const accuracy = correct / predArray.length;

    predictions.dispose();
    predClasses.dispose();
    trueClasses.dispose();

    return {
      matrix,
      classes: Array.from({ length: numClasses }, (_, i) => i),
      accuracy,
      precision,
      recall,
      f1Score,
    };
  }

  // Observables
  getMetricsObservable(): Observable<TrainingMetrics | null> {
    return this.metricsSubject.asObservable();
  }

  getBatchMetricsObservable(): Observable<BatchMetrics> {
    return this.batchMetricsSubject.asObservable();
  }

  getProgressObservable(): Observable<TrainingProgress | null> {
    return this.progressSubject.asObservable();
  }

  // Get training history
  getHistory(): TrainingMetrics[] {
    return this.history;
  }

  // Reset training state
  reset(): void {
    this.history = [];
    this.trainingStatus.set('idle');
    this.currentProgress.set(null);
    this.earlyStopping = null;
    this.reduceLR = null;
    this.metricsSubject.next(null);
    this.progressSubject.next(null);
  }
}
