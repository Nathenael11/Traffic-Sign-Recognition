import os
import io
import json
import time
import zipfile
import csv
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, Query, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
import numpy as np

from onnx_detector import GTSDBDetector, CLASS_NAMES

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(PROJECT_DIR, "models", "best.onnx")
METRICS_PATH = os.path.join(PROJECT_DIR, "models", "model_metrics.json")
FRONTEND_DIST_DIR = os.path.join(PROJECT_DIR, "frontend", "dist")

app = FastAPI(
    title="GTSDB Traffic Sign Recognition API",
    description="Production-ready Object Detection API built with FastAPI and ONNX Runtime",
    version="1.0.0"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Detector instance
detector = GTSDBDetector(model_path=MODEL_PATH)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "GTSDB Traffic Sign Recognition API",
        "onnx_model_loaded": detector.session is not None,
        "author": "Nathenael Ermias"
    }

@app.get("/api/info")
def get_model_info():
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, "r") as f:
            metrics_data = json.load(f)
    else:
        metrics_data = {
            "author": "Nathenael Ermias",
            "dataset": "GTSDB (German Traffic Sign Detection Benchmark)",
            "model_architecture": "YOLOv8n",
            "map50": 0.03,
            "map50_95": 0.0235,
            "precision": 0.0108,
            "recall": 0.3393,
            "latency_ms": 18.5,
            "fps": 54.0,
            "onnx_exported": True,
            "tflite_exported": True,
            "class_count": len(CLASS_NAMES),
            "classes": CLASS_NAMES,
            "per_class_metrics": {}
        }
    return metrics_data

@app.post("/api/predict")
async def predict_single_image(
    file: UploadFile = File(...),
    confidence: float = Query(0.15, ge=0.0, le=1.0)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a valid image (JPEG, PNG, WEBP).")

    try:
        contents = await file.read()
        if len(contents) > 20 * 1024 * 1024: # 20MB limit
            raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 20MB.")

        image = Image.open(io.BytesIO(contents))
        result = detector.predict(image, conf_thresh=confidence)
        result["filename"] = file.filename
        return result
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Corrupted or invalid image format.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.post("/api/predict/batch")
async def predict_batch_images(
    files: List[UploadFile] = File(None),
    zip_file: UploadFile = File(None),
    confidence: float = Query(0.15, ge=0.0, le=1.0)
):
    results_list = []
    t_start = time.perf_counter()

    if zip_file and zip_file.filename.endswith(".zip"):
        try:
            contents = await zip_file.read()
            with zipfile.ZipFile(io.BytesIO(contents)) as z:
                for fname in z.namelist():
                    if fname.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')) and not fname.startswith('__MACOSX'):
                        img_bytes = z.read(fname)
                        try:
                            img = Image.open(io.BytesIO(img_bytes))
                            res = detector.predict(img, conf_thresh=confidence)
                            res["filename"] = os.path.basename(fname)
                            results_list.append(res)
                        except Exception:
                            continue
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid ZIP file: {str(e)}")
    elif files:
        for f in files:
            if f.content_type.startswith("image/"):
                contents = await f.read()
                try:
                    img = Image.open(io.BytesIO(contents))
                    res = detector.predict(img, conf_thresh=confidence)
                    res["filename"] = f.filename
                    results_list.append(res)
                except Exception:
                    continue

    if not results_list:
        raise HTTPException(status_code=400, detail="No valid images found for batch processing.")

    t_end = time.perf_counter()
    total_batch_time_ms = round((t_end - t_start) * 1000, 2)
    avg_latency = round(total_batch_time_ms / max(len(results_list), 1), 2)
    overall_fps = round(1000.0 / max(avg_latency, 0.1), 2)

    return {
        "processed_count": len(results_list),
        "total_batch_latency_ms": total_batch_time_ms,
        "avg_latency_ms": avg_latency,
        "overall_fps": overall_fps,
        "results": results_list
    }

@app.post("/api/predict/frame")
async def predict_frame(
    file: UploadFile = File(...),
    confidence: float = Query(0.15, ge=0.0, le=1.0)
):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        result = detector.predict(image, conf_thresh=confidence)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Frame inference error: {str(e)}")

@app.post("/api/batch/download")
async def download_batch_results(
    results_json: str = Form(...)
):
    try:
        results_data = json.loads(results_json)
        zip_buffer = io.BytesIO()

        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as z:
            csv_buffer = io.StringIO()
            writer = csv.writer(csv_buffer)
            writer.writerow(["Filename", "Sign_Count", "Class_Name", "Confidence", "BBox_X", "BBox_Y", "BBox_W", "BBox_H"])

            for idx, item in enumerate(results_data):
                fname = item.get("filename", f"image_{idx}.jpg")
                base_name, _ = os.path.splitext(fname)
                
                # Write CSV rows
                if item.get("detections"):
                    for det in item["detections"]:
                        writer.writerow([
                            fname,
                            item["count"],
                            det["class_name"],
                            det["confidence"],
                            det["bbox"][0],
                            det["bbox"][1],
                            det["bbox"][2],
                            det["bbox"][3]
                        ])
                else:
                    writer.writerow([fname, 0, "No Detections", 0.0, 0, 0, 0, 0])

                # Save base64 annotated image to ZIP
                data_uri = item.get("annotated_image", "")
                if data_uri.startswith("data:image/jpeg;base64,"):
                    b64_data = data_uri.replace("data:image/jpeg;base64,", "")
                    img_bytes = base64.b64decode(b64_data)
                    z.writestr(f"annotated_{base_name}.jpg", img_bytes)

            z.writestr("detections_summary.csv", csv_buffer.getvalue())

        zip_buffer.seek(0)
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={"Content-Disposition": "attachment; filename=GTSDB_Detections_Results.zip"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate download ZIP: {str(e)}")

# Mount static frontend build
if os.path.exists(FRONTEND_DIST_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST_DIR, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
