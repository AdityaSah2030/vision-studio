import cv2
import numpy as np

from backend.app.cv.database_recognition import DatabaseRecognizer
from backend.app.cv.face_analyzer import FaceAnalyzer


class RecognitionService:
    """Handle face recognition operations."""

    def __init__(
        self,
        face_analyzer: FaceAnalyzer,
        database_recognizer: DatabaseRecognizer,
    ):
        self.face_analyzer = face_analyzer
        self.database_recognizer = database_recognizer

    def recognize(
        self,
        image_bytes: bytes,
    ):
        """Recognize a face from uploaded image bytes."""

        if not image_bytes:
            raise ValueError("Uploaded image is empty.")

        frame = cv2.imdecode(
            np.frombuffer(
                image_bytes,
                dtype=np.uint8,
            ),
            cv2.IMREAD_COLOR,
        )

        if frame is None:
            raise ValueError(
                "Could not decode the uploaded image."
            )

        faces = self.face_analyzer.analyze(frame)

        if len(faces) == 0:
            raise ValueError("No face detected.")

        if len(faces) > 1:
            raise ValueError(
                "Multiple faces detected. "
                "Please provide an image with exactly one face."
            )

        face = faces[0]

        embedding = face.normed_embedding

        if embedding is None:
            raise ValueError(
                "Could not generate a face embedding."
            )

        embedding = np.asarray(
            embedding,
            dtype=np.float32,
        )

        if embedding.shape != (512,):
            raise ValueError(
                f"Unexpected embedding shape: {embedding.shape}"
            )

        return self.database_recognizer.recognize(
            embedding
        )