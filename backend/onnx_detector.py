import os
import time
import base64
import io
import json
import numpy as np
import cv2
from PIL import Image

try:
    import onnxruntime as ort
except ImportError:
    ort = None

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

# Color palette for 43 classes (RGB/BGR format for OpenCV)
np.random.seed(42)
CLASS_COLORS = np.random.randint(50, 255, size=(len(CLASS_NAMES), 3), dtype=np.uint8).tolist()

class GTSDBDetector:
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.session = None
        self.input_name = None
        self.output_names = None
        self.img_size = 640
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path):
            print(f"[WARN] Model path {self.model_path} does not exist.")
            return
        if ort is None:
            print("[WARN] ONNX Runtime is not installed.")
            return

        providers = ['CPUExecutionProvider']
        if 'CUDAExecutionProvider' in ort.get_available_providers():
            providers.insert(0, 'CUDAExecutionProvider')

        opts = ort.SessionOptions()
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        self.session = ort.InferenceSession(self.model_path, opts, providers=providers)
        self.input_name = self.session.get_inputs()[0].name
        self.output_names = [o.name for o in self.session.get_outputs()]
        print(f"[INFO] ONNX Session initialized from {self.model_path}")

    def letterbox(self, img, new_shape=(640, 640), color=(114, 114, 114)):
        shape = img.shape[:2] # [height, width]
        if isinstance(new_shape, int):
            new_shape = (new_shape, new_shape)

        r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])
        new_unpad = (int(round(shape[1] * r)), int(round(shape[0] * r)))
        dw, dh = new_shape[1] - new_unpad[0], new_shape[0] - new_unpad[1]
        dw /= 2
        dh /= 2

        if shape[::-1] != new_unpad:
            img = cv2.resize(img, new_unpad, interpolation=cv2.INTER_LINEAR)
        
        top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
        left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
        img = cv2.copyMakeBorder(img, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color)
        return img, r, (dw, dh)

    def predict(self, img_input, conf_thresh: float = 0.15, iou_thresh: float = 0.45):
        if self.session is None:
            self._load_model()
            if self.session is None:
                raise RuntimeError("ONNX model session not initialized. Train and export best.onnx first.")

        # Convert input to BGR numpy array
        if isinstance(img_input, str):
            orig_bgr = cv2.imread(img_input)
            if orig_bgr is None:
                raise ValueError(f"Could not read image from path: {img_input}")
        elif isinstance(img_input, Image.Image):
            orig_bgr = cv2.cvtColor(np.array(img_input), cv2.COLOR_RGB2BGR)
        elif isinstance(img_input, np.ndarray):
            if len(img_input.shape) == 2:
                orig_bgr = cv2.cvtColor(img_input, cv2.COLOR_GRAY2BGR)
            elif img_input.shape[2] == 4:
                orig_bgr = cv2.cvtColor(img_input, cv2.COLOR_RGBA2BGR)
            else:
                orig_bgr = img_input.copy()
        else:
            raise ValueError("Invalid image input type.")

        orig_h, orig_w = orig_bgr.shape[:2]

        t_start = time.perf_counter()

        # Preprocess: Letterbox padding to 640x640
        padded_img, ratio, (dw, dh) = self.letterbox(orig_bgr, (self.img_size, self.img_size))
        rgb_img = cv2.cvtColor(padded_img, cv2.COLOR_BGR2RGB)
        input_tensor = rgb_img.astype(np.float32) / 255.0
        input_tensor = np.transpose(input_tensor, (2, 0, 1)) # HWC to CHW
        input_tensor = np.expand_dims(input_tensor, axis=0) # (1, 3, 640, 640)

        # Measure pure ONNX model inference execution time
        t_onnx_0 = time.perf_counter()
        outputs = self.session.run(self.output_names, {self.input_name: input_tensor})
        t_onnx_1 = time.perf_counter()
        onnx_latency_ms = round((t_onnx_1 - t_onnx_0) * 1000, 2)

        predictions = outputs[0] # Shape (1, 47, 8400) or (1, 8400, 47)
        if len(predictions.shape) == 3:
            predictions = predictions[0]
            if predictions.shape[0] < predictions.shape[1]:
                predictions = predictions.T # Shape (8400, 47)

        boxes = []
        confidences = []
        class_ids = []

        for row in predictions:
            cx, cy, w, h = row[:4]
            scores = row[4:]
            
            # Apply sigmoid if scores are raw logits
            if np.max(scores) > 1.0 or np.min(scores) < 0.0:
                scores = 1.0 / (1.0 + np.exp(-scores))

            max_class_id = int(np.argmax(scores))
            max_score = float(scores[max_class_id])

            if max_score >= conf_thresh:
                x1_pad = cx - w / 2
                y1_pad = cy - h / 2
                
                # Unpad and scale back to original image space
                x1 = int(round((x1_pad - dw) / ratio))
                y1 = int(round((y1_pad - dh) / ratio))
                box_w = int(round(w / ratio))
                box_h = int(round(h / ratio))

                x1 = max(0, min(orig_w - 1, x1))
                y1 = max(0, min(orig_h - 1, y1))
                box_w = min(orig_w - x1, max(1, box_w))
                box_h = min(orig_h - y1, max(1, box_h))

                boxes.append([x1, y1, box_w, box_h])
                confidences.append(max_score)
                class_ids.append(max_class_id)

        # Apply NMS
        indices = []
        if len(boxes) > 0:
            indices = cv2.dnn.NMSBoxes(boxes, confidences, conf_thresh, iou_thresh)
            if isinstance(indices, tuple) or isinstance(indices, np.ndarray):
                indices = indices.flatten()

        t_end = time.perf_counter()
        total_latency_ms = round((t_end - t_start) * 1000, 2)
        fps = round(1000.0 / max(total_latency_ms, 0.1), 2)

        detections = []
        annotated_img = orig_bgr.copy()

        for idx in indices:
            box = boxes[idx]
            conf = confidences[idx]
            cid = class_ids[idx]
            cname = CLASS_NAMES[cid] if cid < len(CLASS_NAMES) else f"Class {cid}"

            x, y, w, h = box
            detections.append({
                "class_id": cid,
                "class_name": cname,
                "confidence": round(float(conf), 4),
                "confidence_percent": f"{round(float(conf) * 100, 1)}%",
                "bbox": [x, y, w, h],
                "box_pascal": [x, y, x + w, y + h]
            })

            # Draw bounding box on annotated image
            color = CLASS_COLORS[cid % len(CLASS_COLORS)]
            color_tuple = (int(color[0]), int(color[1]), int(color[2]))
            thickness = max(2, int(round(min(orig_w, orig_h) / 350)))
            cv2.rectangle(annotated_img, (x, y), (x + w, y + h), color_tuple, thickness)

            label_text = f"{cname}: {round(conf * 100, 1)}%"
            font_scale = max(0.55, min(orig_w, orig_h) / 900)
            font_thickness = max(1, int(font_scale * 2))
            
            (text_w, text_h), baseline = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, font_thickness)
            cv2.rectangle(annotated_img, (x, max(0, y - text_h - baseline - 4)), (x + text_w + 4, y), color_tuple, -1)
            cv2.putText(annotated_img, label_text, (x + 2, max(text_h, y - baseline - 2)),
                        cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), font_thickness, cv2.LINE_AA)

        # Convert annotated BGR to Base64 JPEG
        _, buffer = cv2.imencode(".jpg", annotated_img, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        base64_str = base64.b64encode(buffer).decode("utf-8")
        data_uri = f"data:image/jpeg;base64,{base64_str}"

        return {
            "detections": detections,
            "count": len(detections),
            "onnx_latency_ms": onnx_latency_ms,
            "latency_ms": total_latency_ms,
            "fps": fps,
            "image_size": [orig_w, orig_h],
            "annotated_image": data_uri
        }
