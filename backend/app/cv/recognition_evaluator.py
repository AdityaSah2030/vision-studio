from pathlib import Path

import numpy as np

from backend.app.cv.embedding import cosine_similarity


ENROLLMENT_DIR = Path("data/enrollments")


def load_embeddings(name: str) -> dict[str, np.ndarray]:
    """Load one person's enrollment embeddings."""

    path = ENROLLMENT_DIR / f"{name}.npz"

    if not path.exists():
        raise FileNotFoundError(f"Enrollment file not found: {path}")

    data = np.load(path)

    return {
        key: np.asarray(data[key], dtype=np.float32)
        for key in data.files
    }


def genuine_scores(
    embeddings: dict[str, np.ndarray],
) -> list[float]:
    """Compare every enrollment sample with every other sample."""

    names = list(embeddings.keys())
    scores = []

    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            scores.append(
                cosine_similarity(
                    embeddings[names[i]],
                    embeddings[names[j]],
                )
            )

    return scores


def impostor_scores(
    person_a: dict[str, np.ndarray],
    person_b: dict[str, np.ndarray],
) -> list[float]:
    """Compare every sample from one person against every sample from another."""

    scores = []

    for embedding_a in person_a.values():
        for embedding_b in person_b.values():
            scores.append(
                cosine_similarity(
                    embedding_a,
                    embedding_b,
                )
            )

    return scores


def print_statistics(
    label: str,
    scores: list[float],
) -> None:
    values = np.asarray(scores, dtype=np.float32)

    print(f"\n{label}")
    print("-" * 55)

    print(f"Count   : {len(values)}")
    print(f"Minimum : {np.min(values):.4f}")
    print(f"Maximum : {np.max(values):.4f}")
    print(f"Mean    : {np.mean(values):.4f}")
    print(f"Median  : {np.median(values):.4f}")
    print(f"Std Dev : {np.std(values):.4f}")


def main():
    aditya = load_embeddings("aditya")
    ashutosh = load_embeddings("ashutosh")

    print("Vision Studio - Recognition Evaluation")
    print("=" * 55)

    print(f"Aditya samples   : {len(aditya)}")
    print(f"Ashutosh samples : {len(ashutosh)}")

    aditya_genuine = genuine_scores(aditya)
    ashutosh_genuine = genuine_scores(ashutosh)
    aditya_ashutosh = impostor_scores(
        aditya,
        ashutosh,
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
        aditya_ashutosh,
    )


if __name__ == "__main__":
    main()