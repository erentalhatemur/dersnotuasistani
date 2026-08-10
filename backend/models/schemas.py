from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

# Kaybolan JobStatus Enum sınıfı
class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    DONE = "done"
    ERROR = "error"

class Flashcard(BaseModel):
    soru: str
    cevap: str

class QuizSoru(BaseModel):
    soru: str
    secenekler: List[str]
    dogru_cevap_index: int
    aciklama: str

# Yeni eklediğimiz öğreticilik değerlendirmesi
class OgreticilikDegerlendirmesi(BaseModel):
    skor: int = Field(description="İçeriğin öğreticilik kalitesi üzerinden 0-100 arası puan")
    geribildirim: str = Field(description="Bu skorun neden verildiğine dair kısa, analitik bir açıklama")

# Sonuç objemiz
class GenerationResult(BaseModel):
    ozet_markdown: str
    flashcards: List[Flashcard]
    quiz: List[QuizSoru]
    ogreticilik_degerlendirmesi: OgreticilikDegerlendirmesi

# İş takibi için kullanılan yanıt modeli
class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    result: Optional[GenerationResult] = None
    error_message: Optional[str] = None