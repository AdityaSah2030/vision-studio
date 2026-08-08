import numpy as np


def normalize_embedding(embedding: np.ndarray) -> np.ndarray:
    """
    Normalize a face embedding to unit length.

    This makes cosine similarity easier and more stable to calculate.
    """

    embedding = np.asarray(embedding, dtype=np.float32)

    norm = np.linalg.norm(embedding)

    if norm == 0:
        raise ValueError("Cannot normalize a zero-length embedding.")

    return embedding / norm


def cosine_similarity(
    embedding_a: np.ndarray,
    embedding_b: np.ndarray,
) -> float:
    """
    Calculate cosine similarity between two face embeddings.

    Returns a value approximately between -1 and 1.
    Higher values indicate greater similarity.
    """

    a = normalize_embedding(embedding_a)
    b = normalize_embedding(embedding_b)

    return float(np.dot(a, b))