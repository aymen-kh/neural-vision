import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dataset } from '../../services/dataset';
import { DataPoint } from '../../models/dataset.model';
import { DigitRenderDirective } from '../../directives/digit-render.directive';

@Component({
  selector: 'app-dataset-playground',
  imports: [CommonModule, DigitRenderDirective, FormsModule],
  templateUrl: './dataset-playground.html',
  styleUrl: './dataset-playground.css',
})
export class DatasetPlayground implements OnInit {
  readonly samples = signal<DataPoint[]>([]);
  readonly isLoading = signal(false);
  readonly uploadProgress = signal<string>('');
  readonly error = signal<string>('');
  readonly datasetStats = signal<{
    totalSamples: number;
    features: number;
    classes: number;
    inputShape: number[];
    type?: string;
  } | null>(null);

  // CSV config
  csvHasHeader = true;
  csvLabelColumn = 0;
  csvTestSplit = 0.2;

  constructor(private datasetService: Dataset) {
    // Load persisted config
    const config = this.datasetService.csvConfig();
    this.csvHasHeader = config.hasHeader;
    this.csvLabelColumn = config.labelColumn;
    this.csvTestSplit = config.testSplit;
  }

  ngOnInit(): void {
    if (this.datasetService.datasetLoaded()) {
      this.loadSamples();
      this.updateStats();
    }
  }

  // State
  private currentFile: File | null = null;

  // ... (existing code)

  // Save config when changed and reload if file exists
  async updateConfig(): Promise<void> {
    this.datasetService.csvConfig.set({
      hasHeader: this.csvHasHeader,
      labelColumn: this.csvLabelColumn,
      testSplit: this.csvTestSplit,
    });

    if (this.currentFile) {
      await this.reloadCurrentFile();
    }
  }

  async reloadCurrentFile(): Promise<void> {
    if (!this.currentFile) return;

    this.isLoading.set(true);
    this.error.set('');
    this.uploadProgress.set('Reprocessing dataset...');

    try {
      if (this.currentFile.name.endsWith('.csv')) {
        await this.datasetService.loadFromCSV(this.currentFile, {
          hasHeader: this.csvHasHeader,
          labelColumn: this.csvLabelColumn,
          testSplit: this.csvTestSplit,
        });
      } else if (this.currentFile.name.endsWith('.json')) {
        await this.datasetService.loadFromJSON(this.currentFile);
      }

      await this.loadSamples();
      this.uploadProgress.set('✓ Dataset updated!');
      setTimeout(() => this.uploadProgress.set(''), 2000);
    } catch (err) {
      this.error.set('Failed to update dataset: ' + (err as Error).message);
      console.error('Error updating dataset:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadSamples(): Promise<void> {
    console.log('Loading samples...');
    this.isLoading.set(true);
    this.error.set('');

    try {
      // Load MNIST if not loaded
      if (!this.datasetService.datasetLoaded()) {
        console.log('MNIST not loaded, loading now...');
        await this.datasetService.loadMNIST();
        console.log('MNIST loaded');
      }

      // Get random samples
      const samples = this.datasetService.getRandomSamples('train', 50);
      console.log(`Loaded ${samples.length} samples`);
      this.samples.set(samples);
      this.updateStats();
    } catch (err) {
      this.error.set('Failed to load dataset: ' + (err as Error).message);
      console.error('Error loading samples:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.currentFile = input.files[0];
    this.isLoading.set(true);
    this.error.set('');
    this.uploadProgress.set('Reading file...');

    try {
      if (this.currentFile.name.endsWith('.csv')) {
        this.uploadProgress.set('Parsing CSV...');
        await this.datasetService.loadFromCSV(this.currentFile, {
          hasHeader: this.csvHasHeader,
          labelColumn: this.csvLabelColumn,
          testSplit: this.csvTestSplit,
        });
      } else if (this.currentFile.name.endsWith('.json')) {
        this.uploadProgress.set('Parsing JSON...');
        await this.datasetService.loadFromJSON(this.currentFile);
      } else {
        throw new Error('Unsupported file format. Please use .csv or .json');
      }

      this.uploadProgress.set('Loading samples...');
      await this.loadSamples();
      this.uploadProgress.set('✓ Dataset loaded successfully!');

      setTimeout(() => this.uploadProgress.set(''), 3000);
    } catch (err) {
      this.error.set('Failed to load file: ' + (err as Error).message);
      console.error('Error loading file:', err);
      this.currentFile = null; // Reset on error
    } finally {
      this.isLoading.set(false);
      input.value = ''; // Reset input
    }
  }

  loadMNIST(): void {
    this.isLoading.set(true);
    this.error.set('');

    this.datasetService
      .loadMNIST()
      .then(() => {
        this.loadSamples();
      })
      .catch((err) => {
        this.error.set('Failed to load MNIST: ' + err.message);
      });
  }

  updateStats(): void {
    const info = this.datasetService.datasetInfo();
    if (info) {
      this.datasetStats.set({
        totalSamples: info.samples,
        features: info.features,
        classes: info.classes,
        inputShape: info.inputShape,
        type: info.type,
      });
    }
  }

  clearDataset(): void {
    this.datasetService.clearDataset();
    this.samples.set([]);
    this.datasetStats.set(null);
    this.uploadProgress.set('');
    this.error.set('');
  }
}
