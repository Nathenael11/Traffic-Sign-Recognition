import os
import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from main import app

client = TestClient(app)

def create_test_image():
    img = Image.new("RGB", (300, 300), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "author" in data
    assert data["author"] == "Nathenael Ermias"

def test_info_endpoint():
    response = client.get("/api/info")
    assert response.status_code == 200
    data = response.json()
    assert "map50" in data
    assert "fps" in data
    assert "classes" in data
    assert len(data["classes"]) == 43

def test_predict_single_image_success():
    img_buf = create_test_image()
    response = client.post(
        "/api/predict?confidence=0.25",
        files={"file": ("test.jpg", img_buf, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "detections" in data
    assert "latency_ms" in data
    assert "fps" in data
    assert "annotated_image" in data

def test_predict_invalid_file_type():
    invalid_file = io.BytesIO(b"Not an image file content")
    response = client.post(
        "/api/predict",
        files={"file": ("test.txt", invalid_file, "text/plain")}
    )
    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]

def test_predict_batch_images():
    img1 = create_test_image()
    img2 = create_test_image()
    response = client.post(
        "/api/predict/batch?confidence=0.3",
        files=[
            ("files", ("img1.jpg", img1, "image/jpeg")),
            ("files", ("img2.jpg", img2, "image/jpeg"))
        ]
    )
    assert response.status_code == 200
    data = response.json()
    assert data["processed_count"] == 2
    assert "results" in data

def test_predict_frame():
    img_buf = create_test_image()
    response = client.post(
        "/api/predict/frame?confidence=0.2",
        files={"file": ("frame.jpg", img_buf, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "detections" in data
    assert "fps" in data
