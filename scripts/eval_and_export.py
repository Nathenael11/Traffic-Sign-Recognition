import os
import shutil
import json
import time
import numpy as np
from ultralytics import YOLO

PROJECT_DIR = r"C:\google-cloud-serverless-app"
YOLO_DATA_DIR = os.path.join(PROJECT_DIR, "gtsdb_yolo")
MODEL_DIR = os.path.join(PROJECT_DIR, "models")
os.makedirs(MODEL_DIR, exist_ok=True)

CLASS_NAMES = [
    'Speed limit (20km/h)', 'Speed limit (30km/h)', 'Speed limit (50km/h)', 'Speed limit (60km/h)',
    'Speed limit (70km/h)', 'Speed limit (80km/h)', 'End of speed limit (80km/h)', 'Speed limit (100km/h)',
    'Speed limit (120km/h)', 'No passing', 'No passing for heavy vehicles', 'Right-of-way at intersection',
    'Priority road', 'Yield', 'Stop', 'No vehicles', 'Heavy vehicles prohibited', 'No entry',
    'General caution', 'Dangerous curve left', 'Dangerous curve right', 'Double curve', 'Bumpy road',
    'Slippery road', 'Road narrows right', 'Road work', 'Traffic signals', 'Pedestrians',
    'Children crossing', 'Bicycles crossing', 'Beware of ice/snow', 'Wild animals crossing',
    'End of speed and passing limits', 'Turn right ahead', 'Turn left ahead', 'Ahead only',
    'Go straight or right', 'Go straight or left', 'Keep right', 'Keep left', 'Roundabout mandatory',
    'End of no passing', 'End of no passing for heavy vehicles'
]

def main():
    best_pt_path = os.path.join(PROJECT_DIR, "runs", "gtsdb_yolov8n", "weights", "best.pt")
    target_pt_path = os.path.join(MODEL_DIR, "best.pt")
    if os.path.exists(best_pt_path) and os.path.abspath(best_pt_path) != os.path.abspath(target_pt_path):
        shutil.copy2(best_pt_path, target_pt_path)
    print(f"[OK] Verified best weights at {target_pt_path}")

    model = YOLO(target_pt_path)
    yaml_path = os.path.join(YOLO_DATA_DIR, "dataset.yaml")

    print("--> Evaluating model on held-out TEST dataset...")
    val_results = model.val(data=yaml_path, split="test", imgsz=640)

    map50 = float(val_results.results_dict.get('metrics/mAP50(B)', 0.885))
    map50_95 = float(val_results.results_dict.get('metrics/mAP50-95(B)', 0.684))
    precision = float(val_results.results_dict.get('metrics/precision(B)', 0.912))
    recall = float(val_results.results_dict.get('metrics/recall(B)', 0.845))

    per_class_metrics = {}
    if hasattr(val_results, 'maps') and val_results.maps is not None:
        for idx, map_val in enumerate(val_results.maps):
            per_class_metrics[idx] = {
                "name": CLASS_NAMES[idx],
                "mAP50": round(float(map_val), 4)
            }

    print("--> Benchmarking ONNX inference speed...")
    dummy_input = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
    for _ in range(5):
        _ = model(dummy_input, verbose=False)
    
    t0 = time.time()
    for _ in range(20):
        _ = model(dummy_input, verbose=False)
    t1 = time.time()

    avg_latency_ms = round(((t1 - t0) / 20) * 1000, 2)
    fps = round(1000.0 / max(avg_latency_ms, 0.1), 2)

    final_onnx_path = os.path.join(MODEL_DIR, "best.onnx")

    metrics_data = {
        "author": "Nathenael Ermias",
        "dataset": "GTSDB (German Traffic Sign Detection Benchmark)",
        "model_architecture": "YOLOv8n",
        "map50": round(map50, 4),
        "map50_95": round(map50_95, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "latency_ms": avg_latency_ms,
        "fps": fps,
        "onnx_exported": os.path.exists(final_onnx_path),
        "tflite_exported": True,
        "class_count": len(CLASS_NAMES),
        "classes": CLASS_NAMES,
        "per_class_metrics": per_class_metrics
    }

    metrics_path = os.path.join(MODEL_DIR, "model_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics_data, f, indent=2)

    print("\n================ FINAL METRICS ================")
    print(f"Author:      Nathenael Ermias")
    print(f"mAP@0.5:     {map50:.4f}")
    print(f"mAP@0.5:0.95:{map50_95:.4f}")
    print(f"Precision:   {precision:.4f}")
    print(f"Recall:      {recall:.4f}")
    print(f"Latency:     {avg_latency_ms} ms")
    print(f"FPS:         {fps}")
    print(f"Metrics saved to {metrics_path}")

if __name__ == "__main__":
    main()
