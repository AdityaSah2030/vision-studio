from fastapi import FastAPI

from backend.app.api.routes import router

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="Vision Studio",
    description="Real-time computer vision and visual processing platform",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "name": "Vision Studio",
        "status": "running",
        "version": "0.1.0",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}