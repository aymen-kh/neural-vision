import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  signal,
  computed,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import { NeuralNetworkService } from '../../services/neural-network';
import { Dataset } from '../../services/dataset';
import { Training } from '../../services/training';
import { ModelHistoryService } from '../../services/model-history.service';
import {
  TrainingConfig,
  TrainingMetrics,
  TrainingProgress,
  ConfusionMatrix,
} from '../../models/training-config.model';
import { NumberFormatPipe } from '../../pipes/number-format.pipe';
import { PercentagePipe } from '../../pipes/percentage.pipe';
import { DurationPipe } from '../../pipes/duration.pipe';

Chart.register(...registerables);

@Component({
  selector: 'app-training-dashboard',
  imports: [CommonModule, FormsModule, NumberFormatPipe, PercentagePipe],
  templateUrl: './training-dashboard.html',
  styleUrl: './training-dashboard.css',
})
export class TrainingDashboard implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('lossChart') lossChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('accuracyChart') accuracyChartRef!: ElementRef<HTMLCanvasElement>;

  // Charts
  private lossChart: Chart | null = null;
  private accuracyChart: Chart | null = null;

  // State
  readonly isTraining = computed(() => this.trainingService.trainingStatus() === 'training');
  readonly currentMetrics = signal<TrainingMetrics | null>(null);
  readonly currentProgress = computed(() => this.trainingService.currentProgress());
  readonly confusionMatrix = signal<ConfusionMatrix | null>(null);

  // Training configuration
  epochs = 10;
  batchSize = 32;
  validationSplit = 0.2;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private nnService: NeuralNetworkService,
    private datasetService: Dataset,
    private trainingService: Training,
    private modelHistory: ModelHistoryService
  ) { }

  ngOnInit(): void {
    // Subscribe to training metrics
    this.subscriptions.push(
      this.trainingService.getMetricsObservable().subscribe((metrics) => {
        if (metrics) {
          this.currentMetrics.set(metrics);
          this.updateCharts(metrics);
        }
      })
    );
  }

  ngAfterViewInit(): void {
    // Initialize charts after view init
    this.initCharts();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.destroyCharts();
  }

  // Initialize charts
  private initCharts(): void {
    if (this.lossChartRef && this.lossChartRef.nativeElement) {
      this.createLossChart();
    }
    if (this.accuracyChartRef && this.accuracyChartRef.nativeElement) {
      this.createAccuracyChart();
    }
  }

  // Create loss chart
  private createLossChart(): void {
    const ctx = this.lossChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Training Loss',
            data: [],
            borderColor: '#00f5ff',
            backgroundColor: 'rgba(0, 245, 255, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Validation Loss',
            data: [],
            borderColor: '#ff00ff',
            backgroundColor: 'rgba(255, 0, 255, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: '#ffffff' },
          },
          title: {
            display: true,
            text: 'Loss Over Time',
            color: '#00f5ff',
            font: { size: 16, weight: 'bold' },
          },
        },
        scales: {
          x: {
            ticks: { color: '#888' },
            grid: { color: 'rgba(0, 245, 255, 0.1)' },
          },
          y: {
            ticks: { color: '#888' },
            grid: { color: 'rgba(0, 245, 255, 0.1)' },
            beginAtZero: true,
          },
        },
      },
    };

    this.lossChart = new Chart(ctx, config);
  }

  // Create accuracy chart
  private createAccuracyChart(): void {
    const ctx = this.accuracyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Training Accuracy',
            data: [],
            borderColor: '#00ff88',
            backgroundColor: 'rgba(0, 255, 136, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Validation Accuracy',
            data: [],
            borderColor: '#ffaa00',
            backgroundColor: 'rgba(255, 170, 0, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: '#ffffff' },
          },
          title: {
            display: true,
            text: 'Accuracy Over Time',
            color: '#00ff88',
            font: { size: 16, weight: 'bold' },
          },
        },
        scales: {
          x: {
            ticks: { color: '#888' },
            grid: { color: 'rgba(0, 255, 136, 0.1)' },
          },
          y: {
            ticks: { color: '#888' },
            grid: { color: 'rgba(0, 255, 136, 0.1)' },
            beginAtZero: true,
            max: 1,
          },
        },
      },
    };

    this.accuracyChart = new Chart(ctx, config);
  }

  // Update charts with new data
  private updateCharts(metrics: TrainingMetrics): void {
    if (this.lossChart) {
      this.lossChart.data.labels?.push(`Epoch ${metrics.epoch + 1}`);
      (this.lossChart.data.datasets[0].data as number[]).push(metrics.loss);
      if (metrics.valLoss !== undefined) {
        (this.lossChart.data.datasets[1].data as number[]).push(metrics.valLoss);
      }
      this.lossChart.update('none'); // Update without animation for performance
    }

    if (this.accuracyChart) {
      this.accuracyChart.data.labels?.push(`Epoch ${metrics.epoch + 1}`);
      (this.accuracyChart.data.datasets[0].data as number[]).push(metrics.accuracy);
      if (metrics.valAccuracy !== undefined) {
        (this.accuracyChart.data.datasets[1].data as number[]).push(metrics.valAccuracy);
      }
      this.accuracyChart.update('none');
    }
  }

  // Start training
  async startTraining(): Promise<void> {
    // Check if model is built
    const model = this.nnService.getModel();
    if (!model) {
      alert('Please build a model first');
      return;
    }

    // Check if dataset is loaded
    if (!this.datasetService.datasetLoaded()) {
      // Load MNIST dataset
      await this.datasetService.loadMNIST();
    }

    // Get training data
    // Check model output shape to determine if we need one-hot encoding
    const outputShape = model.outputs[0].shape;
    const outputUnits = outputShape[outputShape.length - 1];
    const useOneHot = outputUnits !== null && outputUnits > 1;

    const { x, y } = this.datasetService.getDatasetTensors('train', useOneHot);

    const datasetInfo = this.datasetService.datasetInfo();

    // Configure training
    const config: TrainingConfig = {
      epochs: this.epochs,
      batchSize: this.batchSize,
      validationSplit: this.validationSplit,
      shuffle: true,
      callbacks: ['earlyStopping', 'reduceLROnPlateau'],
      verbose: 1,
      classWeight: datasetInfo?.classWeights,
    };

    // Reset charts
    this.resetCharts();

    try {
      // Start training
      const history = await this.trainingService.trainModel(model, x, y, config);

      console.log('[Training] Training completed successfully');
      alert(`Training completed! Best accuracy: ${(history.bestAccuracy * 100).toFixed(2)}%`);

      // Mark model as trained
      this.nnService.isTrained.set(true);

      // Calculate confusion matrix on test set
      const { x: xTest, y: yTest } = this.datasetService.getDatasetTensors('test', useOneHot);
      const datasetInfo = this.datasetService.datasetInfo();

      if (datasetInfo) {
        const matrix = await this.trainingService.computeConfusionMatrix(
          model,
          xTest,
          yTest,
          datasetInfo.classes
        );
        this.confusionMatrix.set(matrix);
      }

      xTest.dispose();
      yTest.dispose();

      // Save training session to JSON server
      console.log('[Training] Saving training session to server');
      const lastMetrics = history.history[history.history.length - 1];
      this.modelHistory.saveTrainingSession({
        modelId: 1,
        epochs: this.epochs,
        accuracy: history.bestAccuracy,
        loss: lastMetrics?.loss || history.bestLoss,
        date: new Date().toISOString()
      }).subscribe({
        next: (session: any) => console.log('[Training] Session saved:', session),
        error: (err: any) => console.error('[Training] Failed to save session:', err)
      });

    } catch (error) {
      console.error('[Training] Training error:', error);
      alert(`Training error: ${error}`);
    } finally {
      // Cleanup tensors
      x.dispose();
      y.dispose();
    }
  }

  // Pause training
  pauseTraining(): void {
    // Implement pause functionality
    alert('Pause functionality coming soon');
  }

  // Stop training
  stopTraining(): void {
    const model = this.nnService.getModel();
    if (model) {
      model.stopTraining = true;
    }
  }

  // Reset charts
  private resetCharts(): void {
    if (this.lossChart) {
      this.lossChart.data.labels = [];
      this.lossChart.data.datasets.forEach((dataset) => {
        dataset.data = [];
      });
      this.lossChart.update();
    }

    if (this.accuracyChart) {
      this.accuracyChart.data.labels = [];
      this.accuracyChart.data.datasets.forEach((dataset) => {
        dataset.data = [];
      });
      this.accuracyChart.update();
    }

    this.trainingService.reset();
  }

  // Destroy charts
  private destroyCharts(): void {
    if (this.lossChart) {
      this.lossChart.destroy();
      this.lossChart = null;
    }
    if (this.accuracyChart) {
      this.accuracyChart.destroy();
      this.accuracyChart = null;
    }
  }

  // Get progress percentage
  getProgressPercentage(): number {
    const progress = this.currentProgress();
    if (!progress) return 0;
    return (progress.currentEpoch / progress.totalEpochs) * 100;
  }

  // Get ETA string
  getEtaString(): string {
    const progress = this.currentProgress();
    if (!progress || progress.eta === 0) return '-';

    const seconds = Math.floor(progress.eta / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Calculate average metric
  getAverageMetric(values: number[]): number {
    if (!values || values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  // Get heatmap color
  getHeatmapColor(value: number, matrix: number[][]): string {
    const flatMatrix = matrix.flat();
    const maxValue = Math.max(...flatMatrix, 1);
    // Normalize value relative to max value
    const intensity = (value / maxValue) * 0.8 + 0.2; // Min 0.2 opacity
    return `rgba(139, 92, 246, ${intensity})`;
  }
}
