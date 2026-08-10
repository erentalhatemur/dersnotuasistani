"""
Görsel dosyaları (el yazısı not fotoğrafı, slayt ekran görüntüsü vb.) işler.
Ayrı bir OCR kütüphanesi kullanmıyoruz: Claude'un vision özelliği görseli
doğrudan okuyup metne çevirebiliyor ve genelde Tesseract gibi klasik OCR'dan
daha isabetli sonuç veriyor (özellikle el yazısı veya karışık düzenli slaytlarda).
"""

import base64

from PIL import Image

from .base import ExtractionError, ExtractionResult

MAX_DIMENSION = 1568  # Claude vision için önerilen üst sınır; büyük görseller gereksiz token harcar


def extract(path: str) -> ExtractionResult:
    try:
        with Image.open(path) as img:
            img = img.convert("RGB")
            img.thumbnail((MAX_DIMENSION, MAX_DIMENSION))

            import io

            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=88)
            encoded = base64.b64encode(buf.getvalue()).decode("utf-8")

        # raw_text boş bırakılıyor; metin çıkarımı LLM'in vision adımında yapılacak.
        return ExtractionResult(raw_text="", images_base64=[encoded], metadata={"source": "image"})
    except Exception as e:
        raise ExtractionError(f"Görsel işlenemedi: {e}") from e
