import cv2
import numpy as np

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.api.schemas import EnrollmentPose
from backend.app.cv.face_analyzer import FaceAnalyzer
from backend.app.db.models import FaceEmbedding, User


class EnrollmentService:
    """Handle user face enrollment operations."""

    def __init__(self, face_analyzer: FaceAnalyzer):
        self.face_analyzer = face_analyzer

    def enroll_embedding(
        self,
        db: Session,
        user_id: int,
        pose: EnrollmentPose,
        image_bytes: bytes,
    ) -> FaceEmbedding:
        """Generate and store a face embedding for a user."""

        user = db.get(User, user_id)

        if user is None:
            raise ValueError("User not found.")

        existing_embedding = db.scalar(
            select(FaceEmbedding).where(
                FaceEmbedding.user_id == user_id,
                FaceEmbedding.pose == pose,
            )
        )

        if existing_embedding is not None:
            raise ValueError(
                f"Pose '{pose}' has already been enrolled for this user."
            )

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

        face_embedding = FaceEmbedding(
            user_id=user_id,
            embedding=embedding.tolist(),
            pose=pose,
        )

        db.add(face_embedding)
        db.commit()
        db.refresh(face_embedding)

        return face_embedding