from pathlib import Path

import numpy as np

from backend.app.cv.database_recognition import DatabaseRecognizer
from backend.app.db.models import FaceEmbedding, User
from backend.app.db.session import SessionLocal
from sqlalchemy import select


BASE_DIR = Path(__file__).resolve().parents[2]
ENROLLMENT_DIR = BASE_DIR / "data" / "enrollments"


def load_enrollment(filename: str) -> dict[str, np.ndarray]:
    path = ENROLLMENT_DIR / filename
    data = np.load(path)

    return {
        pose: data[pose].astype(np.float32)
        for pose in data.files
    }


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    a = a / np.linalg.norm(a)
    b = b / np.linalg.norm(b)

    return float(np.dot(a, b))


def evaluate_genuine(
    recognizer: DatabaseRecognizer,
    filename: str,
    expected_name: str,
) -> list[float]:
    samples = load_enrollment(filename)
    scores = []

    for embedding in samples.values():
        result = recognizer.recognize(embedding)

        if result.name != expected_name:
            raise AssertionError(
                f"Expected {expected_name}, got {result.name}"
            )

        scores.append(result.similarity)

    return scores


def evaluate_impostor(
    query_filename: str,
    target_filename: str,
) -> list[float]:
    queries = load_enrollment(query_filename)
    targets = load_enrollment(target_filename)

    scores = []

    target_embeddings = list(targets.values())

    for query in queries.values():
        similarities = [
            cosine_similarity(query, target)
            for target in target_embeddings
        ]

        top_k = sorted(
            similarities,
            reverse=True,
        )[:3]

        scores.append(float(np.mean(top_k)))

    return scores


def print_statistics(label: str, scores: list[float]) -> None:
    values = np.asarray(scores, dtype=np.float32)

    print(f"\n## {label}")
    print(f"Count   : {len(values)}")
    print(f"Minimum : {values.min():.4f}")
    print(f"Maximum : {values.max():.4f}")
    print(f"Mean    : {values.mean():.4f}")
    print(f"Median  : {np.median(values):.4f}")
    print(f"Std Dev : {values.std():.4f}")


def main() -> None:
    print("Vision Studio - Database Recognition Evaluation")

    recognizer = DatabaseRecognizer()

    aditya_genuine = evaluate_genuine(
        recognizer,
        "aditya.npz",
        "Aditya Kumar Sah",
    )

    ashutosh_genuine = evaluate_genuine(
        recognizer,
        "ashutosh.npz",
        "Ashutosh Kumar Sah",
    )

    aditya_impostor = evaluate_impostor(
        "aditya.npz",
        "ashutosh.npz",
    )

    ashutosh_impostor = evaluate_impostor(
        "ashutosh.npz",
        "aditya.npz",
    )

    print_statistics(
        "ADITYA - GENUINE",
        aditya_genuine,
    )

    print_statistics(
        "ASHUTOSH - GENUINE",
        ashutosh_genuine,
    )

    print_statistics(
        "ADITYA ↔ ASHUTOSH - IMPOSTOR",
        aditya_impostor,
    )

    print_statistics(
        "ASHUTOSH ↔ ADITYA - IMPOSTOR",
        ashutosh_impostor,
    )


if __name__ == "__main__":
    main()