import cv2
import numpy as np

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.api.schemas import (
    EnrollmentPose,
    EnrollmentUserCreate,
    EnrollmentUserResponse,
    RecognitionResponse,
)
from backend.app.cv.database_recognition import DatabaseRecognizer
from backend.app.cv.face_analyzer import FaceAnalyzer
from backend.app.db.models import FaceEmbedding, User
from backend.app.db.session import get_db

router = APIRouter(prefix="/api")

face_analyzer = FaceAnalyzer()
database_recognizer = DatabaseRecognizer()


@router.get("/health")
def health():
    return {
        "status": "ok",
        "service": "vision-studio",
    }


@router.post(
    "/enrollment/user",
    response_model=EnrollmentUserResponse,
    status_code=201,
)
def create_enrollment_user(
    user_data: EnrollmentUserCreate,
    db: Session = Depends(get_db),
):
    user = User(
        name=user_data.name,
        email=str(user_data.email),
        phone=user_data.phone,
        date_of_birth=user_data.date_of_birth,
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="A user with this email or phone already exists.",
        )
    return user


@router.post("/enrollment/{user_id}/embedding")
async def enroll_face_embedding(
    user_id: int,
    pose: EnrollmentPose,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Verify user exists.
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    # Prevent duplicate poses for the same user.
    existing_embedding = db.scalar(
        select(FaceEmbedding).where(
            FaceEmbedding.user_id == user_id,
            FaceEmbedding.pose == pose,
        )
    )

    if existing_embedding is not None:
        raise HTTPException(
            status_code=409,
            detail=f"Pose '{pose}' has already been enrolled for this user.",
        )

    # Read uploaded image.
    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty.",
        )

    # Decode image into an OpenCV BGR frame.
    frame = cv2.imdecode(
        np.frombuffer(image_bytes, dtype=np.uint8),
        cv2.IMREAD_COLOR,
    )

    if frame is None:
        raise HTTPException(
            status_code=400,
            detail="Could not decode the uploaded image.",
        )

    # Detect and analyze faces.
    faces = face_analyzer.analyze(frame)

    if len(faces) == 0:
        raise HTTPException(
            status_code=400,
            detail="No face detected.",
        )

    if len(faces) > 1:
        raise HTTPException(
            status_code=400,
            detail="Multiple faces detected. Please provide an image with exactly one face.",
        )

    face = faces[0]

    # InsightFace provides a normalized 512-dimensional embedding.
    embedding = face.normed_embedding

    if embedding is None:
        raise HTTPException(
            status_code=400,
            detail="Could not generate a face embedding.",
        )

    embedding = np.asarray(
        embedding,
        dtype=np.float32,
    )

    if embedding.shape != (512,):
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected embedding shape: {embedding.shape}",
        )

    # Store embedding in PostgreSQL / pgvector.
    face_embedding = FaceEmbedding(
        user_id=user_id,
        embedding=embedding.tolist(),
        pose=pose,
    )

    db.add(face_embedding)
    db.commit()
    db.refresh(face_embedding)

    return {
        "message": "Face embedding enrolled successfully.",
        "user_id": user_id,
        "pose": pose,
        "embedding_id": face_embedding.id,
    }
    

@router.post(
    "/recognition",
    response_model=RecognitionResponse,
)
async def recognize_face(
    image: UploadFile = File(...),
):
    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty.",
        )

    frame = cv2.imdecode(
        np.frombuffer(
            image_bytes,
            dtype=np.uint8,
        ),
        cv2.IMREAD_COLOR,
    )

    if frame is None:
        raise HTTPException(
            status_code=400,
            detail="Could not decode the uploaded image.",
        )

    faces = face_analyzer.analyze(frame)

    if len(faces) == 0:
        raise HTTPException(
            status_code=400,
            detail="No face detected.",
        )

    if len(faces) > 1:
        raise HTTPException(
            status_code=400,
            detail="Multiple faces detected. Please provide an image with exactly one face.",
        )

    face = faces[0]

    embedding = face.normed_embedding

    if embedding is None:
        raise HTTPException(
            status_code=500,
            detail="Could not generate a face embedding.",
        )

    embedding = np.asarray(
        embedding,
        dtype=np.float32,
    )

    if embedding.shape != (512,):
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected embedding shape: {embedding.shape}",
        )

    result = database_recognizer.recognize(embedding)

    return RecognitionResponse(
        recognized=result.name is not None,
        user_id=result.user_id,
        name=result.name,
        similarity=result.similarity,
        best_similarity=result.best_similarity,
        pose=result.pose,
    )