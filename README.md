# Vision Studio

Real-time computer vision platform for biometric face identification, multi-pose user enrollment, and interactive creative filters.

---

## Overview

**Vision Studio** is an end-to-end computer vision platform combining deep learning biometric facial recognition with real-time GPU-accelerated creative visual filters. 

The application is structured around a focused, single-stage progressive workflow:
1. **Identify Face**: Fast face recognition comparing 512-dimensional biometric embeddings using PostgreSQL and `pgvector`.
2. **Enroll Face**: Multi-pose registration requiring 6 distinct facial angles (Center, Left, Right, Up, Down, Center) for robust biometric matching.
3. **Filters Studio**: Creative visual pipeline featuring real-time ASCII Art, Neon Edge Contours, Thermal Infrared Vision, Retro 8-Bit Arcade, and Pop-Art Halftone filters.

---

## Version 1.0.0 Specifications (Current Release)

Version 1 is architected for high-performance native local execution, leveraging local GPU/CPU compute for zero-latency camera streams and biometric model inference.

### 1. Frontend Architecture
- **Single-Stage Stepper Flow**: A guided workflow tracker (`Identify Face` ➔ `Enroll Face` ➔ `Filters Studio`) that renders only one active stage at a time, eliminating competing camera streams, GPU overhead, and vertical layout clutter.
- **Hardware-Aware Camera Management**: 
  - Intelligent camera enumeration via `navigator.mediaDevices.enumerateDevices()`.
  - Automatic hardware detection prioritizing the integrated laptop webcam (`Camera 1: Integrated Camera`) over secondary/virtual webcams (`Camera 0: Smart Connect Camera`).
  - Seamless stream lifecycle management (`stopAllCameras()`) preventing device lockups during stage transitions.
- **Real-Time Client-Side Visual Filters**:
  - **ASCII Art Webcam**: Dynamic character resolution (`40`–`160` chars), monospace aspect correction (`0.52`), multiple color palettes (Terminal Green, Cyber Cyan, Amber Phosphor, Monochrome White, Full RGB), and character density ramp tuning.
  - **Neon Edge Contour**: Sobel kernel edge detection with adjustable sensitivity thresholds (`15`–`75`), contrast boost, and electric glow palettes (Cyber Cyan, Hot Magenta, Acid Lime, Electric Amber, Chromatic Hue, Stark White).
  - **Thermal Infrared Vision**: False-color heat signature mapping (Classic Ironbow, Inferno Flame, Arctic Cryo Blue, Full Spectrum Rainbow, FLIR Monochromatic) with dynamic heat bias (`-40%` to `+40%`).
  - **Retro 8-Bit Arcade**: Dynamic pixelation block sizing (`3px` to `24px`), CRT scanline overlay, and vintage gaming color palettes (8-Bit Full Color, Game Boy Classic, Cyber Synthwave, Amber CRT, 1-Bit Mono).
  - **Pop-Art Halftone**: Screen-print dot grid simulation with dynamic dot spacing (`4px` to `24px`), luminance-weighted radii, and comic palettes (Cyan Pop, Pop Magenta, Halftone Lime, Golden Dots, Full RGB Dots, Newspaper Noir).
- **Universal Effect Tuning**: Real-time resolution slider, contrast boost (`0.8x`–`2.4x`), color palette selector, luminance inverter, and horizontal selfie mirror mode.
- **Exports & Snapshots**: One-click PNG capture, raw ASCII text export, and clipboard synchronization.

### 2. Backend Architecture
- **FastAPI Core**: Async REST API endpoints:
  - `POST /api/recognize`: Cosine similarity search against enrolled biometric embeddings.
  - `POST /api/users/`: Profile creation with name, email, phone, and date of birth.
  - `POST /api/enroll/`: Multi-pose biometric registration with pose angle verification.
  - `POST /api/filters/ascii`: Server-side fallback ASCII generation.
- **InsightFace Biometrics**: Deep learning face analysis pipeline using the `buffalo_l` model suite (ResNet/ONNX Runtime) generating normalized 512-dimensional facial feature vectors.
- **Vector Database**: PostgreSQL with the `pgvector` extension utilizing cosine distance indexing (`<=>`) for sub-millisecond similarity matching.
- **Native OpenCV Pipeline**: Local video capture fallback with automatic index arbitration between Camera 1 (Integrated) and Camera 0.
- **Test Suite**: Automated unit and integration tests covering enrollment, preprocessing, and filtering endpoints (all 8 tests passing).

