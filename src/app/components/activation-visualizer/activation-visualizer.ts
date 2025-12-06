import { Component, OnInit, ViewChild, ElementRef, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration } from 'chart.js';
import { ActivationFunction } from '../../models/layer.model';
import { ActivationNamePipe } from '../../pipes/activation-name.pipe';

@Component({
  selector: 'app-activation-visualizer',
  imports: [CommonModule, ActivationNamePipe],
  templateUrl: './activation-visualizer.html',
  styleUrl: './activation-visualizer.css',
})
export class ActivationVisualizer implements OnInit, AfterViewInit {
  @ViewChild('chart') chartRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  readonly selectedActivation = signal<ActivationFunction>('relu');

  readonly activationFunctions: ActivationFunction[] = [
    'relu',
    'sigmoid',
    'tanh',
    'softmax',
    'linear',
    'elu',
    'selu',
    'leakyReLU',
  ];

  ngOnInit(): void {
    // Initialization logic if needed
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  selectActivation(activation: ActivationFunction): void {
    this.selectedActivation.set(activation);
    this.updateChart();
  }

  private createChart(): void {
    if (!this.chartRef?.nativeElement) return;

    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Activation',
            data: [],
            borderColor: '#00f5ff',
            backgroundColor: 'rgba(0, 245, 255, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 0,
          },
          {
            label: 'Derivative',
            data: [],
            borderColor: '#ff00ff',
            backgroundColor: 'rgba(255, 0, 255, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            pointRadius: 0,
            borderDash: [5, 5],
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
        },
        scales: {
          x: {
            ticks: { color: '#888' },
            grid: { color: 'rgba(0, 245, 255, 0.1)' },
          },
          y: {
            ticks: { color: '#888' },
            grid: { color: 'rgba(0, 245, 255, 0.1)' },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
    this.updateChart();
  }

  private updateChart(): void {
    if (!this.chart) return;

    const x = [];
    const y = [];
    const dy = [];

    for (let i = -5; i <= 5; i += 0.1) {
      x.push(i.toFixed(1));
      const activation = this.computeActivation(i);
      const derivative = this.computeDerivative(i);
      y.push(activation);
      dy.push(derivative);
    }

    this.chart.data.labels = x;
    (this.chart.data.datasets[0].data as number[]) = y;
    (this.chart.data.datasets[1].data as number[]) = dy;
    this.chart.update();
  }

  private computeActivation(x: number): number {
    switch (this.selectedActivation()) {
      case 'relu':
        return Math.max(0, x);
      case 'sigmoid':
        return 1 / (1 + Math.exp(-x));
      case 'tanh':
        return Math.tanh(x);
      case 'linear':
        return x;
      case 'elu':
        return x >= 0 ? x : Math.exp(x) - 1;
      case 'selu':
        const alpha = 1.67326;
        const scale = 1.0507;
        return x >= 0 ? scale * x : scale * alpha * (Math.exp(x) - 1);
      case 'leakyReLU':
        return x >= 0 ? x : 0.01 * x;
      default:
        return x;
    }
  }

  private computeDerivative(x: number): number {
    switch (this.selectedActivation()) {
      case 'relu':
        return x > 0 ? 1 : 0;
      case 'sigmoid':
        const s = 1 / (1 + Math.exp(-x));
        return s * (1 - s);
      case 'tanh':
        const t = Math.tanh(x);
        return 1 - t * t;
      case 'linear':
        return 1;
      case 'elu':
        return x >= 0 ? 1 : Math.exp(x);
      case 'leakyReLU':
        return x >= 0 ? 1 : 0.01;
      default:
        return 1;
    }
  }
}
