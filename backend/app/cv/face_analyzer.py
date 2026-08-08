import insightface
import onnxruntime as ort


class FaceAnalyzer:
    """Wrapper around InsightFace for face detection and analysis."""

    def __init__(self):
        # Load CUDA/cuDNN DLLs before InsightFace creates ONNX sessions.
        ort.preload_dlls(directory="")

        providers = ort.get_available_providers()

        if "CUDAExecutionProvider" not in providers:
            raise RuntimeError(
                "CUDAExecutionProvider is not available."
            )

        self.providers = [
            "CUDAExecutionProvider",
            "CPUExecutionProvider",
        ]

        self.model = insightface.app.FaceAnalysis(
            name="buffalo_l",
            providers=self.providers,
        )

        self.model.prepare(
            ctx_id=0,
            det_size=(640, 640),
        )

    def analyze(self, frame):
        """Detect and analyze faces in a BGR OpenCV frame."""

        return self.model.get(frame)