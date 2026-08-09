from pathlib import Path

import numpy as np

from backend.app.cv.embedding import cosine_similarity
from backend.app.cv.recognition import FaceRecognizer


ENROLLMENT_DIR = Path("data/enrollments")


def load_embeddings(name: str) -> list[np.ndarray]:
    """Load all embeddings for one identity."""

    path = ENROLLMENT_DIR / f"{name}.npz"

    if not path.exists():
        raise FileNotFoundError(
            f"Enrollment file not found: {path}"
        )

    data = np.load(path)

    return [
        np.asarray(
            data[key],
            dtype=np.float32,
        )
        for key in data.files
    ]


def build_recognizer() -> FaceRecognizer:
    """Build a recognizer from the local enrollment data."""

    recognizer = FaceRecognizer(
        threshold=0.60,
        top_k=3,
    )

    for identity in ("aditya", "ashutosh"):
        embeddings = load_embeddings(identity)

        recognizer.register_many(
            identity,
            embeddings,
        )

    return recognizer


def evaluate_pair(
    recognizer: FaceRecognizer,
    query: np.ndarray,
    expected_identity: str,
) -> None:
    result = recognizer.recognize(query)

    print(
        f"Expected: {expected_identity:10} | "
        f"Predicted: {str(result.identity):10} | "
        f"Best: {result.similarity:.4f} | "
        f"Top-{recognizer.top_k}: "
        f"{result.top_k_similarity:.4f} | "
        f"Recognized: {result.recognized}"
    )


def main():
    print("Vision Studio - Multi-Sample Recognition")
    print("=" * 75)

    recognizer = build_recognizer()

    aditya = load_embeddings("aditya")
    ashutosh = load_embeddings("ashutosh")

    print()
    print("Testing Aditya samples")
    print("-" * 75)

    for embedding in aditya:
        evaluate_pair(
            recognizer,
            embedding,
            "aditya",
        )

    print()
    print("Testing Ashutosh samples")
    print("-" * 75)

    for embedding in ashutosh:
        evaluate_pair(
            recognizer,
            embedding,
            "ashutosh",
        )

    print()
    print("Testing cross-person samples")
    print("-" * 75)

    # Compare each Aditya sample against a recognizer
    # that only contains Ashutosh.
    ashutosh_only = FaceRecognizer(
        threshold=0.60,
        top_k=3,
    )

    ashutosh_only.register_many(
        "ashutosh",
        ashutosh,
    )

    for embedding in aditya:
        evaluate_pair(
            ashutosh_only,
            embedding,
            "unknown",
        )


if __name__ == "__main__":
    main()