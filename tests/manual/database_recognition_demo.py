from pathlib import Path

import numpy as np

from backend.app.cv.database_recognition import DatabaseRecognizer


BASE_DIR = Path(__file__).resolve().parents[2]
ENROLLMENT_DIR = BASE_DIR / "data" / "enrollments"


def test_person(filename: str) -> None:
    path = ENROLLMENT_DIR / filename
    data = np.load(path)

    recognizer = DatabaseRecognizer(threshold=0.70)

    print(f"\nTesting {filename}")

    for pose in data.files:
        embedding = data[pose]

        result = recognizer.recognize(embedding)

        print(
            f"{pose:<10} | "
            f"Predicted: {str(result.name):<20} | "
            f"Similarity: {result.similarity:.4f} | "
            f"Matched pose: {str(result.pose):<10}"
        )


def main() -> None:
    print("Vision Studio - PostgreSQL Vector Recognition")

    test_person("aditya.npz")
    test_person("ashutosh.npz")


if __name__ == "__main__":
    main()