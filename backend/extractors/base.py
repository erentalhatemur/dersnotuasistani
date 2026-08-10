"""
Tüm extractor'ların uyması gereken ortak arayüz.

Yeni bir dosya formatı eklemek istediğinde tek yapman gereken:
1. Bu modüldeki ExtractionResult'ı döndüren bir extract(path) fonksiyonu yazmak
2. registry.py içinde uzantıyı yeni fonksiyona map'lemek

LLM tarafı (services/llm_service.py) hiçbir extractor detayını bilmez,
sadece ExtractionResult alır. Böylece formatlar birbirinden tamamen izole olur.
"""

from dataclasses import dataclass, field


@dataclass
class ExtractionResult:
    """Bir dosyadan çıkarılan ham içerik."""

    raw_text: str
    # Görsel içerik varsa (örn. slayt fotoğrafı, taranmış sayfa) base64 PNG/JPEG listesi.
    # Claude'un vision özelliği ile doğrudan işlenir; ayrı bir OCR adımına gerek kalmaz.
    images_base64: list[str] = field(default_factory=list)
    # Extractor bazlı ek bilgi (örn. sayfa sayısı, slayt sayısı) - loglama/debug için.
    metadata: dict = field(default_factory=dict)

    @property
    def is_empty(self) -> bool:
        return not self.raw_text.strip() and not self.images_base64


class ExtractionError(Exception):
    """Bir dosya işlenemediğinde fırlatılır (bozuk dosya, desteklenmeyen içerik vb.)."""
