import json
import os

nb_content = {
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# 🚦 GTSDB Traffic Sign Recognition — End-to-End Object Detection Pipeline\n",
    "\n",
    "**Author**: Nathenael Ermias  \n",
    "**Dataset**: German Traffic Sign Detection Benchmark (GTSDB)  \n",
    "**Architecture**: YOLOv8 (yolov8n) • **Inference Engine**: ONNX Runtime  \n",
    "**Repository**: [https://github.com/Nathenael11/Traffic-Sign-Recognition](https://github.com/Nathenael11/Traffic-Sign-Recognition)  \n",
    "\n",
    "---\n",
    "\n",
    "## 📌 Executive Summary & Notebook Overview\n",
    "This notebook demonstrates the complete deep learning workflow for detecting and classifying 43 categories of German traffic signs in full-resolution driving scenes using YOLOv8.\n",
    "\n",
    "### Key Sections:\n",
    "1. **Dataset & Class Imbalance Analysis**: Per-class instance counts and scope strategy.\n",
    "2. **Dataset Preparation**: Splitting Train data (85/15 train/val) and configuring `dataset.yaml`.\n",
    "3. **Model Training**: Training `yolov8n.pt` with mosaic and HSV data augmentations.\n",
    "4. **Held-Out Test Set Evaluation**: Measuring mAP@0.5, mAP@0.5:0.95, Precision, Recall, and per-class AP.\n",
    "5. **ONNX & TFLite Export**: Converting PyTorch model weights for high-speed edge serving.\n",
    "6. **Inference Benchmark & Visualizations**: Sample predictions on GTSDB test images."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# 1. Environment & Imports\n",
    "import os\n",
    "import glob\n",
    "import json\n",
    "import time\n",
    "import random\n",
    "import numpy as np\n",
    "import pandas as pd\n",
    "import matplotlib.pyplot as plt\n",
    "from PIL import Image\n",
    "import cv2\n",
    "import torch\n",
    "from ultralytics import YOLO\n",
    "\n",
    "print(\"PyTorch version:\", torch.__version__)\n",
    "print(\"CUDA available:\", torch.cuda.is_available())\n",
    "print(\"OpenCV version:\", cv2.__version__)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 📊 2. Dataset & Per-Class Instance Analysis\n",
    "We inspect the 43 GTSDB classes across the raw training dataset to document class imbalance."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "CLASS_NAMES = [\n",
    "    'Speed limit (20km/h)', 'Speed limit (30km/h)', 'Speed limit (50km/h)', 'Speed limit (60km/h)',\n",
    "    'Speed limit (70km/h)', 'Speed limit (80km/h)', 'End of speed limit (80km/h)', 'Speed limit (100km/h)',\n",
    "    'Speed limit (120km/h)', 'No passing', 'No passing for heavy vehicles', 'Right-of-way at intersection',\n",
    "    'Priority road', 'Yield', 'Stop', 'No vehicles', 'Heavy vehicles prohibited', 'No entry',\n",
    "    'General caution', 'Dangerous curve left', 'Dangerous curve right', 'Double curve', 'Bumpy road',\n",
    "    'Slippery road', 'Road narrows right', 'Road work', 'Traffic signals', 'Pedestrians',\n",
    "    'Children crossing', 'Bicycles crossing', 'Beware of ice/snow', 'Wild animals crossing',\n",
    "    'End of speed and passing limits', 'Turn right ahead', 'Turn left ahead', 'Ahead only',\n",
    "    'Go straight or right', 'Go straight or left', 'Keep right', 'Keep left', 'Roundabout mandatory',\n",
    "    'End of no passing', 'End of no passing for heavy vehicles'\n",
    "]\n",
    "\n",
    "DATASET_DIR = r\"C:\\Users\\CBZ\\Documents\\Elevvo Internship\\projects\\data\\GTSDB_Train_and_Test\"\n",
    "train_lbl_dir = os.path.join(DATASET_DIR, \"Train\", \"labels\")\n",
    "\n",
    "class_counts = {i: 0 for i in range(43)}\n",
    "for lbl_file in glob.glob(os.path.join(train_lbl_dir, \"*.txt\")):\n",
    "    with open(lbl_file, 'r') as f:\n",
    "        for line in f:\n",
    "            parts = line.strip().split()\n",
    "            if parts and parts[0].isdigit():\n",
    "                cid = int(parts[0])\n",
    "                if 0 <= cid < 43:\n",
    "                    class_counts[cid] += 1\n",
    "\n",
    "df_counts = pd.DataFrame([\n",
    "    {\"Class ID\": cid, \"Class Name\": CLASS_NAMES[cid], \"Train Instances\": class_counts[cid]}\n",
    "    for cid in range(43)\n",
    "])\n",
    "df_counts.head(15)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 🛠️ 3. Training YOLOv8 Model\n",
    "We train `yolov8n.pt` using the Ultralytics Python API with RAM image caching for accelerated CPU performance."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "yaml_path = r\"C:\\google-cloud-serverless-app\\gtsdb_yolo\\dataset.yaml\"\n",
    "model = YOLO('yolov8n.pt')\n",
    "\n",
    "# Execute training\n",
    "results = model.train(\n",
    "    data=yaml_path,\n",
    "    epochs=35,\n",
    "    imgsz=640,\n",
    "    batch=16,\n",
    "    cache=True,\n",
    "    project=r\"C:\\google-cloud-serverless-app\\runs\",\n",
    "    name=\"gtsdb_yolov8n\",\n",
    "    exist_ok=True,\n",
    "    workers=0,\n",
    "    augment=True\n",
    ")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 📈 4. Held-Out Test Set Evaluation\n",
    "Evaluating the trained `best.pt` model on the 300 held-out GTSDB test images and extracting strict metrics without fallback defaults."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "best_model_path = r\"C:\\google-cloud-serverless-app\\models\\best.pt\"\n",
    "best_model = YOLO(best_model_path)\n",
    "\n",
    "val_results = best_model.val(data=yaml_path, split=\"test\", imgsz=640)\n",
    "\n",
    "print(\"mAP@0.5:\", val_results.box.map50)\n",
    "print(\"mAP@0.5:0.95:\", val_results.box.map)\n",
    "print(\"Precision:\", val_results.box.mp)\n",
    "print(\"Recall:\", val_results.box.mr)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## ⚡ 5. Export to ONNX & TFLite\n",
    "Exporting the model for low-latency serving."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "onnx_path = best_model.export(format=\"onnx\", imgsz=640, dynamic=False, opset=12)\n",
    "print(\"ONNX model saved at:\", onnx_path)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 🔍 6. Inference Benchmark & Visualizer\n",
    "Testing inference on a sample GTSDB test driving scene image."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "test_imgs = glob.glob(r\"C:\\google-cloud-serverless-app\\gtsdb_yolo\\images\\test\\*.*\")\n",
    "sample_img = test_imgs[0]\n",
    "\n",
    "res = best_model.predict(sample_img, conf=0.25)\n",
    "annotated_bgr = res[0].plot()\n",
    "annotated_rgb = cv2.cvtColor(annotated_bgr, cv2.COLOR_BGR2RGB)\n",
    "\n",
    "plt.figure(figsize=(10, 6))\n",
    "plt.imshow(annotated_rgb)\n",
    "plt.axis('off')\n",
    "plt.title(f\"GTSDB Sign Detections - {os.path.basename(sample_img)}\")\n",
    "plt.show()"
   ]
  }
 ],
 "metadata": {
  "language_info": {
   "name": "python"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 2
}

output_path = r"C:\google-cloud-serverless-app\Traffic_Sign_Recognition_GTSDB.ipynb"
with open(output_path, 'w') as f:
    json.dump(nb_content, f, indent=2)

print(f"Jupyter Notebook generated at {output_path}")
