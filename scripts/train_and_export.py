import os
import shutil
import glob
import random
import json
import time
import torch
import numpy as np

# Absolute paths
RAW_DATA_DIR = r"C:\Users\CBZ\Documents\Elevvo Internship\projects\data\GTSDB_Train_and_Test"
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

def prepare_yolo_dataset():
    print("--> Preparing YOLO dataset structure...")
    train_img_dir = os.path.join(RAW_DATA_DIR, "Train", "images")
    train_lbl_dir = os.path.join(RAW_DATA_DIR, "Train", "labels")
    test_img_dir = os.path.join(RAW_DATA_DIR, "Test", "images")
    test_lbl_dir = os.path.join(RAW_DATA_DIR, "Test", "labels")

    target_dirs = {
        'train_img': os.path.join(YOLO_DATA_DIR, "images", "train"),
        'train_lbl': os.path.join(YOLO_DATA_DIR, "labels", "train"),
        'val_img': os.path.join(YOLO_DATA_DIR, "images", "val"),
        'val_lbl': os.path.join(YOLO_DATA_DIR, "labels", "val"),
        'test_img': os.path.join(YOLO_DATA_DIR, "images", "test"),
        'test_lbl': os.path.join(YOLO_DATA_DIR, "labels", "test"),
    }
    for d in target_dirs.values():
        os.makedirs(d, exist_ok=True)

    all_train_imgs = glob.glob(os.path.join(train_img_dir, "*.*"))
    random.seed(42)
    random.shuffle(all_train_imgs)

    split_idx = int(len(all_train_imgs) * 0.85)
    train_files = all_train_imgs[:split_idx]
    val_files = all_train_imgs[split_idx:]

    def copy_and_clean_files(file_list, dst_img, dst_lbl, src_lbl_dir):
        for img_path in file_list:
            base_name = os.path.basename(img_path)
            stem, _ = os.path.splitext(base_name)
            shutil.copy2(img_path, os.path.join(dst_img, base_name))
            
            lbl_src = os.path.join(src_lbl_dir, f"{stem}.txt")
            if os.path.exists(lbl_src):
                clean_lines = []
                with open(lbl_src, 'r') as f:
                    for line in f:
                        parts = line.strip().split()
                        if parts and parts[0].isdigit():
                            cid = int(parts[0])
                            if 0 <= cid < 43:
                                clean_lines.append(line.strip())
                
                with open(os.path.join(dst_lbl, f"{stem}.txt"), 'w') as f:
                    f.write('\n'.join(clean_lines) + '\n' if clean_lines else '')

    print(f"Copying {len(train_files)} train images...")
    copy_and_clean_files(train_files, target_dirs['train_img'], target_dirs['train_lbl'], train_lbl_dir)
    print(f"Copying {len(val_files)} val images...")
    copy_and_clean_files(val_files, target_dirs['val_img'], target_dirs['val_lbl'], train_lbl_dir)

    all_test_imgs = glob.glob(os.path.join(test_img_dir, "*.*"))
    print(f"Copying {len(all_test_imgs)} test images...")
    copy_and_clean_files(all_test_imgs, target_dirs['test_img'], target_dirs['test_lbl'], test_lbl_dir)

    yaml_path = os.path.join(YOLO_DATA_DIR, "dataset.yaml")
    yaml_content = f"""path: {YOLO_DATA_DIR.replace('\\', '/')}
train: images/train
val: images/val
test: images/test

names:
"""
    for idx, name in enumerate(CLASS_NAMES):
        yaml_content += f"  {idx}: '{name}'\n"

    with open(yaml_path, 'w') as f:
        f.write(yaml_content)
    print(f"Saved dataset.yaml to {yaml_path}")
    return yaml_path

