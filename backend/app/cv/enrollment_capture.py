import time

import cv2
import numpy as np

from backend.app.cv.camera import Camera
from backend.app.cv.face_analyzer import FaceAnalyzer

import argparse


POSES = [
    ("CENTER", "Look straight at the camera"),
    ("LEFT", "Slowly turn your head LEFT"),
    ("RIGHT", "Slowly turn your head RIGHT"),
    ("UP", "Slowly look UP"),
    ("DOWN", "Slowly look DOWN"),
    ("CENTER_2", "Return to the CENTER"),
]

COUNTDOWN_SECONDS = 3
CAPTURE_DURATION = 5


def draw_text(
    frame: np.ndarray,
    text: str,
    position: tuple[int, int],
    scale: float = 0.8,
    thickness: int = 2,
) -> None:
    """Draw readable text on the frame."""

    cv2.putText(
        frame,
        text,
        position,
        cv2.FONT_HERSHEY_SIMPLEX,
        scale,
        (0, 255, 0),
        thickness,
        cv2.LINE_AA,
    )


def show_instruction(
    frame: np.ndarray,
    pose_name: str,
    instruction: str,
    remaining: float | None = None,
) -> np.ndarray:
    """Add enrollment information to the frame."""

    output = frame.copy()

    draw_text(
        output,
        "FACE ENROLLMENT",
        (20, 35),
        1.0,
        2,
    )

    draw_text(
        output,
        f"Pose: {pose_name}",
        (20, 75),
        0.8,
    )

    draw_text(
        output,
        instruction,
        (20, 110),
        0.65,
    )

    if remaining is not None:
        draw_text(
            output,
            f"Time: {remaining:.1f}s",
            (20, 145),
            0.7,
        )

    return output


def draw_faces(
    frame: np.ndarray,
    faces,
) -> np.ndarray:
    """Draw detected face bounding boxes."""

    output = frame.copy()

    for face in faces:
        x1, y1, x2, y2 = face.bbox.astype(int)

        cv2.rectangle(
            output,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            2,
        )

    return output


def countdown(
    camera: Camera,
    analyzer: FaceAnalyzer,
    pose_name: str,
    instruction: str,
) -> bool:
    """Run a short countdown before capture."""

    start_time = time.monotonic()

    while True:
        elapsed = time.monotonic() - start_time
        remaining = COUNTDOWN_SECONDS - elapsed

        if remaining <= 0:
            return True

        frame = camera.read()
        faces = analyzer.analyze(frame)

        output = draw_faces(frame, faces)

        output = show_instruction(
            output,
            pose_name,
            instruction,
            remaining,
        )

        number = max(1, int(np.ceil(remaining)))

        draw_text(
            output,
            str(number),
            (
                output.shape[1] // 2 - 20,
                output.shape[0] // 2,
            ),
            2.5,
            4,
        )

        cv2.imshow(
            "Vision Studio - Face Enrollment",
            output,
        )

        key = cv2.waitKey(1) & 0xFF

        if key == ord("q"):
            return False


def capture_pose(
    camera: Camera,
    analyzer: FaceAnalyzer,
    pose_name: str,
    instruction: str,
) -> np.ndarray | None:
    """Capture one face embedding during a pose."""

    if not countdown(
        camera,
        analyzer,
        pose_name,
        instruction,
    ):
        return None

    start_time = time.monotonic()
    best_embedding = None
    best_score = -1.0

    while True:
        elapsed = time.monotonic() - start_time
        remaining = CAPTURE_DURATION - elapsed

        if remaining <= 0:
            break

        frame = camera.read()
        faces = analyzer.analyze(frame)

        output = draw_faces(frame, faces)

        output = show_instruction(
            output,
            pose_name,
            instruction,
            remaining,
        )

        if len(faces) == 1:
            face = faces[0]

            score = float(face.det_score)

            if score > best_score:
                best_score = score
                best_embedding = np.asarray(
                    face.embedding,
                    dtype=np.float32,
                )

            draw_text(
                output,
                f"Face detected | Confidence: {score:.2f}",
                (20, 180),
                0.65,
            )

        elif len(faces) == 0:
            draw_text(
                output,
                "No face detected",
                (20, 180),
                0.65,
            )

        else:
            draw_text(
                output,
                "Please keep only one person in frame",
                (20, 180),
                0.65,
            )

        cv2.imshow(
            "Vision Studio - Face Enrollment",
            output,
        )

        key = cv2.waitKey(1) & 0xFF

        if key == ord("q"):
            return None

    return best_embedding


def parse_args():
    parser = argparse.ArgumentParser(
        description="Capture guided face enrollment embeddings."
    )

    parser.add_argument(
        "--name",
        required=True,
        help="Name used for the local enrollment file.",
    )

    return parser.parse_args()


def main(name: str):
    print("Vision Studio - Guided Face Enrollment")
    print()
    print("Press SPACE to start enrollment.")
    print("Press Q to quit.")
    print()

    camera = Camera()
    analyzer = FaceAnalyzer()

    try:
        while True:
            frame = camera.read()

            faces = analyzer.analyze(frame)

            output = draw_faces(frame, faces)

            draw_text(
                output,
                "FACE ENROLLMENT",
                (20, 40),
                1.0,
                2,
            )

            draw_text(
                output,
                "Press SPACE to begin",
                (20, 80),
                0.8,
            )

            draw_text(
                output,
                "Press Q to quit",
                (20, 115),
                0.65,
            )

            cv2.imshow(
                "Vision Studio - Face Enrollment",
                output,
            )

            key = cv2.waitKey(1) & 0xFF

            if key == ord("q"):
                break

            if key == ord(" "):
                print("\nStarting enrollment...\n")

                embeddings = {}

                for pose_name, instruction in POSES:
                    print(
                        f"Preparing: {pose_name} "
                        f"-> {instruction}"
                    )

                    embedding = capture_pose(
                        camera,
                        analyzer,
                        pose_name,
                        instruction,
                    )

                    if embedding is None:
                        print("Enrollment cancelled.")
                        return

                    embeddings[pose_name] = embedding

                    print(
                        f"Captured {pose_name}: "
                        f"{embedding.shape}"
                    )

                output_dir = "data/enrollments"

                import os
                os.makedirs(output_dir, exist_ok=True)

                output_path = os.path.join(
                    output_dir,
                    f"{name.lower()}.npz",
                )

                np.savez(
                    output_path,
                    **embeddings,
                )

                print("\nEnrollment complete.")
                print(
                    f"Captured {len(embeddings)} embeddings."
                )
                print(
                    f"Saved to: {output_path}"
                )

                break

    finally:
        camera.release()




if __name__ == "__main__":
    args = parse_args()
    main(args.name)