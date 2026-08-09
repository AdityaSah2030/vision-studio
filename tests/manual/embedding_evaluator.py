from pathlib import Path

import numpy as np

from backend.app.cv.embedding import cosine_similarity


EMBEDDING_FILE = Path("enrollment_samples.npz")


def load_embeddings() -> dict[str, np.ndarray]:
    """Load enrollment embeddings from the local NPZ file."""

    if not EMBEDDING_FILE.exists():
        raise FileNotFoundError(
            f"{EMBEDDING_FILE} was not found. "
            "Run enrollment_capture first."
        )

    data = np.load(EMBEDDING_FILE)

    return {
        name: np.asarray(data[name], dtype=np.float32)
        for name in data.files
    }


def calculate_pairwise_similarities(
    embeddings: dict[str, np.ndarray],
) -> list[tuple[str, str, float]]:
    """Calculate cosine similarity between every pair of embeddings."""

    results = []

    names = list(embeddings.keys())

    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            name_a = names[i]
            name_b = names[j]

            similarity = cosine_similarity(
                embeddings[name_a],
                embeddings[name_b],
            )

            results.append(
                (name_a, name_b, similarity)
            )

    return results


def main():
    embeddings = load_embeddings()

    print("Vision Studio - Embedding Evaluation")
    print()
    print(f"Loaded embeddings: {len(embeddings)}")
    print()

    for name, embedding in embeddings.items():
        print(
            f"{name:10} | "
            f"shape={embedding.shape} | "
            f"norm={np.linalg.norm(embedding):.4f}"
        )

    print()
    print("Pairwise cosine similarities")
    print("-" * 50)

    similarities = calculate_pairwise_similarities(
        embeddings
    )

    values = []

    for name_a, name_b, similarity in similarities:
        values.append(similarity)

        print(
            f"{name_a:10} ↔ "
            f"{name_b:10} : "
            f"{similarity:.4f}"
        )

    values = np.asarray(values, dtype=np.float32)

    print()
    print("Statistics")
    print("-" * 50)

    print(f"Minimum : {np.min(values):.4f}")
    print(f"Maximum : {np.max(values):.4f}")
    print(f"Mean    : {np.mean(values):.4f}")
    print(f"Median  : {np.median(values):.4f}")
    print(f"Std Dev : {np.std(values):.4f}")


if __name__ == "__main__":
    main()