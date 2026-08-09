from dataclasses import dataclass

import numpy as np
from sqlalchemy import select

from backend.app.config import settings
from backend.app.db.models import FaceEmbedding, User
from backend.app.db.session import SessionLocal


@dataclass
class RecognitionResult:
    user_id: int | None
    name: str | None
    similarity: float
    best_similarity: float
    pose: str | None


class DatabaseRecognizer:
    def __init__(
        self,
        threshold: float | None = None,
        min_best_similarity: float | None = None,
        top_k: int | None = None,
    ):
        self.threshold = (
            settings.recognition_threshold
            if threshold is None
            else threshold
        )

        self.min_best_similarity = (
            settings.min_best_similarity
            if min_best_similarity is None
            else min_best_similarity
        )

        self.top_k = settings.top_k if top_k is None else top_k

    def recognize(
        self,
        embedding: np.ndarray,
    ) -> RecognitionResult:
        embedding = np.asarray(embedding, dtype=np.float32)

        if embedding.shape != (512,):
            raise ValueError(
                f"Expected embedding shape (512,), got {embedding.shape}"
            )

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
            )

            rows = session.execute(statement).all()

        if not rows:
            return RecognitionResult(
                user_id=None,
                name=None,
                similarity=0.0,
                best_similarity=0.0,
                pose=None,
            )

        user_matches: dict[int, dict] = {}

        for row in rows:
            similarity = 1.0 - float(row.distance)

            if row.id not in user_matches:
                user_matches[row.id] = {
                    "user_id": row.id,
                    "name": row.name,
                    "matches": [],
                }

            user_matches[row.id]["matches"].append(
                {
                    "similarity": similarity,
                    "pose": row.pose,
                }
            )

        candidates = []

        for user in user_matches.values():
            matches = sorted(
                user["matches"],
                key=lambda item: item["similarity"],
                reverse=True,
            )

            top_matches = matches[: self.top_k]

            aggregate_similarity = float(
                np.mean(
                    [
                        match["similarity"]
                        for match in top_matches
                    ]
                )
            )

            best_match = top_matches[0]

            candidates.append(
                {
                    "user_id": user["user_id"],
                    "name": user["name"],
                    "similarity": aggregate_similarity,
                    "best_similarity": best_match["similarity"],
                    "pose": best_match["pose"],
                }
            )

        best_candidate = max(
            candidates,
            key=lambda candidate: candidate["similarity"],
        )

        if (
            best_candidate["similarity"] < self.threshold
            or best_candidate["best_similarity"]
            < self.min_best_similarity
        ):
            return RecognitionResult(
                user_id=None,
                name=None,
                similarity=best_candidate["similarity"],
                best_similarity=best_candidate["best_similarity"],
                pose=best_candidate["pose"],
            )

        return RecognitionResult(
            user_id=best_candidate["user_id"],
            name=best_candidate["name"],
            similarity=best_candidate["similarity"],
            best_similarity=best_candidate["best_similarity"],
            pose=best_candidate["pose"],
        )