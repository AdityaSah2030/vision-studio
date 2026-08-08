from dataclasses import dataclass

import numpy as np

from backend.app.cv.embedding import cosine_similarity

from backend.app.config import (
    MIN_BEST_SIMILARITY,
    RECOGNITION_THRESHOLD,
    TOP_K,
)


@dataclass
class RecognitionResult:
    identity: str | None
    similarity: float
    top_k_similarity: float
    recognized: bool


class FaceRecognizer:
    """Multi-sample face recognizer using cosine similarity."""

    def __init__(
        self,
        threshold: float = RECOGNITION_THRESHOLD,
        top_k: int = TOP_K,
        min_best_similarity: float = MIN_BEST_SIMILARITY,
    ):
        self.threshold = threshold
        self.top_k = top_k
        self.min_best_similarity = min_best_similarity

        self.embeddings: dict[str, list[np.ndarray]] = {}

    def register(
        self,
        identity: str,
        embedding: np.ndarray,
    ) -> None:
        """Add an enrollment embedding for an identity."""

        embedding = np.asarray(
            embedding,
            dtype=np.float32,
        )

        self.embeddings.setdefault(
            identity,
            [],
        ).append(embedding)

    def register_many(
        self,
        identity: str,
        embeddings: list[np.ndarray],
    ) -> None:
        """Register multiple embeddings for an identity."""

        for embedding in embeddings:
            self.register(
                identity,
                embedding,
            )

    def _identity_scores(
        self,
        query: np.ndarray,
        stored_embeddings: list[np.ndarray],
    ) -> tuple[float, float]:
        """Calculate best and top-k average similarity."""

        similarities = [
            cosine_similarity(
                query,
                stored,
            )
            for stored in stored_embeddings
        ]

        similarities.sort(reverse=True)

        best_similarity = similarities[0]

        k = min(
            self.top_k,
            len(similarities),
        )

        top_k_similarity = float(
            np.mean(similarities[:k])
        )

        return (
            best_similarity,
            top_k_similarity,
        )

    def recognize(
        self,
        embedding: np.ndarray,
    ) -> RecognitionResult:
        """Find the most likely registered identity."""

        if not self.embeddings:
            return RecognitionResult(
                identity=None,
                similarity=0.0,
                top_k_similarity=0.0,
                recognized=False,
            )

        best_identity = None
        best_similarity = -1.0
        best_top_k_similarity = -1.0

        for identity, stored_embeddings in self.embeddings.items():
            similarity, top_k_similarity = (
                self._identity_scores(
                    embedding,
                    stored_embeddings,
                )
            )

            # Rank identities using top-k similarity.
            if top_k_similarity > best_top_k_similarity:
                best_identity = identity
                best_similarity = similarity
                best_top_k_similarity = top_k_similarity

        recognized = (
            best_top_k_similarity >= self.threshold
            and best_similarity >= self.min_best_similarity
        )

        if not recognized:
            best_identity = None

        return RecognitionResult(
            identity=best_identity,
            similarity=best_similarity,
            top_k_similarity=best_top_k_similarity,
            recognized=recognized,
        )