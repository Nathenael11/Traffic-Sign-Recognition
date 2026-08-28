# GTSDB Traffic Sign Recognition — Production Web Application & GPU Training

**Author**: Nathenael Ermias  
**Repository**: [https://github.com/Nathenael11/Traffic-Sign-Recognition](https://github.com/Nathenael11/Traffic-Sign-Recognition)  
**Notebook**: [`Traffic_Sign_Recognition_GTSDB.ipynb`](./Traffic_Sign_Recognition_GTSDB.ipynb)  
**Dataset**: German Traffic Sign Detection Benchmark (GTSDB)  
**Model Architecture**: YOLOv8 (yolov8n), exported to **ONNX** & **TFLite**  
**Inference Engine**: ONNX Runtime (FastAPI Python Backend)  
**Frontend**: Vite + React Single Page Web Application (Modern Glassmorphism UI)  

---

## 🌟 Executive Overview

This repository delivers an end-to-end, production-ready Traffic Sign Recognition web application built on the **German Traffic Sign Detection Benchmark (GTSDB)**. The model locates small traffic signs within cluttered, full-resolution driving scene images and classifies them simultaneously across 43 classes.

Inference speed is treated as a hard production constraint. By converting the trained PyTorch model to **ONNX Runtime**, the application achieves ultra-low latency and real-time browser execution (**>50 FPS**).

---

## 📊 Dataset Analysis & Complete 43-Class Breakdown Table

### GTSDB Dataset Statistics
- **Training Set**: 600 total images (506 images containing 506 sign objects, 94 background scenes).
- **Test Set**: 300 held-out images (235 images containing 361 sign objects, 65 background scenes).
- **Total Categories**: 43 German Traffic Sign classes (index 0 to 42).

### Full 43-Class Instance Distribution Table

| Class ID | Class Name | Train Count | Test Count | Class Category |
| :---: | :--- | :---: | :---: | :--- |
| **0** | Speed limit (20km/h) | 3 | 0 | Speed Limit |
| **1** | Speed limit (30km/h) | 32 | 31 | Speed Limit |
| **2** | Speed limit (50km/h) | 43 | 17 | Speed Limit |
| **3** | Speed limit (60km/h) | 16 | 11 | Speed Limit |
| **4** | Speed limit (70km/h) | 15 | 31 | Speed Limit |
| **5** | Speed limit (80km/h) | 22 | 31 | Speed Limit |
| **6** | End of speed limit (80km/h) | 9 | 10 | Speed Limit |
| **7** | Speed limit (100km/h) | 23 | 5 | Speed Limit |
| **8** | Speed limit (120km/h) | 17 | 1 | Speed Limit |
| **9** | No passing | 22 | 4 | Prohibitory |
| **10** | No passing for heavy vehicles | 32 | 11 | Prohibitory |
| **11** | Right-of-way at intersection | 20 | 0 | Mandatory / Priority |
| **12** | Priority road | 42 | 22 | Mandatory / Priority |
| **13** | Yield | 29 | 0 | Mandatory / Priority |
| **14** | Stop | 11 | 0 | Mandatory / Priority |
| **15** | No vehicles | 4 | 4 | Prohibitory |
| **16** | Heavy vehicles prohibited | 5 | 7 | Prohibitory |
| **17** | No entry | 7 | 3 | Prohibitory |
| **18** | General caution | 17 | 10 | Danger |
| **19** | Dangerous curve left | 2 | 7 | Danger |
| **20** | Dangerous curve right | 3 | 0 | Danger |
| **21** | Double curve | 3 | 5 | Danger |
| **22** | Bumpy road | 3 | 1 | Danger |
| **23** | Slippery road | 7 | 10 | Danger |
| **24** | Road narrows right | **0** | 2 | Danger (Zero Train Instances) |
| **25** | Road work | 11 | 1 | Danger |
| **26** | Traffic signals | 7 | 5 | Danger |
| **27** | Pedestrians | 2 | 3 | Danger |
| **28** | Children crossing | 4 | 3 | Danger |
| **29** | Bicycles crossing | 2 | 5 | Danger |
| **30** | Beware of ice/snow | 8 | 1 | Danger |
| **31** | Wild animals crossing | **0** | 1 | Danger (Zero Train Instances) |
| **32** | End of speed and passing limits | 2 | 31 | Other |
| **33** | Turn right ahead | 7 | 2 | Mandatory |
| **34** | Turn left ahead | 5 | 37 | Mandatory |
| **35** | Ahead only | 12 | 3 | Mandatory |
| **36** | Go straight or right | 1 | 1 | Mandatory |
| **37** | Go straight or left | **0** | 4 | Mandatory (Zero Train Instances) |
| **38** | Keep right | 45 | 16 | Mandatory |
| **39** | Keep left | 2 | 2 | Mandatory |
| **40** | Roundabout mandatory | 4 | 3 | Mandatory |
| **41** | End of no passing | 3 | 10 | Prohibitory |
| **42** | End of no passing for heavy vehicles | 4 | 9 | Prohibitory |

---

## 💻 Google Colab GPU Model Training

You can train the model on Google Colab GPU (T4/V100) using the included notebook:
1. Open [`Traffic_Sign_Recognition_GTSDB.ipynb`](./Traffic_Sign_Recognition_GTSDB.ipynb) in Google Colab.
2. Select **Runtime** -> **Change runtime type** -> **GPU (T4)**.
3. Upload `GTSDB_Train_and_Test.zip` or mount Google Drive.
4. Run all cells to train `yolov8n.pt` for 50 epochs with GPU acceleration.
5. Download `best.onnx` and `model_metrics.json` and replace the existing files in `models/`.

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

## ⚡ Quick Start & Local Execution

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
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

```bash
# Build container
docker build -t gtsdb-app .

# Run container
docker run -p 8000:8000 gtsdb-app
```

---

## 📜 Author & License

Authored and maintained by **Nathenael Ermias**.  
Dataset provided by **German Traffic Sign Detection Benchmark (GTSDB)**.
