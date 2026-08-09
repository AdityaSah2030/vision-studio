class EnrollmentError(Exception):
    """Base exception for enrollment failures."""


class UserNotFoundError(EnrollmentError):
    """Raised when the requested user does not exist."""


class DuplicatePoseError(EnrollmentError):
    """Raised when a pose is already enrolled for a user."""


class InvalidImageError(EnrollmentError):
    """Raised when the uploaded image is invalid."""


class FaceDetectionError(EnrollmentError):
    """Raised when face detection fails."""