---

## Future Version 2.0.0 Roadmap (Cloud & Live Hosting)

### Motivation
In Version 1, hosting online via free-tier cloud platforms is constrained by the absence of free GPU acceleration required for deep learning facial recognition models (InsightFace inference induces high latency on free CPU tiers). Version 2 will transition the project to a scalable cloud architecture.

### Planned Version 2 Specifications
1. **Client-Side Edge AI**:
   - Integrate WebAssembly (WASM) and WebGL-accelerated models (MediaPipe Face Mesh / TensorFlow.js / ONNX Web) directly in the browser.
   - Perform face detection, landmark alignment, and quality checks on the client before sending frames to the cloud, reducing server bandwidth and compute requirements.
2. **Containerized Cloud Backend**:
   - Containerize the FastAPI backend via Docker.
   - Deploy on serverless GPU infrastructure (Modal / RunPod / Google Cloud Run with GPU / AWS ECS) for on-demand sub-100ms embedding extraction.
3. **Cloud Vector Database**:
   - Migrate local PostgreSQL `pgvector` to managed cloud vector infrastructure (Supabase, Neon Serverless Postgres, or AWS Aurora PostgreSQL with pgvector) with automated connection pooling via PgBouncer.
4. **WebRTC & WebSocket Streaming**:
   - Implement WebRTC/WebSocket pipelines for real-time bidirectional video streaming, enabling cloud-assisted live filters and continuous ambient face recognition.
5. **Authentication & Multi-Tenant Security**:
   - Implement OAuth2 / JWT authentication.
   - Add end-to-end encryption for biometric vectors and strict GDPR/biometric privacy compliance.
6. **Mobile PWA & Native Packaging**:
   - Progressive Web App (PWA) offline filter mode with camera access on iOS and Android.

---

## Project Structure

```
vision-studio/
├── backend/
│   └── app/
│       ├── api/
│       │   └── routes.py         # FastAPI REST endpoints
│       ├── cv/
│       │   ├── ascii_filter.py   # Server-side ASCII generator
│       │   ├── camera.py         # OpenCV camera wrapper with index fallback
│       │   ├── face_engine.py    # InsightFace embedding extractor
│       │   └── preprocessor.py   # Image normalization & transformations
│       ├── db/
│       │   ├── database.py       # SQLAlchemy engine & session factory
│       │   └── models.py         # pgvector User & Embedding schemas
│       ├── config.py             # App settings & camera index defaults
│       └── main.py               # FastAPI application entrypoint & CORS
├── frontend/
│   ├── css/
│   │   └── style.css             # Glassmorphic design system & stepper styles
│   ├── js/
│   │   └── script.js             # Stage flow, camera logic & 5 live visual filters
│   └── index.html                # Single-page stage layout & effect tuning UI
├── tests/
│   ├── api/
│   │   ├── test_enrollment.py    # Multi-pose registration test suite
│   │   └── test_filters.py       # Filter endpoint tests
│   └── test_preprocessing.py     # Image transformation unit tests
├── requirements.txt              # Python dependencies
└── README.md                     # Documentation & specifications
```

---

## Getting Started (Local Development)

### Prerequisites
- Python 3.11+
- PostgreSQL 15+ with the `pgvector` extension installed
- A modern web browser (Google Chrome or Microsoft Edge recommended)
- Laptop webcam / USB camera

### 1. Environment Configuration
Create a `.env` file in the project root:
```env
DATABASE_URL=postgresql+psycopg2://<user>:<password>@localhost:5432/vision_studio
CAMERA_INDEX=1
RECOGNITION_THRESHOLD=0.60
MIN_BEST_SIMILARITY=0.70
TOP_K=3
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows PowerShell
# source .venv/bin/activate    # Linux / macOS

# Install dependencies
pip install -r requirements.txt

# Run database migrations / initialize tables
python -m backend.app.db.init_db

# Start backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
In a separate terminal:
```bash
# Serve frontend locally
python -m http.server 5500 --directory frontend
```
Open `http://127.0.0.1:5500` in your web browser.

### 4. Running Tests
```bash
$env:PYTHONPATH="."
.\.venv\Scripts\pytest -v
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