def train_and_eval():
    yaml_path = prepare_yolo_dataset()
    
    from ultralytics import YOLO

    print("--> Initializing YOLOv8n model...")
    model = YOLO('yolov8n.pt')

    print("--> Starting 12-epoch training on GTSDB dataset (imgsz=416, batch=32, cache=True)...")
    results = model.train(
        data=yaml_path,
        epochs=12,
        imgsz=416,
        batch=32,
        cache=True,
        project=os.path.join(PROJECT_DIR, "runs"),
        name="gtsdb_yolov8n",
        exist_ok=True,
        workers=0,
        augment=True,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=10.0,
        translate=0.1,
        scale=0.5,
        mosaic=1.0
    )

    best_pt_path = os.path.join(PROJECT_DIR, "runs", "gtsdb_yolov8n", "weights", "best.pt")
    if not os.path.exists(best_pt_path):
        best_pt_path = model.trainer.best

    print(f"Best model saved at: {best_pt_path}")
    shutil.copy2(best_pt_path, os.path.join(MODEL_DIR, "best.pt"))

    print("--> Evaluating trained model on held-out TEST dataset at imgsz=640...")
    best_model = YOLO(os.path.join(MODEL_DIR, "best.pt"))
    val_results = best_model.val(data=yaml_path, split="test", imgsz=640)

    # STRICT METRIC EXTRACTION - NO FALLBACK DEFAULTS
    if not hasattr(val_results, 'box') or val_results.box is None:
        raise RuntimeError("Validation results object does not contain box metrics!")

    map50 = float(val_results.box.map50)
    map50_95 = float(val_results.box.map)
    precision = float(val_results.box.mp)
    recall = float(val_results.box.mr)

    # Per-class metrics
    per_class_metrics = {}
    maps_array = val_results.box.maps
    for idx in range(len(CLASS_NAMES)):
        cname = CLASS_NAMES[idx]
        cmap = float(maps_array[idx]) if idx < len(maps_array) else 0.0
        per_class_metrics[idx] = {
            "name": cname,
            "mAP50": round(cmap, 4)
        }

    # Speed benchmark using real ONNX Runtime engine
    print("--> Exporting to ONNX format...")
    onnx_file = best_model.export(format="onnx", imgsz=640, dynamic=False, opset=12)
    final_onnx_path = os.path.join(MODEL_DIR, "best.onnx")
    if os.path.abspath(onnx_file) != os.path.abspath(final_onnx_path):
        shutil.copy2(onnx_file, final_onnx_path)
    print(f"ONNX model saved at {final_onnx_path}")

    # Export to TFLite (bonus requirement)
    tflite_exported = False
    try:
        print("--> Exporting to TFLite format...")
        tflite_file = best_model.export(format="tflite", imgsz=640)
        final_tflite_path = os.path.join(MODEL_DIR, "best.tflite")
        if os.path.abspath(tflite_file) != os.path.abspath(final_tflite_path):
            shutil.copy2(tflite_file, final_tflite_path)
        tflite_exported = True
        print(f"TFLite model saved at {final_tflite_path}")
    except Exception as e:
        print(f"TFLite export note: {e}")

    # Real ONNX Runtime latency measurement
    import onnxruntime as ort
    session = ort.InferenceSession(final_onnx_path, providers=['CPUExecutionProvider'])
    input_name = session.get_inputs()[0].name
    dummy_input = np.random.randn(1, 3, 640, 640).astype(np.float32)

    # Warmup
    for _ in range(5):
        session.run(None, {input_name: dummy_input})
    
    t0 = time.perf_counter()
    num_runs = 30
    for _ in range(num_runs):
        session.run(None, {input_name: dummy_input})
    t1 = time.perf_counter()

    avg_latency_ms = round(((t1 - t0) / num_runs) * 1000, 2)
    fps = round(1000.0 / max(avg_latency_ms, 0.1), 2)

    # Save metrics JSON
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
        "onnx_exported": True,
        "tflite_exported": tflite_exported,
        "class_count": len(CLASS_NAMES),
        "classes": CLASS_NAMES,
        "per_class_metrics": per_class_metrics
    }

    metrics_path = os.path.join(MODEL_DIR, "model_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics_data, f, indent=2)

    print("\n================ RAW MEASURED RESULTS ================")
    print(f"Author:      Nathenael Ermias")
    print(f"mAP@0.5:     {map50:.4f}")
    print(f"mAP@0.5:0.95:{map50_95:.4f}")
    print(f"Precision:   {precision:.4f}")
    print(f"Recall:      {recall:.4f}")
    print(f"ONNX Latency:{avg_latency_ms} ms")
    print(f"ONNX FPS:    {fps}")
    print(f"Metrics saved to {metrics_path}")

if __name__ == "__main__":
    train_and_eval()
