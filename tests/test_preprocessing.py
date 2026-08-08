import numpy as np

from backend.app.cv.preprocessing import (
    detect_edges,
    enhance_contrast,
    resize_frame,
    to_grayscale,
)


def test_resize_frame():
    frame = np.zeros((480, 640, 3), dtype=np.uint8)

    resized = resize_frame(frame, width=320)

    assert resized.shape == (240, 320, 3)


def test_to_grayscale():
    frame = np.zeros((100, 100, 3), dtype=np.uint8)

    gray = to_grayscale(frame)

    assert gray.shape == (100, 100)


def test_contrast_enhancement():
    frame = np.zeros((100, 100), dtype=np.uint8)

    enhanced = enhance_contrast(frame)

    assert enhanced.shape == frame.shape


def test_edge_detection():
    frame = np.zeros((100, 100), dtype=np.uint8)

    edges = detect_edges(frame)

    assert edges.shape == frame.shape