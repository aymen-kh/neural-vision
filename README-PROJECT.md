# 🧠 Neural Vision

An advanced, interactive Neural Network Visualizer built with **Angular 19**, **TensorFlow.js**, **Three.js**, and **Tailwind CSS**. This application allows you to build, train, and visualize deep learning models in real-time with stunning 3D graphics and explainable AI features.

![Neural Vision](https://img.shields.io/badge/Angular-19.0-red?style=for-the-badge&logo=angular)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.22-orange?style=for-the-badge&logo=tensorflow)
![Three.js](https://img.shields.io/badge/Three.js-0.181-black?style=for-the-badge&logo=three.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-blue?style=for-the-badge&logo=tailwindcss)

## ✨ Features

### 🏗️ Interactive Network Builder

- **Drag-and-drop layer creation** (Dense, Conv2D, MaxPooling, Dropout, BatchNorm)
- **Real-time architecture validation**
- **Layer parameter configuration panel**
- **Visual connection between layers**
- **Export/Import model architecture as JSON**

### 👁️ 3D Network Visualization

- **Animated neuron firing** with Three.js
- **Gradient flow visualization** during backpropagation
- **Interactive camera controls** (zoom, rotate, pan)
- **Layer-by-layer activation display**
- **Real-time neuron state updates**

### 🚀 Real-Time Training Dashboard

- **Live loss/accuracy curves** with Chart.js
- **Epoch progress with ETA**
- **Batch-level metrics**
- **Early stopping & learning rate scheduling**
- **Training configuration panel**

### 📊 Dataset Playground

- **Custom CSV/JSON dataset upload**
- **Automatic feature extraction**
- **MNIST digit visualization**
- **Random sample exploration**
- **Data augmentation preview**
- **Train/test split visualization**

### 🔮 Live Prediction Lab

- **Interactive drawing canvas** for digit recognition
- **Real-time inference** on user input
- **Confidence distribution charts**
- **Top-k class probabilities**

### ⚡ Activation Function Visualizer

- **Interactive plots** for ReLU, Sigmoid, Tanh, Softmax, ELU, SELU
- **Derivative visualization**
- **Function comparison mode**
- **Mathematical formulas and use cases**

## 🎨 Design System

### Color Palette

- **Background**: `#0a0e27` (deep space blue)
- **Primary**: `#00f5ff` (cyan neon)
- **Secondary**: `#ff00ff` (magenta neon)
- **Success**: `#00ff88` (green neon)
- **Warning**: `#ffaa00` (orange neon)
- **Danger**: `#ff0055` (red neon)

### Typography

- **Headings**: Orbitron (futuristic)
- **Body**: Inter (clean, readable)
- **Code**: Fira Code (monospace)

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:4200`

## 🚀 Usage

### 1. Build Your Network

Navigate to the **Builder** page and drag layers from the palette:

- Add Dense layers for fully connected networks
- Add Conv2D and MaxPooling for CNNs
- Configure activation functions, units, and more
- Export your architecture when done

### 2. Visualize the Architecture

Go to the **Visualizer** page to see your network in 3D:

- Neurons glow based on activation values
- Connections show weight relationships
- Interactive camera controls for exploration

### 3. Train Your Model

Head to the **Train** page:

- Configure epochs, batch size, and validation split
- Watch real-time loss/accuracy charts
- Monitor training progress with ETA
- Early stopping prevents overfitting

### 4. Explore the Dataset

Visit the **Dataset** page:

- View sample images from MNIST
- Understand your training data distribution
- Generate new random samples

### 5. Study Activation Functions

Check out the **Activations** page:

- Interactive plots of activation functions
- See derivatives for backpropagation
- Learn about use cases for each function

### 6. Test Predictions

Go to the **Predict** page:

- Draw a digit on the canvas
- See the model's prediction in real-time
- Analyze confidence scores for each class

## 🏗️ Project Structure

```
src/app/
├── components/
│   ├── network-builder/          # Drag & drop layer builder
│   ├── network-visualizer/        # 3D network graph
│   ├── training-dashboard/        # Real-time metrics
│   ├── dataset-playground/        # Data visualization
│   └── activation-visualizer/     # Function plots
├── services/
│   ├── neural-network.service.ts  # TensorFlow.js wrapper
│   ├── dataset.ts                 # Data loading/processing
│   ├── training.ts                # Training orchestration
│   └── visualization.service.ts   # 3D rendering helpers
├── models/
│   ├── layer.model.ts             # Layer interfaces
│   ├── network.model.ts           # Network architecture
│   ├── training-config.model.ts   # Training configuration
│   └── dataset.model.ts           # Dataset interfaces
├── pipes/
│   ├── activation-name.pipe.ts    # Format activation names
│   ├── number-format.pipe.ts      # Format numbers
│   ├── percentage.pipe.ts         # Format percentages
│   └── duration.pipe.ts           # Format time durations
└── directives/
    ├── neuron-highlight.directive.ts  # Neuron highlighting
    ├── draggable.directive.ts         # Drag functionality
    └── drop-zone.directive.ts         # Drop zone handling
```

## 🎯 Grading Criteria Coverage

| Criterion             | Implementation                                                                |
| --------------------- | ----------------------------------------------------------------------------- |
| **Design**            | Tailwind CSS with custom AI/ML theme, glassmorphism, neon accents, responsive |
| **Directives**        | 3 custom directives (neuron highlighting, draggable, drop zone)               |
| **Pipes**             | 4 pipes (activation name, number format, percentage, duration)                |
| **Components**        | 5+ components (builder, visualizer, dashboard, dataset, activations)          |
| **Nested Components** | Layer cards, neuron meshes, chart components nested within parents            |
| **Services**          | 4 services (neural network, dataset, training, visualization)                 |
| **Forms**             | Reactive forms for layer config, training parameters, optimizer settings      |
| **Routing**           | 5 routes with navigation (builder, visualizer, train, dataset, activations)   |
| **Signals**           | Angular signals for reactive state management (35+ signals)                   |
| **Observables**       | RxJS observables for real-time training metrics and progress                  |

## 🛠️ Technologies

- **Angular 19** - Modern web framework with signals
- **TensorFlow.js 4.22** - Machine learning in the browser
- **Three.js 0.181** - 3D graphics and visualization
- **Chart.js 4.5** - Real-time charting
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **RxJS 7.8** - Reactive programming
- **TypeScript 5.9** - Type-safe development

## 📝 Available Scripts

```bash
# Development
npm start              # Start dev server (ng serve)
npm run build          # Build for production
npm run watch          # Build in watch mode

# Testing
npm test               # Run tests
```

## 🎓 Key Learning Outcomes

This project demonstrates:

- ✅ Angular 19 standalone components and signals
- ✅ Complex state management with signals and observables
- ✅ Integration of TensorFlow.js for ML in the browser
- ✅ 3D visualization with Three.js
- ✅ Real-time data visualization with Chart.js
- ✅ Reactive forms with validation
- ✅ Custom directives and pipes
- ✅ Service-based architecture
- ✅ Routing and navigation
- ✅ Modern CSS with Tailwind
- ✅ TypeScript best practices

## 🌟 Highlights

- **100% TypeScript** - Fully type-safe codebase
- **Standalone Components** - No NgModules, modern Angular architecture
- **Signals-first** - Using Angular's new reactivity system
- **Production-ready** - Build optimizations and lazy loading
- **Accessible** - Semantic HTML and ARIA labels
- **Responsive** - Mobile-friendly design with Tailwind
- **Performance** - Optimized rendering and memory management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🎉 Acknowledgments

- Built as a demonstration of Angular 19's capabilities
- Inspired by modern ML visualization tools like TensorFlow Playground
- Designed with accessibility and user experience in mind

---

**Built with ❤️ using Angular 19, TensorFlow.js, Three.js & Tailwind CSS**

_Generated with Angular CLI 21.0.1_
