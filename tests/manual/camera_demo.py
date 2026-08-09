import cv2

from backend.app.cv.camera import Camera
from backend.app.cv.preprocessing import (
    enhance_contrast,
    resize_frame,
    to_grayscale,
)


def main():
    camera = Camera()

    print("Camera started.")
    print("Press Q to quit.")

    try:
        while True:
            frame = camera.read()

            frame = resize_frame(frame, width=640)

            gray = to_grayscale(frame)
            processed = enhance_contrast(gray)

            cv2.putText(
                processed,
                f"FPS: {camera.fps:.1f}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                255,
                2,
            )

            cv2.imshow("Vision Studio - CV Pipeline", processed)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    finally:
        camera.release()


if __name__ == "__main__":
    main()