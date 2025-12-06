import { Injectable, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LayerConfig } from '../models/layer.model';
import { NetworkArchitecture } from '../models/network.model';

export interface NetworkVisualizationConfig {
  layerSpacing: number;
  neuronSpacing: number;
  maxNeuronsPerLayer: number;
  connectionOpacity: number;
  animationSpeed: number;
}

export interface NeuronMesh {
  mesh: THREE.Mesh;
  layerIndex: number;
  neuronIndex: number;
  activation: number;
}

export interface ConnectionLine {
  line: THREE.Line;
  weight: number;
  fromLayer: number;
  toLayer: number;
}

@Injectable({
  providedIn: 'root',
})
export class VisualizationService {
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private controls: OrbitControls | null = null;
  private neurons: NeuronMesh[] = [];
  private connections: ConnectionLine[] = [];
  private animationId: number | null = null;

  private readonly defaultConfig: NetworkVisualizationConfig = {
    layerSpacing: 5,
    neuronSpacing: 1.5,
    maxNeuronsPerLayer: 20,
    connectionOpacity: 0.3,
    animationSpeed: 1,
  };

  constructor() { }

  // Initialize Three.js scene
  initScene(container: ElementRef, width: number, height: number): void {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e27);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 20;
    this.camera.position.y = 5;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.nativeElement.appendChild(this.renderer.domElement);

    // Add OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;

    // Add lights
    this.addLights();

    // Add grid helper
    const gridHelper = new THREE.GridHelper(50, 50, 0x00f5ff, 0x1a1f3a);
    gridHelper.position.y = -10;
    this.scene.add(gridHelper);

