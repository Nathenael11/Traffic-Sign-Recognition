import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Upload, Layers, Info, CheckCircle2, AlertTriangle, 
  Download, RefreshCw, Zap, Sliders, Play, Square, FileArchive, Activity, SwitchCamera
} from 'lucide-react';
import confetti from 'canvas-confetti';

const API_BASE = '';

export default function App() {
  const [activeTab, setActiveTab] = useState('single'); // single, batch, camera, info
  const [confidence, setConfidence] = useState(0.25);
  const [modelInfo, setModelInfo] = useState(null);

  // Single Image State
  const [singleImage, setSingleImage] = useState(null);
  const [singleResult, setSingleResult] = useState(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleError, setSingleError] = useState(null);

  // Batch Processing State
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchResult, setBatchResult] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState(null);

  // Live Camera State (Defaults to 'environment' for Rear/Back camera on phones)
  const [cameraFacingMode, setCameraFacingMode] = useState('environment'); 
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameraFps, setCameraFps] = useState(0);
  const [cameraLatency, setCameraLatency] = useState(0);
  const [cameraDetections, setCameraDetections] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const isProcessingFrame = useRef(false);

  // Fetch model metadata on load
  useEffect(() => {
    fetch(`${API_BASE}/api/info`)
      .then(res => res.json())
      .then(data => setModelInfo(data))
      .catch(err => console.error("Could not fetch model info:", err));
  }, []);

  // Re-run single image prediction on confidence threshold change
  useEffect(() => {
    if (singleImage && !singleLoading) {
      runSinglePrediction(singleImage);
    }
  }, [confidence]);

  // Handle Single Image Upload
  const handleSingleImageUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSingleError("Invalid file type. Please upload an image file (JPG, PNG, WEBP).");
      return;
    }
    setSingleError(null);
    setSingleImage(file);
    runSinglePrediction(file);
  };

  const runSinglePrediction = async (file) => {
    setSingleLoading(true);
    setSingleError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/predict?confidence=${confidence}`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Prediction failed");
      }
      const data = await res.json();
      setSingleResult(data);
      if (data.count > 0) {
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
      }
    } catch (err) {
      setSingleError(err.message);
    } finally {
      setSingleLoading(false);
    }
  };

  // Handle Batch Upload
  const handleBatchUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setBatchError(null);
    setBatchLoading(true);
    setBatchResult(null);

    const formData = new FormData();
    files.forEach(f => {
      if (f.name.endsWith('.zip')) {
        formData.append('zip_file', f);
      } else {
        formData.append('files', f);
      }
    });

    try {
      const res = await fetch(`${API_BASE}/api/predict/batch?confidence=${confidence}`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Batch prediction failed");
      }
      const data = await res.json();
      setBatchResult(data);
    } catch (err) {
      setBatchError(err.message);
    } finally {
      setBatchLoading(false);
    }
  };

  // Download Batch ZIP
  const handleDownloadBatchZip = async () => {
    if (!batchResult || !batchResult.results) return;

    const formData = new FormData();
    formData.append('results_json', JSON.stringify(batchResult.results));

    try {
      const res = await fetch(`${API_BASE}/api/batch/download`, {
        method: 'POST',
        body: formData
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "GTSDB_Detections_Results.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Failed to download ZIP: " + err.message);
    }
  };

  // Live Camera Scan logic (Supports switching between Rear & Front camera)
  const startCamera = async (facing = cameraFacingMode) => {
    setCameraError(null);
    
    // Stop current stream if running
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: facing } 
        });
      } catch (e1) {
        // Fallback for mobile browsers with basic constraint syntax
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: facing } 
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Camera access denied or unreadable. Please check camera permissions in your browser.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setCameraActive(false);
  };

  const toggleCameraFacingMode = () => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextFacing);
    if (cameraActive) {
      startCamera(nextFacing);
    }
  };

  useEffect(() => {
    if (!cameraActive) return;

    const processFrame = async () => {
      if (!videoRef.current || !canvasRef.current || isProcessingFrame.current) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.readyState !== 4) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      isProcessingFrame.current = true;
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          isProcessingFrame.current = false;
          animFrameRef.current = requestAnimationFrame(processFrame);
          return;
        }

        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');

        const t0 = performance.now();
        try {
          const res = await fetch(`${API_BASE}/api/predict/frame?confidence=${confidence}`, {
            method: 'POST',
            body: formData
          });
          if (res.ok) {
            const data = await res.json();
            const t1 = performance.now();
            setCameraLatency(Math.round(t1 - t0));
            setCameraFps(data.fps || Math.round(1000 / (t1 - t0)));
            setCameraDetections(data.detections || []);

            // Draw bounding boxes over video stream
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            data.detections.forEach((det) => {
              const [x, y, w, h] = det.bbox;
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 3;
              ctx.strokeRect(x, y, w, h);

              ctx.fillStyle = '#38bdf8';
              ctx.font = 'bold 16px Inter, sans-serif';
              ctx.fillText(`${det.class_name} (${det.confidence_percent})`, x, Math.max(20, y - 8));
            });
          }
        } catch (e) {
          console.error("Frame inference error:", e);
        } finally {
          isProcessingFrame.current = false;
          if (cameraActive) {
            animFrameRef.current = requestAnimationFrame(processFrame);
          }
        }
      }, 'image/jpeg', 0.8);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [cameraActive, confidence]);

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #38bdf8, #a855f7)', padding: '0.6rem', borderRadius: '12px', flexShrink: 0 }}>
              <Activity size={24} color="#fff" />
            </div>
            <div>
              <h1 className="header-title">
                Traffic Sign Recognition
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                GTSDB Benchmark • YOLOv8 + ONNX • Author: <strong style={{ color: 'var(--accent-cyan)' }}>Nathenael Ermias</strong>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="nav-tabs">
            <button className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`} onClick={() => setActiveTab('single')}>
              <Upload size={18} /> <span>Single Image</span>
            </button>
            <button className={`tab-btn ${activeTab === 'batch' ? 'active' : ''}`} onClick={() => setActiveTab('batch')}>
              <Layers size={18} /> <span>Batch Process</span>
            </button>
            <button className={`tab-btn ${activeTab === 'camera' ? 'active' : ''}`} onClick={() => setActiveTab('camera')}>
              <Camera size={18} /> <span>Live Webcam</span>
            </button>
            <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
              <Info size={18} /> <span>Model Specs</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="main-container">
        {/* Top Global Controls: Confidence Slider & Specs Bar */}
        <div className="glass-card controls-bar" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div className="slider-container" style={{ minWidth: '280px', flex: 1 }}>
            <Sliders size={20} color="var(--accent-cyan)" />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Confidence Threshold</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                  {(confidence * 100).toFixed(0)}% ({confidence.toFixed(2)})
                </span>
              </div>
              <input 
                type="range" 
                min="0.05" 
                max="0.95" 
                step="0.05" 
                value={confidence} 
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="slider-input" 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="badge badge-cyan">
              <Zap size={14} /> Latency: {modelInfo ? `${modelInfo.latency_ms} ms` : '18.5 ms'}
            </div>
            <div className="badge badge-purple">
              <Activity size={14} /> FPS: {modelInfo ? `${modelInfo.fps} FPS` : '54 FPS'}
            </div>
            <div className="badge badge-emerald">
              <CheckCircle2 size={14} /> mAP@0.5: {modelInfo ? `${(modelInfo.map50 * 100).toFixed(1)}%` : '3.0%'}
            </div>
          </div>
        </div>

        {/* TAB 1: SINGLE IMAGE DETECTION */}
        {activeTab === 'single' && (
          <div className="responsive-grid">
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={20} color="var(--accent-cyan)" /> Upload Single Driving Scene
              </h2>

              <div 
                className="dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleSingleImageUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => document.getElementById('single-input').click()}
              >
                <input 
                  type="file" 
                  id="single-input" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={(e) => e.target.files && handleSingleImageUpload(e.target.files[0])}
                />
                <Upload size={48} color="var(--accent-cyan)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Tap or drag an image here to scan
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Supports full-resolution driving scene images (JPG, PNG, WEBP)
                </p>
              </div>

              {singleLoading && (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <RefreshCw className="spin" size={40} color="var(--accent-cyan)" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Running ONNX Runtime Inference...</p>
                </div>
              )}

              {singleError && (
                <div className="glass-card" style={{ marginTop: '1.5rem', padding: '1rem', borderColor: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.1)' }}>
                  <p style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} /> {singleError}
                  </p>
                </div>
              )}

              {singleResult && !singleLoading && (
                <div style={{ marginTop: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Annotated Object Detection Result</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className="badge badge-cyan">{singleResult.count} Signs Detected</span>
                      <span className="badge badge-purple">{singleResult.latency_ms} ms</span>
                    </div>
                  </div>

                  <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#000' }}>
                    <img 
                      src={singleResult.annotated_image} 
                      alt="Detection Result" 
                      style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '600px', objectFit: 'contain' }} 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Detections Side Panel */}
            {singleResult && (
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  Detected Signs ({singleResult.count})
                </h3>

                {singleResult.count === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                    No signs detected above threshold {confidence}. Lower the slider to see lower-confidence detections.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
                    {singleResult.detections.map((det, idx) => (
                      <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>{det.class_name}</span>
                          <span className="badge badge-emerald">{det.confidence_percent}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          BBox [X, Y, W, H]: {det.bbox.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BATCH PROCESSING */}
        {activeTab === 'batch' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={20} color="var(--accent-purple)" /> Batch Processing & ZIP Export
            </h2>

            <div 
              className="dropzone"
              onClick={() => document.getElementById('batch-input').click()}
            >
              <input 
                type="file" 
                id="batch-input" 
                multiple 
                accept="image/*,.zip" 
                style={{ display: 'none' }} 
                onChange={handleBatchUpload}
              />
              <FileArchive size={48} color="var(--accent-purple)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
              <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Upload multiple images or a single ZIP archive
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Processes entire directory of driving scenes automatically
              </p>
            </div>

            {batchLoading && (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <RefreshCw className="spin" size={40} color="var(--accent-purple)" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Processing Batch Images with ONNX Runtime...</p>
              </div>
            )}

            {batchError && (
              <div className="glass-card" style={{ marginTop: '1.5rem', padding: '1rem', borderColor: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.1)' }}>
                <p style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} /> {batchError}
                </p>
              </div>
            )}

            {batchResult && !batchLoading && (
              <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Batch Results</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      Processed {batchResult.processed_count} images • Speed: {batchResult.overall_fps} FPS
                    </p>
                  </div>
                  <button className="btn-primary" onClick={handleDownloadBatchZip}>
                    <Download size={18} /> Download All Results (ZIP + CSV)
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                  {batchResult.results.map((item, idx) => (
                    <div key={idx} className="glass-card" style={{ padding: '0.85rem', overflow: 'hidden' }}>
                      <img 
                        src={item.annotated_image} 
                        alt={item.filename} 
                        style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.75rem' }} 
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                          {item.filename}
                        </span>
                        <span className="badge badge-purple">{item.count} signs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LIVE CAMERA SCAN (Mobile Rear Camera + Switch Button) */}
        {activeTab === 'camera' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Camera size={20} color="var(--accent-emerald)" /> Live Camera Detection
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Real-time traffic sign detection via browser camera stream
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="btn-secondary" 
                  onClick={toggleCameraFacingMode} 
                  title="Switch between Rear and Front camera"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  <RefreshCw size={16} /> 
                  <span>{cameraFacingMode === 'environment' ? 'Rear (Back)' : 'Front (Selfie)'}</span>
                </button>

                {cameraActive && (
                  <>
                    <div className="badge badge-emerald">FPS: {cameraFps}</div>
                    <div className="badge badge-cyan">{cameraLatency} ms</div>
                    <button className="btn-secondary" style={{ borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)' }} onClick={stopCamera}>
                      <Square size={16} /> Stop
                    </button>
                  </>
                )}
                {!cameraActive && (
                  <button className="btn-primary" onClick={() => startCamera(cameraFacingMode)}>
                    <Play size={18} /> Start Camera
                  </button>
                )}
              </div>
            </div>

            {cameraError && (
              <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderColor: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.1)' }}>
                <p style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                  <AlertTriangle size={20} /> {cameraError}
                </p>
              </div>
            )}

            <div className="video-container">
              <video 
                ref={videoRef} 
                playsInline 
                muted 
                style={{ display: 'none' }} 
              />
              <canvas 
                ref={canvasRef} 
                style={{ width: '100%', height: 'auto', maxHeight: '600px', display: cameraActive ? 'block' : 'none', borderRadius: '12px' }} 
              />

              {!cameraActive && (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                  <Camera size={56} color="var(--accent-emerald)" style={{ opacity: 0.4, marginBottom: '1rem' }} />
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    Tap "Start Camera" to scan traffic signs with your mobile camera
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn-primary" onClick={() => startCamera(cameraFacingMode)}>
                      <Play size={18} /> Start Camera
                    </button>
                    <button className="btn-secondary" onClick={toggleCameraFacingMode}>
                      <RefreshCw size={16} /> Switch to {cameraFacingMode === 'environment' ? 'Front' : 'Rear'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MODEL SPECS & DATASET INFO */}
        {activeTab === 'info' && (
          <div>
            <div className="stats-grid">
              <div className="glass-card metric-card">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>mAP@0.5 Overall</span>
                <span className="metric-value">{modelInfo ? `${(modelInfo.map50 * 100).toFixed(1)}%` : '3.0%'}</span>
              </div>
              <div className="glass-card metric-card">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>mAP@0.5:0.95</span>
                <span className="metric-value">{modelInfo ? `${(modelInfo.map50_95 * 100).toFixed(1)}%` : '2.35%'}</span>
              </div>
              <div className="glass-card metric-card">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Inference Speed</span>
                <span className="metric-value">{modelInfo ? `${modelInfo.fps} FPS` : '54 FPS'}</span>
              </div>
              <div className="glass-card metric-card">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Runtime Engine</span>
                <span className="metric-value" style={{ fontSize: '1.4rem' }}>ONNX Runtime</span>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent-cyan)' }}>
                Dataset & Class Imbalance Analysis (GTSDB)
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                The German Traffic Sign Detection Benchmark (GTSDB) contains 600 training scenes and 300 test scenes covering 43 traffic sign categories.
                Due to real-world driving data collection constraints, the dataset suffers from extreme class imbalance:
              </p>
              <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                <li><strong>Frequent Classes:</strong> Classes like <em>Speed Limit 30/50/80</em>, <em>Priority Road</em>, and <em>Keep Right</em> contain 20 to 45 training instances.</li>
                <li><strong>Data Scarcity Classes:</strong> Classes such as <em>Road narrows right</em>, <em>Wild animals crossing</em>, and <em>Go straight or left</em> contain 0 training instances in the standard benchmark split.</li>
              </ul>
            </div>

            {/* Author Credit Card */}
            <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--accent-purple)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>
                Production Author Attribution
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Designed, trained, and deployed by <strong>Nathenael Ermias</strong> for production Traffic Sign Recognition.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
