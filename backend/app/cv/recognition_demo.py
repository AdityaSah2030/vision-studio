import cv2
import numpy as np

from backend.app.cv.camera import Camera
from backend.app.cv.face_analyzer import FaceAnalyzer
from backend.app.cv.recognition import FaceRecognizer


def main():
    analyzer = FaceAnalyzer()
    camera = Camera()

    recognizer = FaceRecognizer(threshold=0.80)

    print("Vision Studio - Recognition Demo")
    print()
    print("SPACE → register current face as Aditya")
    print("R     → recognize current face")
    print("Q     → quit")
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

            cv2.imshow(
                "Vision Studio - Recognition",
                output,
            )

            key = cv2.waitKey(1) & 0xFF

            if key == ord("q"):
                break

            if key == ord(" ") and faces:
                embedding = np.asarray(
                    faces[0].embedding,
                    dtype=np.float32,
                )

                recognizer.register(
                    identity="Aditya",
                    embedding=embedding,
                )

                print("Registered: Aditya")

            if key == ord("r") and faces:
                embedding = np.asarray(
                    faces[0].embedding,
                    dtype=np.float32,
                )

                result = recognizer.recognize(embedding)

                print(
                    f"Identity: {result.identity} | "
                    f"Similarity: {result.similarity:.4f} | "
                    f"Recognized: {result.recognized}"
                )

    finally:
        camera.release()


if __name__ == "__main__":
    main()