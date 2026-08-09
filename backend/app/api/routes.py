from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
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
from backend.app.db.models import User
from backend.app.db.session import get_db
from backend.app.services.enrollment_service import EnrollmentService
from backend.app.services.recognition_service import RecognitionService


router = APIRouter(prefix="/api")


face_analyzer = FaceAnalyzer()
database_recognizer = DatabaseRecognizer()

enrollment_service = EnrollmentService(
    face_analyzer=face_analyzer,
)

recognition_service = RecognitionService(
    face_analyzer=face_analyzer,
    database_recognizer=database_recognizer,
)


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
    image_bytes = await image.read()

    try:
        face_embedding = enrollment_service.enroll_embedding(
            db=db,
            user_id=user_id,
            pose=pose,
            image_bytes=image_bytes,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

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

    try:
        result = recognition_service.recognize(
            image_bytes=image_bytes,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    return RecognitionResponse(
        recognized=result.name is not None,
        user_id=result.user_id,
        name=result.name,
        similarity=result.similarity,
        best_similarity=result.best_similarity,
        pose=result.pose,
    )