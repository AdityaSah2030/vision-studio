from pathlib import Path

import numpy as np

from backend.app.cv.database_recognition import DatabaseRecognizer


BASE_DIR = Path(__file__).resolve().parents[2]
ENROLLMENT_DIR = BASE_DIR / "data" / "enrollments"


def test_person(filename: str) -> None:
    path = ENROLLMENT_DIR / filename
    data = np.load(path)

    recognizer = DatabaseRecognizer()

    print(f"\nTesting genuine samples: {filename}")

    for pose in data.files:
        result = recognizer.recognize(data[pose])

        print(
            f"{pose:<10} | "
            f"Predicted: {str(result.name):<20} | "
            f"Score: {result.similarity:.4f} | "
            f"Best: {result.best_similarity:.4f} | "
            f"Best pose: {str(result.pose):<10} | "
            f"Recognized: {result.name is not None}"
        )


def test_cross_person(filename: str, expected_person: str) -> None:
    path = ENROLLMENT_DIR / filename
    data = np.load(path)

    recognizer = DatabaseRecognizer()

    print(f"\nTesting impostor samples: {filename}")

    for pose in data.files:
        result = recognizer.recognize(data[pose])

        correctly_rejected = result.name is None

        print(
            f"{pose:<10} | "
            f"Predicted: {str(result.name):<20} | "
            f"Score: {result.similarity:.4f} | "
            f"Best: {result.best_similarity:.4f} | "
            f"Rejected: {correctly_rejected}"
        )


def main() -> None:
    print("Vision Studio - PostgreSQL User-Level Recognition")

    test_person("aditya.npz")
    test_person("ashutosh.npz")

    test_cross_person("aditya.npz", "ashutosh")
    test_cross_person("ashutosh.npz", "aditya")


if __name__ == "__main__":
    main()