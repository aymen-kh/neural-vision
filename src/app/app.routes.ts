import { Routes } from '@angular/router';
import { NetworkBuilder } from './components/network-builder/network-builder';
import { NetworkVisualizer } from './components/network-visualizer/network-visualizer';
import { TrainingDashboard } from './components/training-dashboard/training-dashboard';
import { DatasetPlayground } from './components/dataset-playground/dataset-playground';
import { ActivationVisualizer } from './components/activation-visualizer/activation-visualizer';
import { PredictionPanel } from './components/prediction-panel/prediction-panel';

export const routes: Routes = [
  { path: '', redirectTo: 'dataset', pathMatch: 'full' },
  { path: 'dataset', component: DatasetPlayground, title: 'Dataset Playground' },
  { path: 'builder', component: NetworkBuilder, title: 'Network Builder' },
  { path: 'visualize', component: NetworkVisualizer, title: '3D Visualization' },
  { path: 'train', component: TrainingDashboard, title: 'Training Dashboard' },
  { path: 'activations', component: ActivationVisualizer, title: 'Activation Functions' },
  { path: 'predict', component: PredictionPanel, title: 'Live Prediction' },
  { path: '**', redirectTo: 'dataset' },
];
