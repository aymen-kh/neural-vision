import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { LayerConfig, LayerType, ActivationFunction } from '../../models/layer.model';
import { NetworkArchitecture, OptimizerConfig } from '../../models/network.model';
import { DraggableDirective } from '../../directives/draggable.directive';
import { DropZoneDirective } from '../../directives/drop-zone.directive';
import { ActivationNamePipe } from '../../pipes/activation-name.pipe';
import { NeuralNetworkService } from '../../services/neural-network';
import { Dataset } from '../../services/dataset';

interface LayerTemplate {
  type: LayerType;
  name: string;
  icon: string;
  description: string;
  defaultConfig: Partial<LayerConfig>;
}

@Component({
  selector: 'app-network-builder',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DraggableDirective, DropZoneDirective],
  templateUrl: './network-builder.html',
  styleUrl: './network-builder.css',
})
export class NetworkBuilder {
  // Layer templates
  readonly layerTemplates: LayerTemplate[] = [
    {
      type: 'dense',
      name: 'Dense',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>',
      description: 'Fully connected layer',
      defaultConfig: { units: 128, activation: 'relu' },
    },
    {
      type: 'conv2d',
      name: 'Conv2D',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
      description: 'Convolutional layer',
      defaultConfig: { filters: 32, kernelSize: 3, activation: 'relu' },
    },
    {
      type: 'maxPooling2d',
      name: 'MaxPool',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>',
      description: 'Max pooling layer',
      defaultConfig: { poolSize: 2 },
    },
    {
      type: 'flatten',
      name: 'Flatten',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>',
      description: 'Flatten layer',
      defaultConfig: {},
    },
    {
      type: 'dropout',
      name: 'Dropout',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
      description: 'Dropout regularization',
      defaultConfig: { rate: 0.2 },
    },
    {
      type: 'batchNormalization',
      name: 'BatchNorm',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
      description: 'Batch normalization',
      defaultConfig: {},
    },
  ];

  // Architecture state
  readonly layers = signal<LayerConfig[]>([]);
  readonly selectedLayerIndex = signal<number | null>(null);
  readonly isValid = computed(() => this.validateArchitecture());

  // Forms
  layerConfigForm: FormGroup;
  optimizerForm: FormGroup;

  // Architecture name
  architectureName = 'My Network';

  constructor(
    private fb: FormBuilder,
    private nnService: NeuralNetworkService,
    private datasetService: Dataset
  ) {
    this.layerConfigForm = this.createLayerConfigForm();
    this.optimizerForm = this.createOptimizerForm();

    // Load existing architecture if available
    const existingArch = this.nnService.getArchitecture();
    if (existingArch) {
      this.layers.set(existingArch.layers);
      this.architectureName = existingArch.name;
      this.optimizerForm.patchValue(existingArch.optimizer);
    }
  }

