from dataclasses import dataclass

import numpy as np
from sqlalchemy import select

from backend.app.db.models import FaceEmbedding, User
from backend.app.db.session import SessionLocal


@dataclass
class RecognitionResult:
    user_id: int | None
    name: str | None
    similarity: float
    pose: str | None


class DatabaseRecognizer:
    def __init__(self, threshold: float = 0.70):
        self.threshold = threshold

    def recognize(
        self,
        embedding: np.ndarray,
    ) -> RecognitionResult:
        embedding = np.asarray(embedding, dtype=np.float32)

        if embedding.shape != (512,):
            raise ValueError(
                f"Expected embedding shape (512,), got {embedding.shape}"
            )

        # Normalize the query embedding.
        norm = np.linalg.norm(embedding)

        if norm == 0:
            raise ValueError("Embedding has zero magnitude.")

        embedding = embedding / norm

        with SessionLocal() as session:
            distance = FaceEmbedding.embedding.cosine_distance(
                embedding.tolist()
            )

            statement = (
                select(
                    User.id,
                    User.name,
                    FaceEmbedding.pose,
                    distance.label("distance"),
                )
                .join(
                    FaceEmbedding,
                    FaceEmbedding.user_id == User.id,
                )
                .order_by(distance)
                .limit(1)
            )

            result = session.execute(statement).first()

        if result is None:
            return RecognitionResult(
                user_id=None,
                name=None,
                similarity=0.0,
                pose=None,
            )

        similarity = 1.0 - float(result.distance)

        if similarity < self.threshold:
            return RecognitionResult(
                user_id=None,
                name=None,
                similarity=similarity,
                pose=result.pose,
            )

        return RecognitionResult(
            user_id=result.id,
            name=result.name,
            similarity=similarity,
            pose=result.pose,
        )