    // Start animation loop
    this.animate();
  }

  // Add lighting to scene
  private addLights(): void {
    if (!this.scene) return;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Point lights for neon effect
    const light1 = new THREE.PointLight(0x00f5ff, 1, 100);
    light1.position.set(10, 10, 10);
    this.scene.add(light1);

    const light2 = new THREE.PointLight(0xff00ff, 1, 100);
    light2.position.set(-10, 10, 10);
    this.scene.add(light2);

    const light3 = new THREE.PointLight(0x00ff88, 1, 100);
    light3.position.set(0, -10, 10);
    this.scene.add(light3);
  }

  // Visualize network architecture
  visualizeNetwork(
    architecture: NetworkArchitecture,
    config?: Partial<NetworkVisualizationConfig>
  ): void {
    if (!this.scene) return;

    const vizConfig = { ...this.defaultConfig, ...config };

    // Clear existing visualization
    this.clearVisualization();

    // Calculate layer sizes
    const layerSizes = this.calculateLayerSizes(architecture);

    // Create neurons for each layer
    layerSizes.forEach((size, layerIndex) => {
      this.createLayer(layerIndex, size, vizConfig);
    });

    // Create connections between layers
    for (let i = 0; i < layerSizes.length - 1; i++) {
      this.createConnections(i, i + 1, layerSizes[i], layerSizes[i + 1], vizConfig);
    }

    // Center camera on network
    this.centerCamera(layerSizes.length, vizConfig);
  }

  // Calculate actual layer sizes (neurons count)
  private calculateLayerSizes(architecture: NetworkArchitecture): number[] {
    const sizes: number[] = [];

    architecture.layers.forEach((layer) => {
      let size = 0;

      switch (layer.type) {
        case 'dense':
          size = Math.min(layer.units || 0, this.defaultConfig.maxNeuronsPerLayer);
          break;
        case 'conv2d':
          size = Math.min(layer.filters || 0, this.defaultConfig.maxNeuronsPerLayer);
          break;
        case 'maxPooling2d':
          size = 8; // Representative size
          break;
        case 'flatten':
          size = 10; // Representative size
          break;
        case 'dropout':
          size = 10; // Representative size
          break;
        default:
          size = 10;
      }

      sizes.push(size);
    });

    return sizes;
  }

  // Create a layer of neurons
  private createLayer(
    layerIndex: number,
    neuronCount: number,
    config: NetworkVisualizationConfig
  ): void {
    if (!this.scene) return;

    const x = layerIndex * config.layerSpacing;
    const startY = (-(neuronCount - 1) * config.neuronSpacing) / 2;

    for (let i = 0; i < neuronCount; i++) {
      const y = startY + i * config.neuronSpacing;
      const neuron = this.createNeuron(x, y, 0, layerIndex, i);
      this.neurons.push(neuron);
      this.scene.add(neuron.mesh);
    }
  }

  // Create a single neuron
  private createNeuron(
    x: number,
    y: number,
    z: number,
    layerIndex: number,
    neuronIndex: number
  ): NeuronMesh {
    const geometry = new THREE.SphereGeometry(0.3, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00f5ff,
      emissive: 0x00f5ff,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);

    return {
      mesh,
      layerIndex,
      neuronIndex,
      activation: 0,
    };
  }

  // Create connections between two layers
  private createConnections(
    fromLayer: number,
    toLayer: number,
    fromSize: number,
    toSize: number,
    config: NetworkVisualizationConfig
  ): void {
    if (!this.scene) return;

    const fromNeurons = this.neurons.filter((n) => n.layerIndex === fromLayer);
    const toNeurons = this.neurons.filter((n) => n.layerIndex === toLayer);

    // Limit connections for performance
    const maxConnections = 100;
    const connectionStep = Math.max(1, Math.floor((fromSize * toSize) / maxConnections));

    let connectionCount = 0;
    for (let i = 0; i < fromNeurons.length; i++) {
      for (let j = 0; j < toNeurons.length; j++) {
        if (connectionCount % connectionStep === 0) {
          const connection = this.createConnection(
            fromNeurons[i].mesh.position,
            toNeurons[j].mesh.position,
            fromLayer,
            toLayer,
            config
          );
          this.connections.push(connection);
          this.scene.add(connection.line);
        }
        connectionCount++;
      }
    }
  }

  // Create a single connection
  private createConnection(
    from: THREE.Vector3,
    to: THREE.Vector3,
    fromLayer: number,
    toLayer: number,
    config: NetworkVisualizationConfig
  ): ConnectionLine {
    const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
    const material = new THREE.LineBasicMaterial({
      color: 0x2a3150,
      opacity: config.connectionOpacity,
      transparent: true,
    });

    const line = new THREE.Line(geometry, material);

    return {
      line,
      weight: Math.random(),
      fromLayer,
      toLayer,
    };
  }

  // Update neuron activations
  updateActivations(activations: Map<string, number[]>): void {
    activations.forEach((layerActivations, layerId) => {
      const layerIndex = parseInt(layerId.split('_')[1] || '0');
      const layerNeurons = this.neurons.filter((n) => n.layerIndex === layerIndex);

      layerNeurons.forEach((neuron, idx) => {
        if (idx < layerActivations.length) {
          const activation = layerActivations[idx];
          neuron.activation = activation;

          // Update neuron color based on activation
          const material = neuron.mesh.material as THREE.MeshStandardMaterial;
          const intensity = Math.abs(activation);
          const hue = activation > 0 ? 0.5 : 0.9; // Cyan for positive, magenta for negative
          material.color.setHSL(hue, 1, 0.3 + intensity * 0.5);
          material.emissiveIntensity = 0.2 + intensity * 0.8;

          // Scale neuron based on activation
          const scale = 1 + Math.abs(activation) * 0.5;
          neuron.mesh.scale.set(scale, scale, scale);
        }
      });
    });
  }

  // Animate gradient flow
  animateGradientFlow(fromLayer: number, toLayer: number): void {
    const connections = this.connections.filter(
      (c) => c.fromLayer === fromLayer && c.toLayer === toLayer
    );

    const config = this.defaultConfig;

    connections.forEach((connection) => {
      const material = connection.line.material as THREE.LineBasicMaterial;

      // Pulse effect
      let opacity = config.connectionOpacity;
      const pulseAnimation = () => {
        opacity = config.connectionOpacity + Math.sin(Date.now() * 0.005) * 0.3;
        material.opacity = Math.max(0, Math.min(1, opacity));
      };

      pulseAnimation();
    });
  }

  // Center camera on network
  private centerCamera(layerCount: number, config: NetworkVisualizationConfig): void {
    if (!this.camera) return;

    const centerX = ((layerCount - 1) * config.layerSpacing) / 2;
    this.camera.position.x = centerX;
    this.camera.position.y = 5;
    this.camera.position.z = layerCount * 3;
    this.camera.lookAt(centerX, 0, 0);
  }

  // Animation loop
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    if (!this.scene || !this.camera || !this.renderer) return;

    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    // Pulse neurons
    this.neurons.forEach((neuron) => {
      const pulse = Math.sin(Date.now() * 0.002 + neuron.neuronIndex * 0.1) * 0.1;
      neuron.mesh.scale.setScalar(1 + pulse);
    });

    this.renderer.render(this.scene, this.camera);
  };

  // Clear visualization
  clearVisualization(): void {
    if (!this.scene) return;

    // Remove all neurons
    this.neurons.forEach((neuron) => {
      this.scene!.remove(neuron.mesh);
      neuron.mesh.geometry.dispose();
      (neuron.mesh.material as THREE.Material).dispose();
    });
    this.neurons = [];

    // Remove all connections
    this.connections.forEach((connection) => {
      this.scene!.remove(connection.line);
      connection.line.geometry.dispose();
      (connection.line.material as THREE.Material).dispose();
    });
    this.connections = [];
  }

  // Resize renderer
  onResize(width: number, height: number): void {
    if (!this.camera || !this.renderer) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // Dispose all resources
  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    this.clearVisualization();

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
  }

  // Get scene objects for external manipulation
  getScene(): THREE.Scene | null {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera | null {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }
}
