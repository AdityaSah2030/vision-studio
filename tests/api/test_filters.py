import io
import cv2
import numpy as np
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_ascii_filter_endpoint():
    # Create a small synthetic test image (64x64)
    img = np.zeros((64, 64, 3), dtype=np.uint8)
    cv2.circle(img, (32, 32), 20, (255, 255, 255), -1)
    _, encoded = cv2.imencode(".jpg", img)

    response = client.post(
        "/api/filters/ascii",
        params={"width": 60},
        files={
            "image": (
                "face.jpg",
                encoded.tobytes(),
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "ascii_text" in data
    assert data["width"] == 60
    assert data["height"] > 0
    assert len(data["ascii_text"]) > 0


def test_ascii_filter_invalid_image():
    response = client.post(
        "/api/filters/ascii",
        files={
            "image": (
                "bad.jpg",
                b"not-an-image",
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 400
