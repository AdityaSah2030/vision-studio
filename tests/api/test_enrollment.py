from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.api.routes import enrollment_service
from backend.app.services.exceptions import (
    DuplicatePoseError,
    UserNotFoundError,
)


client = TestClient(app)


def test_enrollment_user_not_found(monkeypatch):
    def fake_enroll_embedding(
        db,
        user_id,
        pose,
        image_bytes,
    ):
        raise UserNotFoundError("User not found.")

    monkeypatch.setattr(
        enrollment_service,
        "enroll_embedding",
        fake_enroll_embedding,
    )

    response = client.post(
        "/api/enrollment/999/embedding",
        params={"pose": "CENTER"},
        files={
            "image": (
                "test.jpg",
                b"fake-image",
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found."


def test_enrollment_duplicate_pose(monkeypatch):
    def fake_enroll_embedding(
        db,
        user_id,
        pose,
        image_bytes,
    ):
        raise DuplicatePoseError(
            "Pose 'CENTER' has already been enrolled for this user."
        )

    monkeypatch.setattr(
        enrollment_service,
        "enroll_embedding",
        fake_enroll_embedding,
    )

    response = client.post(
        "/api/enrollment/1/embedding",
        params={"pose": "CENTER"},
        files={
            "image": (
                "test.jpg",
                b"fake-image",
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 409
    assert "already been enrolled" in response.json()["detail"]