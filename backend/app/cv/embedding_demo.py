import cv2
import numpy as np

from backend.app.cv.camera import Camera
from backend.app.cv.face_analyzer import FaceAnalyzer


def main():
    print("Initializing face analysis model...")

    analyzer = FaceAnalyzer()
    camera = Camera()

    print("Move your face into the camera.")
    print("Press SPACE to capture an embedding.")
    print("Press Q to quit.")

    try:
        while True:
            frame = camera.read()
            faces = analyzer.analyze(frame)

            output = frame.copy()

            for index, face in enumerate(faces):
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
                    f"Face {index + 1}",
                    (x1, max(y1 - 10, 20)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
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

            cv2.imshow(
                "Vision Studio - Embedding Test",
                output,
            )

            key = cv2.waitKey(1) & 0xFF

            if key == ord("q"):
                break

            if key == ord(" ") and faces:
                face = faces[0]

                embedding = np.asarray(face.embedding)

                print("\n--- Face Embedding ---")
                print(f"Shape: {embedding.shape}")
                print(f"Data type: {embedding.dtype}")
                print(f"Dimensions: {embedding.size}")
                print(f"Norm: {np.linalg.norm(embedding):.4f}")
                print("First 10 values:")
                print(embedding[:10])
                print("----------------------\n")

    finally:
        camera.release()


if __name__ == "__main__":
    main()