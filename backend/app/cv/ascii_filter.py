import io
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

DEFAULT_ASCII_CHARS = ["@", "#", "%", "*", "+", "=", "-", ":", ".", " "]


def process_image_to_ascii(
    image: np.ndarray,
    width: int = 120,
    chars: list[str] | None = None,
    contrast_boost: bool = True,
) -> str:
    """
    Convert an image frame (BGR or RGB) into formatted ASCII art.
    Uses bilateral filtering and CLAHE for optimized clarity on facial features.
    """
    if chars is None:
        chars = DEFAULT_ASCII_CHARS

    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image

    # Bilateral filter reduces noise while preserving strong edges
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)

    if contrast_boost:
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)
    else:
        enhanced = denoised

    # Aspect ratio adjustment for monospace characters (character height > width)
    h, w = enhanced.shape
    aspect_ratio = h / w
    new_h = max(1, int(aspect_ratio * width * 0.55))
    resized = cv2.resize(enhanced, (width, new_h), interpolation=cv2.INTER_AREA)

    # Map grayscale pixels (0-255) to ASCII character set
    num_chars = len(chars)
    pixels = resized.flatten()
    ascii_chars = [chars[min(int(p) * num_chars // 256, num_chars - 1)] for p in pixels]
    ascii_str = "".join(ascii_chars)

    # Break into line-separated rows
    lines = [ascii_str[i : i + width] for i in range(0, len(ascii_str), width)]
    return "\n".join(lines)


def render_ascii_to_png(ascii_text: str, font_size: int = 8) -> bytes:
    """
    Render ASCII text lines into a PNG image byte buffer.
    """
    lines = ascii_text.split("\n")
    font = ImageFont.load_default()

    line_height = font_size + 2
    max_line_len = max(len(line) for line in lines) if lines else 0
    img_width = max(10, max_line_len * (font_size // 2 + 3))
    img_height = max(10, len(lines) * line_height)

    img = Image.new("RGB", (img_width, img_height), color="black")
    draw = ImageDraw.Draw(img)

    y = 0
    for line in lines:
        draw.text((0, y), line, fill="#00FF66", font=font)
        y += line_height

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()
