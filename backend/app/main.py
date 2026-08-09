from fastapi import FastAPI

from backend.app.api.routes import router


app = FastAPI(
    title="Vision Studio",
    description="Real-time computer vision and visual processing platform",
    version="0.1.0",
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