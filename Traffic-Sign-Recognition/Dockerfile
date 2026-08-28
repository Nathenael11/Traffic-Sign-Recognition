# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend Server
FROM python:3.11-slim
WORKDIR /app

# Install system libraries for OpenCV and ONNX Runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy application files, trained ONNX model, and compiled static frontend
COPY backend/ ./backend/
COPY models/ ./models/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

WORKDIR /app/backend

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
