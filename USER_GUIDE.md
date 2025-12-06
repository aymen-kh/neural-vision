# Neural Vision - User Guide
## What is this app?
**Neural Vision** is a powerful, no-code tool for building, training, and visualizing Neural Networks right in your browser. It allows you to:
1.  **Load Data**: Drag & drop any CSV dataset.
2.  **Design Network**: Visually stack layers (Dense, Conv2D, etc.) like Lego blocks.
3.  **Train**: Watch the model learn in real-time with live charts.
4.  **Visualize**: See what the network is actually "thinking" (activations).

## How to use it (Step-by-Step)

### 1. Load your Dataset
- Go to the **Dataset Playground**.
- Drag & drop your CSV file.
- **Configure**:
    - **Label Column Index**: Count which column number is your target (starting from 0).
        - *Example*: If your CSV is `Age, Gender, Salary`, and you want to predict `Salary`, the index is **2**.
    - **Check the "Type"**: The app will tell you if it's **Regression** (predicting a number) or **Classification** (predicting a category).

### 2. Build your Network
- Go to the **Network Builder**.
- **Input Shape**: This is automatically set based on your dataset.
- **Add Layers**:
    - **For Classification** (e.g., Yes/No, Cats/Dogs):
        - Hidden layers: `Dense` (Units: 32-128, Activation: `ReLU`)
        - **Output Layer**: `Dense` (Units: Number of classes, Activation: `Softmax` or `Sigmoid` for binary).
    - **For Regression** (e.g., Price, Temperature):
        - Hidden layers: `Dense` (Units: 32-128, Activation: `ReLU`)
        - **Output Layer**: `Dense` (Units: **1**, Activation: `Linear` or `ReLU`).

### 3. Train
- Go to the **Training Dashboard**.
- Click **Start Training**.
- Watch the **Loss** go down and **Accuracy** go up!

## Troubleshooting Common Issues

### "Target expected shape [*, 1] but received [*, N]"
- **Cause**: Mismatch between your model output and dataset type.
- **Fix**:
    - If doing **Binary Classification** (2 classes), output layer must have **1 Unit** (Sigmoid).
    - If doing **Multi-class**, output layer units must match class count (Softmax).

### "NaN Loss" or Training fails immediately
- **Cause**: Data might be too large/unnormalized or learning rate too high.
- **Fix**: The app now **automatically normalizes** your data to 0-1 range. Try reducing the **Learning Rate** in the optimizer settings (e.g., 0.0001).

### "CSV not loading"
- **Cause**: Complex CSV format (quotes, weird characters).
- **Fix**: The app now has a **Smart Parser** that handles quotes (`"New York, NY"`) and automatically converts text categories (`Male`, `Female`, `Yes`, `No`) into numbers.
