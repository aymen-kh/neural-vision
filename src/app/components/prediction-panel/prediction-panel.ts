import { Component, ElementRef, ViewChild, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NeuralNetworkService } from '../../services/neural-network';
import { Dataset } from '../../services/dataset';
import * as tf from '@tensorflow/tfjs';
import { Chart, ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-prediction-panel',
  imports: [CommonModule],
  templateUrl: './prediction-panel.html',
  styleUrl: './prediction-panel.css',
})
export class PredictionPanel implements AfterViewInit {
  @ViewChild('drawCanvas') drawCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chart') chartRef!: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D | null = null;
  private isDrawing = false;
  private chart: Chart | null = null;

  readonly predictionResult = signal<{ label: number; confidence: number } | null>(null);
  readonly isModelReady = signal(false);

  constructor(
    private nnService: NeuralNetworkService,
    private datasetService: Dataset
  ) {
    // Check if model is ready
    if (this.nnService.getModel()) {
      this.isModelReady.set(true);
    }
  }

  ngAfterViewInit(): void {
    this.initCanvas();
    this.initChart();
  }

  private initCanvas(): void {
    const canvas = this.drawCanvasRef.nativeElement;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!this.ctx) return;

    // Set black background
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set drawing style
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 15;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Add event listeners
    canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    canvas.addEventListener('mousemove', this.draw.bind(this));
    canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      this.startDrawing({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
    });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.draw({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
    });
    canvas.addEventListener('touchend', this.stopDrawing.bind(this));
  }

  private startDrawing(e: MouseEvent): void {
    this.isDrawing = true;
    this.draw(e);
  }

  private draw(e: MouseEvent): void {
    if (!this.isDrawing || !this.ctx) return;

    const canvas = this.drawCanvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  private stopDrawing(): void {
    this.isDrawing = false;
    if (this.ctx) {
      this.ctx.beginPath();
    }
    // Auto predict on stop drawing
    if (this.isModelReady()) {
      this.predict();
    }
  }

  clearCanvas(): void {
    if (!this.ctx) return;
    const canvas = this.drawCanvasRef.nativeElement;
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.predictionResult.set(null);
    this.updateChart(new Array(10).fill(0));
  }

  async predict(): Promise<void> {
    if (!this.ctx || !this.nnService.getModel()) return;

    // Get image data from canvas
    const canvas = this.drawCanvasRef.nativeElement;

    // Create a temporary tensor from the canvas data
    const tensor = tf.tidy(() => {
      // Read pixels from canvas
      let img = tf.browser.fromPixels(canvas, 1);

      // Resize to 28x28
      img = tf.image.resizeBilinear(img, [28, 28]);

      // Normalize to 0-1
      img = img.toFloat().div(255.0);

      // Reshape to match model input [1, 28, 28, 1] or [1, 784] depending on model
      const model = this.nnService.getModel();
      const inputShape = model?.inputs[0].shape;

      if (inputShape && inputShape.length === 2) {
        // Flatten input [1, 784]
        return img.reshape([1, 784]);
      } else {
        // CNN input [1, 28, 28, 1]
        return img.reshape([1, 28, 28, 1]);
      }
    });

    // Run prediction
    const prediction = this.nnService.predict(tensor) as tf.Tensor;
    const probabilities = await prediction.data();
    const predictedClass = await prediction.argMax(-1).data();

    // Update UI
    this.predictionResult.set({
      label: predictedClass[0],
      confidence: probabilities[predictedClass[0]]
    });

    this.updateChart(Array.from(probabilities));

    // Cleanup
    tensor.dispose();
    prediction.dispose();
  }

  loadRandomSample(): void {
    if (!this.datasetService.datasetLoaded()) {
      alert('Please load a dataset first in the Dataset Playground');
      return;
    }

    const sample = this.datasetService.getRandomSamples('test', 1)[0];
    this.drawSample(sample.input);
    if (this.isModelReady()) {
      this.predict();
    }
  }

  private drawSample(data: number[]): void {
    if (!this.ctx) return;
    const canvas = this.drawCanvasRef.nativeElement;

    // Draw 28x28 data to 280x280 canvas
    const scale = canvas.width / 28;

    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      if (val > 0) {
        const x = (i % 28) * scale;
        const y = Math.floor(i / 28) * scale;
        const color = Math.floor(val * 255);
        this.ctx.fillStyle = `rgb(${color}, ${color}, ${color})`;
        this.ctx.fillRect(x, y, scale, scale);
      }
    }
  }

  private initChart(): void {
    if (!this.chartRef?.nativeElement) return;

    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
        datasets: [{
          label: 'Confidence',
          data: new Array(10).fill(0),
          backgroundColor: '#00f5ff',
          borderColor: '#00f5ff',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#888' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#fff' }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(data: number[]): void {
    if (this.chart) {
      this.chart.data.datasets[0].data = data;
      // Highlight the predicted class
      const maxVal = Math.max(...data);
      const colors = data.map(v => v === maxVal ? '#00ff88' : '#00f5ff');
      this.chart.data.datasets[0].backgroundColor = colors;
      this.chart.data.datasets[0].borderColor = colors;
      this.chart.update();
    }
  }
}