  // Create layer configuration form
  private createLayerConfigForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      units: [128, [Validators.min(1)]],
      activation: ['relu'],
      filters: [32, [Validators.min(1)]],
      kernelSize: [3, [Validators.min(1)]],
      poolSize: [2, [Validators.min(1)]],
      rate: [0.2, [Validators.min(0), Validators.max(0.99)]],
      inputShape: [''],
    });
  }

  // Create optimizer form
  private createOptimizerForm(): FormGroup {
    return this.fb.group({
      type: ['adam', Validators.required],
      learningRate: [0.001, [Validators.required, Validators.min(0.00001)]],
      momentum: [0.9],
      beta1: [0.9],
      beta2: [0.999],
    });
  }

  // Add layer from template
  onLayerDrop(template: LayerTemplate): void {
    console.log('Adding layer:', template.name);
    const newLayer: LayerConfig = {
      id: this.generateId(),
      type: template.type,
      name: `${template.name}_${this.layers().length}`,
      ...template.defaultConfig,
    };

    // Set input shape for first layer
    if (this.layers().length === 0) {
      // Check if dataset is loaded and use its input shape
      const datasetInfo = this.datasetService.datasetInfo();
      if (datasetInfo && datasetInfo.inputShape) {
        newLayer.inputShape = datasetInfo.inputShape;
        console.log('First layer added, using dataset input shape:', newLayer.inputShape);
      } else {
        newLayer.inputShape = [784]; // Default for MNIST
        console.log('First layer added, using default input shape:', newLayer.inputShape);
      }
    }

    this.layers.update((layers) => [...layers, newLayer]);
    console.log('Current layers:', this.layers());
  }

  // Select layer for editing
  selectLayer(index: number): void {
    console.log('Selecting layer index:', index);
    this.selectedLayerIndex.set(index);
    const layer = this.layers()[index];
    this.populateLayerForm(layer);
  }

  // Populate form with layer data
  private populateLayerForm(layer: LayerConfig): void {
    this.layerConfigForm.patchValue({
      name: layer.name,
      units: layer.units || '',
      activation: layer.activation || '',
      filters: layer.filters || '',
      kernelSize: layer.kernelSize || '',
      poolSize: layer.poolSize || '',
      rate: layer.rate || '',
      inputShape: layer.inputShape ? layer.inputShape.join(',') : '',
    });
  }

  // Update selected layer
  updateSelectedLayer(): void {
    const index = this.selectedLayerIndex();
    if (index === null) return;

    console.log('Updating layer at index:', index);
    const formValue = this.layerConfigForm.value;
    const updatedLayer: LayerConfig = {
      ...this.layers()[index],
      name: formValue.name,
      units: formValue.units || undefined,
      activation: formValue.activation || undefined,
      filters: formValue.filters || undefined,
      kernelSize: formValue.kernelSize || undefined,
      poolSize: formValue.poolSize || undefined,
      rate: formValue.rate || undefined,
      inputShape: formValue.inputShape ? formValue.inputShape.split(',').map(Number) : undefined,
    };

    this.layers.update((layers) => {
      const newLayers = [...layers];
      newLayers[index] = updatedLayer;
      return newLayers;
    });
    console.log('Layer updated:', updatedLayer);
  }

  // Remove layer
  removeLayer(index: number): void {
    console.log('Removing layer at index:', index);
    this.layers.update((layers) => layers.filter((_, i) => i !== index));
    if (this.selectedLayerIndex() === index) {
      this.selectedLayerIndex.set(null);
    }
    console.log('Remaining layers:', this.layers());
  }

  // Move layer up
  moveLayerUp(index: number): void {
    if (index === 0) return;
    this.layers.update((layers) => {
      const newLayers = [...layers];
      [newLayers[index - 1], newLayers[index]] = [newLayers[index], newLayers[index - 1]];
      return newLayers;
    });
  }

  // Move layer down
  moveLayerDown(index: number): void {
    if (index === this.layers().length - 1) return;
    this.layers.update((layers) => {
      const newLayers = [...layers];
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      return newLayers;
    });
  }

  // Validate architecture
  private validateArchitecture(): boolean {
    const layers = this.layers();
    if (layers.length === 0) return false;
    if (!layers[0].inputShape) return false;
    return true;
  }

  // Build model
  buildModel(): void {
    console.log('Building model...');

    // Auto-correct input shape if dataset is loaded
    const datasetInfo = this.datasetService.datasetInfo();
    const currentLayers = this.layers();

    if (datasetInfo && datasetInfo.inputShape && currentLayers.length > 0) {
      const firstLayer = currentLayers[0];
      const currentShape = firstLayer.inputShape;
      const expectedShape = datasetInfo.inputShape;

      // Simple check for equality
      const isShapeMatch =
        currentShape &&
        currentShape.length === expectedShape.length &&
        currentShape.every((v, i) => v === expectedShape[i]);

      if (!isShapeMatch) {
        console.log(`Auto-correcting input shape from ${currentShape} to ${expectedShape}`);
        const updatedLayer = { ...firstLayer, inputShape: expectedShape };
        this.layers.update((layers) => {
          const newLayers = [...layers];
          newLayers[0] = updatedLayer;
          return newLayers;
        });

        // Also update the form if the first layer is selected
        if (this.selectedLayerIndex() === 0) {
          this.layerConfigForm.patchValue({
            inputShape: expectedShape.join(','),
          });
        }

        alert(`Updated input shape to match dataset: [${expectedShape.join(',')}]`);
      }
    }

    if (!this.isValid()) {
      console.warn('Invalid architecture');
      alert('Invalid architecture. Please check your layers.');
      return;
    }

    const optimizerConfig: OptimizerConfig = this.optimizerForm.value;
    console.log('Optimizer config:', optimizerConfig);

    // Determine loss function based on last layer
    let loss = 'categoricalCrossentropy';
    const lastLayer = this.layers()[this.layers().length - 1];
    if (lastLayer.units === 1) {
      loss = 'binaryCrossentropy';
    }

    const architecture: NetworkArchitecture = {
      id: this.generateId(),
      name: this.architectureName,
      layers: this.layers(),
      optimizer: optimizerConfig,
      loss: loss,
      metrics: ['accuracy'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Architecture to build:', architecture);

    try {
      this.nnService.buildModel(architecture);
      console.log('Model built successfully');
      alert('Model built successfully!');
    } catch (error) {
      console.error('Error building model:', error);
      alert(`Error building model: ${error}`);
    }
  }

  // Export architecture
  exportArchitecture(): void {
    const architecture: NetworkArchitecture = {
      id: this.generateId(),
      name: this.architectureName,
      layers: this.layers(),
      optimizer: this.optimizerForm.value,
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const json = JSON.stringify(architecture, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.architectureName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import architecture
  importArchitecture(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const architecture = JSON.parse(json) as NetworkArchitecture;
        this.layers.set(architecture.layers);
        this.architectureName = architecture.name;
        this.optimizerForm.patchValue(architecture.optimizer);
        alert('Architecture imported successfully!');
      } catch (error) {
        alert(`Error importing architecture: ${error}`);
      }
    };

    reader.readAsText(file);
  }

  // Clear all layers
  clearLayers(): void {
    if (confirm('Are you sure you want to clear all layers?')) {
      this.layers.set([]);
      this.selectedLayerIndex.set(null);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get layer display info
  getLayerDisplayInfo(layer: LayerConfig): string {
    switch (layer.type) {
      case 'dense':
        return `Units: ${layer.units}, Activation: ${layer.activation}`;
      case 'conv2d':
        return `Filters: ${layer.filters}, Kernel: ${layer.kernelSize}`;
      case 'maxPooling2d':
        return `Pool Size: ${layer.poolSize}`;
      case 'dropout':
        return `Rate: ${layer.rate}`;
      default:
        return '';
    }
  }

  // Get layer icon from template
  getLayerIcon(layer: LayerConfig): string {
    const template = this.layerTemplates.find((t) => t.type === layer.type);
    return template?.icon || '◻️';
  }
}
