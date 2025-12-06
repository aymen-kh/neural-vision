# 🚀 Quick Start Guide

## Getting Started in 3 Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Application

```bash
npm start
```

The app will open at `http://localhost:4200`

### 3. Build Your First Neural Network

#### Step 1: Go to the Builder Page

- Click on "🏗️ Builder" in the navigation
- Drag layers from the left palette to the canvas

#### Step 2: Create a Simple MNIST Classifier

1. Drag a **Dense** layer (first layer - will auto-set input shape to 784)
2. Configure it: 128 units, ReLU activation
3. Drag another **Dense** layer
4. Configure it: 64 units, ReLU activation
5. Drag a final **Dense** layer
6. Configure it: 10 units, Softmax activation
7. Click "🚀 Build Model"

#### Step 3: Visualize Your Network

- Click on "👁️ Visualizer" to see your network in 3D
- Use mouse to rotate, zoom, and explore

#### Step 4: Train Your Model

- Click on "🚀 Train"
- Set epochs to 10, batch size to 32
- Click "▶️ Start Training"
- Watch real-time loss and accuracy charts

#### Step 5: Explore Dataset

- Click on "📊 Dataset" to see MNIST samples
- Click "🔄 Refresh Samples" to see different digits

#### Step 6: Study Activations

- Click on "⚡ Activations"
- Select different activation functions to see their graphs

## 📋 Example Architectures

### Simple Dense Network (MNIST)

```
Input (784) → Dense(128, ReLU) → Dense(64, ReLU) → Dense(10, Softmax)
```

### Convolutional Network

```
Input (28,28,1) → Conv2D(32, 3x3, ReLU) → MaxPool(2x2) →
Flatten → Dense(64, ReLU) → Dense(10, Softmax)
```

### Deep Network with Regularization

```
Input (784) → Dense(256, ReLU) → Dropout(0.3) →
Dense(128, ReLU) → Dropout(0.2) → Dense(10, Softmax)
```

## 💡 Tips

- **Start Simple**: Begin with a 2-3 layer network
- **Watch Training**: Monitor both loss and validation loss
- **Export/Import**: Save your architectures as JSON
- **Experiment**: Try different optimizers and learning rates

## 🎨 Features to Try

1. **Drag & Drop**: Build networks visually
2. **3D Visualization**: See your network structure
3. **Real-time Training**: Watch metrics update live
4. **Data Exploration**: Understand MNIST dataset
5. **Activation Functions**: Learn how they work

## 🐛 Common Issues

### Port Already in Use

```bash
# Use a different port
ng serve --port 4201
```

### Build Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Browser Console Errors

- Open DevTools (F12)
- Check Console tab for specific errors
- Most TensorFlow.js warnings are normal

## 📚 Next Steps

1. Experiment with different layer types
2. Try various activation functions
3. Adjust training hyperparameters
4. Export and save your best models
5. Build more complex architectures

## 🎯 Learning Path

### Beginner

- Build a simple 2-layer network
- Train on MNIST for 5 epochs
- Visualize in 3D

### Intermediate

- Add Conv2D layers
- Use Dropout for regularization
- Export architecture

### Advanced

- Create deep networks (5+ layers)
- Experiment with BatchNormalization
- Optimize training with callbacks

---

**Happy Neural Network Building! 🧠✨**
