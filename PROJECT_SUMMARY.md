# Neural Vision: Project Summary & Technical Report

## 1. Project Overview
**Neural Vision** is a modern, no-code web application designed to democratize Deep Learning. It allows users to visually build, train, and analyze neural networks directly in the browser using their own datasets.

### Key Capabilities
-   **Smart Dataset Loading**: Drag-and-drop CSV support with automatic preprocessing (normalization, categorical encoding).
-   **Visual Network Builder**: "Lego-like" interface for stacking layers (Dense, Conv2D, Flatten).
-   **Real-time Training**: Live visualization of Loss and Accuracy curves.
-   **Advanced Analytics**: Comprehensive validation metrics including Confusion Matrices, Precision, Recall, and F1 Scores.

---

## 2. Angular Architecture & Technical Implementation

This project leverages the latest features of **Angular 18+**, focusing on performance, reactivity, and developer experience.

### 2.1. Signals for Reactive State Management
We moved away from traditional `Zone.js` change detection patterns in favor of **Angular Signals**.

*   **Implementation**:
    In `dataset.ts` and `training.ts`, we used `signal()` to hold state like `datasetInfo` and `trainingStatus`.
    ```typescript
    // src/app/services/dataset.ts
    readonly datasetLoaded = signal(false);
    readonly datasetInfo = signal<DatasetInfo | null>(null);
    ```
*   **Why?**:
    Signals provide fine-grained reactivity. When `datasetLoaded` changes, Angular knows exactly which parts of the UI to update without checking the entire component tree. This is crucial for a high-performance app handling real-time training data updates.

### 2.2. Modern Control Flow (`@if`, `@for`)
We utilized the new built-in control flow syntax introduced in Angular 17.

*   **Implementation**:
    In `training-dashboard.html`, we replaced `*ngIf` and `*ngFor` with `@if` and `@for`.
    ```html
    <!-- src/app/components/training-dashboard/training-dashboard.html -->
    @for (row of matrix.matrix; track row; let i = $index) {
      <div class="heatmap-row">...</div>
    }
    ```
*   **Why?**:
    The new syntax is cleaner, more readable, and offers better type checking. It also eliminates the need to import `CommonModule` for basic logic, reducing bundle size.

### 2.3. Standalone Components
The entire application is built using **Standalone Components**, completely removing `NgModules`.

*   **Implementation**:
    Every component (e.g., `NetworkBuilder`, `TrainingDashboard`) defines its own dependencies directly in the `@Component` decorator.
    ```typescript
    @Component({
      selector: 'app-training-dashboard',
      imports: [CommonModule, FormsModule, NumberFormatPipe, ...],
      ...
    })
    ```
*   **Why?**:
    This simplifies the architecture significantly. It makes components easier to test, reuse, and lazy-load. It also makes the "mental model" of the application much clearer—you see exactly what a component uses.

### 2.4. Service-Based Architecture
We used **Injectable Services** as the backbone for logic and state sharing.

*   **Dataset Service (`dataset.ts`)**: Handles file parsing, tensor conversion, and data splitting.
*   **Neural Network Service (`neural-network.ts`)**: Wraps TensorFlow.js to manage model creation and compilation.
*   **Training Service (`training.ts`)**: Manages the training loop, callbacks, and metric calculations.
*   **Why?**:
    Separation of concerns. The UI components (`NetworkBuilder`) are purely for display and user interaction, while the heavy lifting (math, data processing) happens in singleton services.

---

## 3. Key Technical Challenges & Solutions

### 3.1. The "Shape Mismatch" Problem
**Challenge**: Users often confused Binary Classification (1 output unit) with Multi-class Classification (N output units), causing training crashes (e.g., *Target shape [32, 1] expected but got [32, 2]*).
**Solution**:
We implemented **Adaptive Logic** in `dataset.ts` and `network-builder.ts`:
1.  The app now detects if the target column is binary or multi-class.
2.  It automatically adjusts the data pipeline (`getDatasetTensors`) to return either One-Hot encoded vectors or simple scalar vectors.
3.  It dynamically selects the correct loss function (`binaryCrossentropy` vs `categoricalCrossentropy`) based on the final layer's unit count.

### 3.2. Robust CSV Parsing
**Challenge**: Real-world CSVs are messy. They contain quotes (`"New York, NY"`), text categories (`Male/Female`), and unnormalized numbers.
**Solution**:
We built a custom **Smart Preprocessor** in `dataset.ts`:
-   **Regex Parsing**: Correctly splits CSV lines while respecting quotes.
-   **Auto-Encoding**: Automatically detects text columns and converts them to integer mappings.
-   **Auto-Normalization**: Scales all numeric features to a `0-1` range to ensure stable neural network training.

### 3.3. Template Logic Limitations
**Challenge**: We tried to calculate complex metrics (Precision/Recall averages) directly in the HTML template, which caused Angular parser errors.
**Solution**:
We refactored the logic into the Component class (`training-dashboard.ts`).
-   Created helper methods: `getAverageMetric()` and `getHeatmapColor()`.
-   This keeps the template clean and adheres to the principle of keeping logic out of the view.

---

## 4. Conclusion
Neural Vision demonstrates the power of **Angular** for building complex, interactive scientific applications. By combining **Signals**, **Standalone Components**, and **TensorFlow.js**, we created a performant tool that abstracts away the complexity of coding neural networks, making AI accessible to everyone.
