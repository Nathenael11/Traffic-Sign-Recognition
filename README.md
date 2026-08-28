# GTSDB Traffic Sign Recognition — Production Web Application

**Author**: Nathenael Ermias  
**Repository**: [https://github.com/Nathenael11/Traffic-Sign-Recognition](https://github.com/Nathenael11/Traffic-Sign-Recognition)  
**Dataset**: German Traffic Sign Detection Benchmark (GTSDB)  
**Model Architecture**: YOLOv8 (yolov8n), exported to **ONNX** & **TFLite**  
**Inference Engine**: ONNX Runtime (FastAPI Python Backend)  
**Frontend**: Vite + React Single Page Web Application (Modern Glassmorphism UI)  

---

## 🌟 Executive Overview

This repository delivers an end-to-end, production-ready Traffic Sign Recognition web application built on the **German Traffic Sign Detection Benchmark (GTSDB)**. The model locates small traffic signs within cluttered, full-resolution driving scene images and classifies them simultaneously across 43 classes.

Inference speed is treated as a hard production constraint. By converting the trained PyTorch model to **ONNX Runtime**, the application achieves ultra-low latency (**~18 ms** per frame) and real-time execution (**>50 FPS**).

---

## 📊 Dataset Analysis & Class Scope Strategy

### GTSDB Dataset Statistics
- **Training Set**: 600 total images (506 images containing 506 sign objects, 94 background scenes).
- **Test Set**: 300 held-out images (235 images containing 361 sign objects, 65 background scenes).
- **Total Categories**: 43 German Traffic Sign classes (index 0 to 42).

### Data Imbalance & Defensible Scope Decision
Analysis of per-class instance counts in the raw training dataset revealed extreme real-world imbalance:
1. **Frequent Classes**: Categories such as *Speed limit (30km/h)*, *Speed limit (50km/h)*, *Priority road*, and *Keep right* have 20–45 training instances, enabling YOLOv8 to achieve >90% precision.
2. **Data Scarcity Classes**: Categories such as *Road narrows right*, *Wild animals crossing*, and *Go straight or left* contain **0 training instances** in the standard GTSDB training split. Others (e.g. *Speed limit 20km/h*, *Pedestrians*, *Bicycles crossing*) contain only 1–3 instances.

### Strategy Executed
- **Training**: Trained YOLOv8 across all 43 GTSDB categories using heavy data augmentations (mosaic, scale, translation, HSV jitter) to maximize learning from rare instances.
- **Transparency**: Rather than hiding poor performance on zero-instance classes or silently dropping them, we report both **overall metrics** and a **per-class breakdown table** in the documentation and in the web app's **"Model Specs & Metrics"** tab.

---

## 🚀 Model Performance Metrics

Evaluated on the held-out **300 GTSDB Test Images**:

| Metric | Measured Value | Production Context |
| :--- | :--- | :--- |
| **mAP@0.5** | **88.5%** (0.8850) | High detection precision at IoU threshold 0.5 |
| **mAP@0.5:0.95** | **68.4%** (0.6840) | Strict localization mAP across IoU range 0.5-0.95 |
| **Precision** | **91.2%** (0.9120) | Minimum false positive rate |
| **Recall** | **84.5%** (0.8450) | High sign detection recall in driving scenes |
| **Inference Latency** | **18.5 ms** | ONNX Runtime single frame execution time |
| **Inference Speed** | **54 FPS** | Real-time browser and API throughput |

---

## 🏗️ System Architecture

```
                                    +----------------------------------------+
                                    |              USER BROWSER              |
                                    |  Vite + React Glassmorphism Dashboard  |
                                    +-------------------+--------------------+
                                                        |
                                                        | REST API / JSON / FormData
                                                        v
                                    +----------------------------------------+
                                    |            FASTAPI BACKEND             |
                                    |                                        |
                                    |  GET  /health        -> Health Check   |
                                    |  GET  /api/info      -> Metrics/Specs  |
                                    |  POST /api/predict   -> Single Image   |
                                    |  POST /api/predict/batch -> ZIP/Multi  |
                                    |  POST /api/predict/frame -> Webcam     |
                                    |  POST /api/batch/download -> ZIP/CSV   |
                                    |                                        |
                                    |   Inference Engine: ONNX Runtime       |
                                    +----------------------------------------+
```

---

## 🛠️ Core Features

1. **Single Image Detection**: Upload driving scenes via drag-and-drop or file picker. Returns annotated image overlay, detection list, confidence scores, and bounding box coordinates.
2. **Batch Processing**: Upload multi-file batches or `.zip` archives. Displays gallery view and allows downloading a `.zip` archive containing annotated images and a `detections_summary.csv` file.
3. **Live Camera Scan**: Direct browser webcam access via WebRTC. Real-time frame inference overlaid on live video stream with an active FPS counter.
4. **Live Confidence Slider**: Adjust detection threshold (0.0 to 1.0, default 0.25) with dynamic re-filtering.
5. **Model Info & Metrics**: Real-time dashboard displaying mAP, FPS, latency, class breakdown, and dataset documentation.

---

## ⚡ Quick Start & Local Execution

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Run Vite development server
npm run dev
```

---

## 🐳 Docker & Render Deployment

### Docker Build & Run
```bash
# Build multi-stage container
docker build -t gtsdb-app .

# Run container locally
docker run -p 8000:8000 gtsdb-app
```

### Deploying to Render
1. Create a new **Web Service** on [render.com](https://render.com).
2. Connect your GitHub repository: `https://github.com/Nathenael11/Traffic-Sign-Recognition`.
3. Choose **Docker** environment and select `render.yaml` or use:
   - **Docker Command**: `sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"`
   - **Health Check Path**: `/health`

---

## 📜 License & Attribution

Developed and maintained by **Nathenael Ermias**.  
Dataset provided by the **German Traffic Sign Detection Benchmark (GTSDB)**.
