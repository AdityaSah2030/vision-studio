import cv2
import numpy as np

from backend.app.cv.camera import Camera
from backend.app.cv.face_analyzer import FaceAnalyzer
from backend.app.cv.embedding import cosine_similarity


def main():
    analyzer = FaceAnalyzer()
    camera = Camera()

    reference_embedding = None

    print("Embedding comparison demo")
    print()
    print("SPACE  → capture/reference face")
    print("C      → compare current face with reference")
    print("Q      → quit")
    print()

    try:
        while True:
            frame = camera.read()
            faces = analyzer.analyze(frame)

            output = frame.copy()

            for face in faces:
                x1, y1, x2, y2 = face.bbox.astype(int)

                cv2.rectangle(
                    output,
                    (x1, y1),
                    (x2, y2),
                    (0, 255, 0),
                    2,
                )

            cv2.putText(
                output,
                f"Faces: {len(faces)}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 0),
                2,
            )

            if reference_embedding is not None:
                cv2.putText(
                    output,
                    "Reference captured",
                    (10, 60),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 0),
                    2,
                )

            cv2.imshow(
                "Vision Studio - Embedding Comparison",
                output,
            )

            key = cv2.waitKey(1) & 0xFF

            if key == ord("q"):
                break

            if key == ord(" ") and faces:
                reference_embedding = np.asarray(
                    faces[0].embedding,
                    dtype=np.float32,
                )

                print("\nReference embedding captured.")
                print(f"Shape: {reference_embedding.shape}")

            if key == ord("c") and faces and reference_embedding is not None:
                current_embedding = np.asarray(
                    faces[0].embedding,
                    dtype=np.float32,
                )

                similarity = cosine_similarity(
                    reference_embedding,
                    current_embedding,
                )

                print(
                    f"\nCosine similarity: {similarity:.4f}"
                )

    finally:
        camera.release()


if __name__ == "__main__":
    main()