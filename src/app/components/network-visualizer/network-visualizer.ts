import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  signal,
  effect,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NeuralNetworkService } from '../../services/neural-network';
import { VisualizationService } from '../../services/visualization.service';
import { NetworkArchitecture } from '../../models/network.model';

@Component({
  selector: 'app-network-visualizer',
  imports: [CommonModule],
  templateUrl: './network-visualizer.html',
  styleUrl: './network-visualizer.css',
})
export class NetworkVisualizer implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef;

  readonly isLoading = signal(false);
  readonly hasNetwork = signal(false);
  readonly networkInfo = signal<string>('');

  constructor(private nnService: NeuralNetworkService, private vizService: VisualizationService) {
    // Effect to handle visualization when network becomes available
    effect(() => {
      if (this.hasNetwork() && !this.isLoading()) {
        // Allow time for DOM to update
        setTimeout(() => {
          if (this.canvasRef) {
            this.initVisualization();
            const architecture = this.nnService.getArchitecture();
            if (architecture) {
              this.visualizeArchitecture(architecture);
            }
          }
        });
      }
    });
  }

  ngOnInit(): void {
    // Load current model if available
    this.loadCurrentModel();

    // Subscribe to layer activations
    this.nnService.getLayerActivationsObservable().subscribe((activations) => {
      if (activations.size > 0) {
        const activationMap = new Map<string, number[]>();
        activations.forEach((activation, layerId) => {
          activationMap.set(layerId, activation.values.flat(Infinity) as number[]);
        });
        this.vizService.updateActivations(activationMap);
      }
    });
  }

  ngAfterViewInit(): void {
    // Initial check if canvas is already available (e.g. if hasNetwork was true initially)
    if (this.hasNetwork() && this.canvasRef) {
      this.initVisualization();
      const architecture = this.nnService.getArchitecture();
      if (architecture) {
        this.visualizeArchitecture(architecture);
      }
    }
  }

  ngOnDestroy(): void {
    this.vizService.dispose();
  }

  private initVisualization(): void {
    if (!this.canvasRef) return;

    console.log('Initializing visualization scene');
    const width = this.canvasRef.nativeElement.offsetWidth || 800;
    const height = this.canvasRef.nativeElement.offsetHeight || 600;

    this.vizService.initScene(this.canvasRef, width, height);
  }

  private loadCurrentModel(): void {
    const architecture = this.nnService.getArchitecture();
    console.log('Loading current model architecture:', architecture);

    if (architecture) {
      this.hasNetwork.set(true);

      const metadata = this.nnService.getNetworkMetadata();
      if (metadata) {
        this.networkInfo.set(
          `${metadata.totalLayers} layers, ${metadata.totalParams.toLocaleString()} parameters`
        );
      }
    } else {
      console.log('No network architecture found');
      this.hasNetwork.set(false);
      this.networkInfo.set('No network loaded');
    }
  }

  private visualizeArchitecture(architecture: NetworkArchitecture): void {
    // Don't set loading to true here as it would hide the canvas
    // this.isLoading.set(true);

    try {
      this.vizService.visualizeNetwork(architecture);
    } catch (error) {
      console.error('Error visualizing network:', error);
    }
  }

  refreshVisualization(): void {
    this.loadCurrentModel();
  }

  toggleRotation(): void {
    // Toggle camera rotation
    const camera = this.vizService.getCamera();
    if (camera) {
      // Implementation for camera controls
    }
  }

  resetCamera(): void {
    const architecture = this.nnService.getArchitecture();
    if (architecture) {
      this.visualizeArchitecture(architecture);
    }
  }
}
