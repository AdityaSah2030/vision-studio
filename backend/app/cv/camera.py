import time

import cv2

from backend.app.config import settings


class Camera:
    """Manage webcam capture for the Vision Studio CV pipeline."""

    def __init__(
        self,
        camera_index: int | None = None,
        width: int = 640,
        height: int = 480,
    ):
        self.camera_index = camera_index if camera_index is not None else settings.camera_index
        self.width = width
        self.height = height

        self.capture = cv2.VideoCapture(
            self.camera_index,
            cv2.CAP_DSHOW,
        )

        if not self.capture.isOpened():
            # If camera index 1 failed, try index 0 as fallback
            fallback_index = 0 if self.camera_index != 0 else 1
            fallback_cap = cv2.VideoCapture(fallback_index, cv2.CAP_DSHOW)
            if fallback_cap.isOpened():
                self.camera_index = fallback_index
                self.capture = fallback_cap
            else:
                fallback_cap.release()
                raise RuntimeError(
                    f"Unable to open camera with index {self.camera_index}"
                )

        self.capture.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
        self.capture.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)

        self._previous_frame_time = time.perf_counter()
        self._fps = 0.0

    def read(self):
        """Capture and return the next webcam frame."""

        success, frame = self.capture.read()

        if not success:
            raise RuntimeError("Failed to read frame from camera.")

        self._update_fps()

        return frame

    def _update_fps(self):
        """Update the estimated camera FPS."""

        current_time = time.perf_counter()
        elapsed = current_time - self._previous_frame_time

        if elapsed > 0:
            current_fps = 1 / elapsed

            # Smooth the FPS value to reduce fluctuations.
            self._fps = (
                0.9 * self._fps
                + 0.1 * current_fps
                if self._fps > 0
                else current_fps
            )

        self._previous_frame_time = current_time

    @property
    def fps(self) -> float:
        """Return the current estimated FPS."""

        return self._fps

    def release(self):
        """Release the webcam."""

        if self.capture.isOpened():
            self.capture.release()

        cv2.destroyAllWindows()