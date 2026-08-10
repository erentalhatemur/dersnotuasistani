"""
Dosya uzantısını doğru extractor modülüne yönlendirir.
Yeni format eklemek için: yeni extractor dosyası yaz + buraya tek satır ekle.
"""

from . import docx_extractor, image_extractor, pdf_extractor, pptx_extractor
from .base import ExtractionError, ExtractionResult

_EXTENSION_MAP = {
    ".pdf": pdf_extractor.extract,
    ".docx": docx_extractor.extract,
    ".pptx": pptx_extractor.extract,
    ".jpg": image_extractor.extract,
    ".jpeg": image_extractor.extract,
    ".png": image_extractor.extract,
    ".webp": image_extractor.extract,
}

SUPPORTED_EXTENSIONS = sorted(_EXTENSION_MAP.keys())


def extract_from_file(path: str, extension: str) -> ExtractionResult:
    ext = extension.lower()
    if ext not in _EXTENSION_MAP:
        raise ExtractionError(
            f"Desteklenmeyen dosya türü: {ext}. Desteklenenler: {', '.join(SUPPORTED_EXTENSIONS)}"
        )
    return _EXTENSION_MAP[ext](path)
