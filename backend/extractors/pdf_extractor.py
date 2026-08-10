"""
PDF'lerden metin çıkarır. Metin katmanı çok zayıfsa (taranmış/görsel PDF ihtimali),
sayfaları görsele çevirip Claude'un vision özelliğine bırakır - ayrı bir OCR
kütüphanesine (Tesseract vb.) ihtiyaç duymadan, daha yüksek doğrulukla.
"""

import base64
import io

import pdfplumber

from .base import ExtractionError, ExtractionResult

# Bir sayfa bu kadar karakterin altında metin veriyorsa "muhtemelen taranmış" say.
MIN_CHARS_PER_PAGE_THRESHOLD = 40
# Vision'a gönderilecek maksimum sayfa sayısı (maliyet/performans için sınır).
MAX_IMAGE_PAGES = 20


def extract(path: str) -> ExtractionResult:
    try:
        text_parts: list[str] = []
        low_text_pages: list[int] = []

        with pdfplumber.open(path) as pdf:
            total_pages = len(pdf.pages)
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text() or ""
                text_parts.append(page_text)
                if len(page_text.strip()) < MIN_CHARS_PER_PAGE_THRESHOLD:
                    low_text_pages.append(i)

        raw_text = "\n\n".join(text_parts)
        images_base64: list[str] = []

        # Sayfaların çoğu metin-fakirse, muhtemelen taranmış bir PDF'tir -> görsel olarak da gönder.
        scanned_ratio = len(low_text_pages) / max(total_pages, 1)
        if scanned_ratio > 0.5:
            images_base64 = _render_pages_as_images(path, low_text_pages[:MAX_IMAGE_PAGES])

        return ExtractionResult(
            raw_text=raw_text,
            images_base64=images_base64,
            metadata={"total_pages": total_pages, "scanned_ratio": round(scanned_ratio, 2)},
        )
    except Exception as e:  # pypdf/pdfplumber çeşitli hata tipleri fırlatabilir
        raise ExtractionError(f"PDF işlenemedi: {e}") from e


def _render_pages_as_images(path: str, page_indices: list[int]) -> list[str]:
    """Belirtilen sayfaları PNG'ye render edip base64 döndürür."""
    import pdfplumber

    images: list[str] = []
    with pdfplumber.open(path) as pdf:
        for i in page_indices:
            page = pdf.pages[i]
            im = page.to_image(resolution=150).original
            buf = io.BytesIO()
            im.save(buf, format="PNG")
            images.append(base64.b64encode(buf.getvalue()).decode("utf-8"))
    return images
