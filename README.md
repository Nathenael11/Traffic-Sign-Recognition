# Real-Time Traffic Sign Recognition (GTSDB)

Live Web Demo: **[traffic-sign-recognition-b6cv.onrender.com](https://traffic-sign-recognition-b6cv.onrender.com)**  
GitHub Repository: **[github.com/Nathenael11/Traffic-Sign-Recognition](https://github.com/Nathenael11/Traffic-Sign-Recognition)**  

Developed by **Nathenael Ermias**  
📧 Email: [nathnaelermais@gamil.com](mailto:nathnaelermais@gamil.com)  
🔗 LinkedIn: [Nathenael Ermias](https://www.linkedin.com/in/nathenael-ermias-753746428)  

---

## Overview

This project is an end-to-end computer vision web application built to detect and classify traffic signs in full driving scenes using the German Traffic Sign Detection Benchmark (GTSDB).

Instead of operating on pre-cropped traffic sign icons, the model processes high-resolution driving images, locates small signs within cluttered background environments, and predicts their category across 43 classes.

To achieve real-time performance on standard hardware, the trained YOLOv8 model is exported to **ONNX** format and served via **ONNX Runtime** with a lightweight FastAPI backend and a Vite/React dashboard.

---

## Key Features

- **Single Image Scan**: Drag and drop any driving scene image to view detected sign bounding boxes, confidence scores, and class labels.
- **Adjustable Confidence Threshold**: Slide confidence filtering live (0.0 to 1.0) to observe model precision vs recall trade-offs.
- **Batch Processing & CSV Export**: Upload multiple images or `.zip` archives. Process all scenes in bulk and download annotated images alongside a structured `detections_summary.csv`.
- **Live Browser Webcam Scan**: Real-time traffic sign detection directly from your webcam stream with an active FPS counter.
- **Model Specs & Class Distribution**: Transparent per-class dataset distribution and test set metrics viewable directly within the application.

---

## Tech Stack & Architecture

- **Model & Training**: PyTorch, Ultralytics YOLOv8n, Google Colab GPU (T4).
- **Inference Engine**: ONNX Runtime (CPU execution optimized for containerized deployment).
- **Backend API**: Python 3.11, FastAPI, Uvicorn, OpenCV.
- **Frontend Dashboard**: React 18, Vite, Tailwind CSS / Custom Glassmorphism styling.
- **Deployment**: Docker multi-stage build running on Render Web Services.

---

## Dataset & Per-Class Instance Breakdown

The dataset consists of **600 training images** (506 containing sign objects, 94 background scenes) and **300 held-out test images**.

### Class Imbalance & Transparency Note
The GTSDB benchmark exhibits significant real-world class imbalance. High-frequency signs like *Priority Road* or *Speed Limit 30/50* have 30–45 training examples, whereas rare signs like *Road narrows right*, *Wild animals crossing*, and *Go straight or left* have 0 training examples in the benchmark split.

| Class ID | Class Name | Train Instances | Test Instances | Category |
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
| **11** | Right-of-way at intersection | 20 | 0 | Priority |
| **12** | Priority road | 42 | 22 | Priority |
| **13** | Yield | 29 | 0 | Priority |
| **14** | Stop | 11 | 0 | Priority |
| **15** | No vehicles | 4 | 4 | Prohibitory |
| **16** | Heavy vehicles prohibited | 5 | 7 | Prohibitory |
| **17** | No entry | 7 | 3 | Prohibitory |
| **18** | General caution | 17 | 10 | Warning |
| **19** | Dangerous curve left | 2 | 7 | Warning |
| **20** | Dangerous curve right | 3 | 0 | Warning |
| **21** | Double curve | 3 | 5 | Warning |
| **22** | Bumpy road | 3 | 1 | Warning |
| **23** | Slippery road | 7 | 10 | Warning |
| **24** | Road narrows right | 0 | 2 | Warning (Zero Train Examples) |
| **25** | Road work | 11 | 1 | Warning |
| **26** | Traffic signals | 7 | 5 | Warning |
| **27** | Pedestrians | 2 | 3 | Warning |
| **28** | Children crossing | 4 | 3 | Warning |
| **29** | Bicycles crossing | 2 | 5 | Warning |
| **30** | Beware of ice/snow | 8 | 1 | Warning |
| **31** | Wild animals crossing | 0 | 1 | Warning (Zero Train Examples) |
| **32** | End of speed and passing limits | 2 | 31 | Mandatory |
| **33** | Turn right ahead | 7 | 2 | Mandatory |
| **34** | Turn left ahead | 5 | 37 | Mandatory |
| **35** | Ahead only | 12 | 3 | Mandatory |
| **36** | Go straight or right | 1 | 1 | Mandatory |
| **37** | Go straight or left | 0 | 4 | Mandatory (Zero Train Examples) |
| **38** | Keep right | 45 | 16 | Mandatory |
| **39** | Keep left | 2 | 2 | Mandatory |
| **40** | Roundabout mandatory | 4 | 3 | Mandatory |
| **41** | End of no passing | 3 | 10 | Prohibitory |
| **42** | End of no passing for heavy vehicles | 4 | 9 | Prohibitory |







## Local Setup & Development

### 1. Backend Setup (FastAPI + ONNX Runtime)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

The application will be accessible at `http://localhost:8000`.

---

## Contact

**Nathenael Ermias**  
- Email: [nathnaelermais@gamil.com](mailto:nathnaelermais@gamil.com)  
- LinkedIn: [linkedin.com/in/nathenael-ermias-753746428](https://www.linkedin.com/in/nathenael-ermias-753746428)  
- GitHub: [github.com/Nathenael11](https://github.com/Nathenael11)
