from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


EnrollmentPose = Literal[
    "CENTER",
    "LEFT",
    "RIGHT",
    "UP",
    "DOWN",
    "CENTER_2",
]


class EnrollmentUserCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100,
    )
    email: EmailStr
    phone: str = Field(
        min_length=7,
        max_length=20,
    )
    date_of_birth: date


class EnrollmentUserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str
    date_of_birth: date


class RecognitionResponse(BaseModel):
    recognized: bool
    user_id: int | None
    name: str | None
    similarity: float
    best_similarity: float
    pose: str | None