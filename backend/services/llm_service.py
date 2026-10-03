import os
import time
import logging
import json
from groq import Groq
from models.schemas import GenerationResult, Flashcard, QuizQuestion, OgreticilikDegerlendirmesi
from services.database import save_study_session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    logger.warning("GROQ_API_KEY bulunamadı! Lütfen .env dosyanızı kontrol edin.")

client = Groq(api_key=api_key)

CHUNK_CHAR_LIMIT = 8000  # Yaklaşık 2000 token (Groq 7000 ITPM sınırının oldukça altında, güvenli limit)

def split_text_into_chunks(text: str, chunk_size: int = CHUNK_CHAR_LIMIT) -> list[str]:
    """Metni cümle veya paragrafları bölmemeye özen göstererek mantıksal parçalara ayırır."""
    paragraphs = text.split("\n")
    chunks = []
    current_chunk = []
    current_length = 0

    for paragraph in paragraphs:
        if current_length + len(paragraph) + 1 > chunk_size and current_chunk:
            chunks.append("\n".join(current_chunk))
            current_chunk = [paragraph]
            current_length = len(paragraph)
        else:
            current_chunk.append(paragraph)
            current_length += len(paragraph) + 1

    if current_chunk:
        chunks.append("\n".join(current_chunk))

    return chunks if chunks else [text]

def process_chunk(chunk_text: str, chunk_index: int, total_chunks: int, model_name: str) -> GenerationResult:
    """Belirli bir metin parçasını Groq API'ye gönderip yapılandırılmış JSON çıktısı alır."""
    prompt = f"""
    Sen uzman bir akademik asistansın. Görevin, aşağıda verilen ders notu bölümünü kullanarak 
    öğrencilerin konuyu derinlemesine öğrenmesini sağlayacak çalışma materyalleri oluşturmaktır.
    
    Bu metin toplam {total_chunks} bölümden oluşan belgenin {chunk_index}. bölümüdür.

    LÜTFEN KURALLARA UY:
    1. ÖZET: Bu bölümdeki tüm kritik noktaları içeren alt başlıklı (Markdown ## ve ###) detaylı bir özet çıkar.
    2. FLASHCARD: Bu bölümün kritik kavramlarını sorgulayan en az 6-8 adet bilgi kartı (flashcard) üret.
    3. QUIZ: Bu bölümdeki kavramları ölçen analitik 4-5 adet çoktan seçmeli soru hazırla.
    4. ÖĞRETİCİLİK SKORU: Bu bölümün kapsayıcılığını 0-100 arası puanla ve kısa gerekçe sun.

    LÜTFEN ÇIKTIYI KESİNLİKLE GEÇERLİ BİR JSON FORMATINDA VER. Başka açıklama metni ekleme.
    Şema şu yapıya uygun olmalıdır (GenerationResult):
    {GenerationResult.model_json_schema()}

    KAYNAK METİN (Bölüm {chunk_index}/{total_chunks}):
    {chunk_text}
    """

    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": "Sen JSON formatında çıktı veren uzman bir eğitim asistanısın."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )
    
    return GenerationResult.model_validate_json(response.choices[0].message.content)

def generate_study_material(document_text: any, file_name: str = "Bilinmeyen Dosya", *args, **kwargs) -> GenerationResult:
    try:
        model_name = 'openai/gpt-oss-120b'

        text_content = (
            document_text.text
            if hasattr(document_text, "text")
            else str(document_text)
        )

        chunks = split_text_into_chunks(text_content)
        total_chunks = len(chunks)
        logger.info(f"Belge analiz edildi: Toplam {len(text_content)} karakter, {total_chunks} parçaya bölündü.")

        # Tek parça ise doğrudan çalıştır
        if total_chunks == 1:
            result = process_chunk(chunks[0], 1, 1, model_name)
        else:
            # Çok parçalı metinler: Sırayla işle ve sonuçları harmanla
            combined_summaries = []
            combined_flashcards = []
            combined_quizzes = []
            total_score = 0
            explanations = []

            for i, chunk in enumerate(chunks, start=1):
                logger.info(f"Parça {i}/{total_chunks} Groq API'ye gönderiliyor...")
                chunk_result = process_chunk(chunk, i, total_chunks, model_name)
                
                combined_summaries.append(f"## Bölüm {i}\n\n{chunk_result.ozet_markdown}")
                combined_flashcards.extend(chunk_result.flashcards)
                combined_quizzes.extend(chunk_result.quiz)
                total_score += chunk_result.ogreticilik_degerlendirmesi.skor
                explanations.append(f"Bölüm {i}: {chunk_result.ogreticilik_degerlendirmesi.gerekce}")

                # Dakikalık RPM/TPM limitine takılmamak için parçalar arası kısa bekleme
                if i < total_chunks:
                    time.sleep(3)

            avg_score = round(total_score / total_chunks)
            merged_explanation = " | ".join(explanations)

            result = GenerationResult(
                ozet_markdown="\n\n---\n\n".join(combined_summaries),
                flashcards=combined_flashcards,
                quiz=combined_quizzes,
                ogreticilik_degerlendirmesi=OgreticilikDegerlendirmesi(
                    skor=avg_score,
                    gerekce=merged_explanation
                )
            )

        logger.info(f"İçerik başarıyla üretildi! Toplam Soru: {len(result.quiz)}, Flashcard: {len(result.flashcards)}, Skor: {result.ogreticilik_degerlendirmesi.skor}")

        # Supabase kaydı
        save_study_session(
            file_name=file_name,
            ai_score=result.ogreticilik_degerlendirmesi.skor,
            summary=result.ozet_markdown
        )
        logger.info("Çalışma oturumu başarıyla Supabase veritabanına kaydedildi.")

        return result

    except Exception as e:
        logger.error(f"LLM içerik üretimi sırasında hata oluştu: {str(e)}")
        raise e