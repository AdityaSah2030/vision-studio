import cv2
import numpy as np


def resize_frame(
    frame: np.ndarray,
    width: int = 640,
) -> np.ndarray:
    """Resize a frame while preserving its aspect ratio."""

    height, original_width = frame.shape[:2]

    if original_width == width:
        return frame

    aspect_ratio = height / original_width
    new_height = int(width * aspect_ratio)

    return cv2.resize(
        frame,
        (width, new_height),
        interpolation=cv2.INTER_AREA,
    )


def to_grayscale(frame: np.ndarray) -> np.ndarray:
    """Convert a BGR frame to grayscale."""

    return cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)


def enhance_contrast(
    gray_frame: np.ndarray,
    clip_limit: float = 2.0,
    grid_size: tuple[int, int] = (8, 8),
) -> np.ndarray:
    """Enhance local contrast using CLAHE."""

    clahe = cv2.createCLAHE(
        clipLimit=clip_limit,
        tileGridSize=grid_size,
    )

    return clahe.apply(gray_frame)


def denoise(
    gray_frame: np.ndarray,
    diameter: int = 9,
    sigma_color: float = 75,
    sigma_space: float = 75,
) -> np.ndarray:
    """Reduce noise while preserving edges."""

    return cv2.bilateralFilter(
        gray_frame,
        diameter,
        sigma_color,
        sigma_space,
    )


def detect_edges(
    gray_frame: np.ndarray,
    low_threshold: int = 50,
    high_threshold: int = 150,
) -> np.ndarray:
    """Detect edges using the Canny edge detector."""

    return cv2.Canny(
        gray_frame,
        low_threshold,
        high_threshold,
    )