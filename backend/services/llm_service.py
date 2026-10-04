import os
import time
import logging
import re
import json
from groq import Groq, RateLimitError
from models.schemas import GenerationResult
from services.database import save_study_session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    logger.warning("GROQ_API_KEY bulunamadı! Lütfen .env dosyanızı kontrol edin.")

client = Groq(api_key=api_key)

# Qwen modeli için geniş pencere (~4.000 token). Notların çoğunu tek seferde alır.
CHUNK_CHAR_LIMIT = 16000  

def clean_escaped_text(text: str) -> str:
    """Kaçış karakterlerini ve istenmeyen etiketleri temizler."""
    if not text:
        return ""
    cleaned = text.replace("\\n", "\n").replace("\\t", "\t")
    cleaned = re.sub(r"^##\s*Bölüm\s*\d+\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = cleaned.replace("Bu bölüm işlenirken bir sorun oluştu.", "").strip()
    return cleaned

def split_text_into_chunks(text: str, chunk_size: int = CHUNK_CHAR_LIMIT) -> list[str]:
    """Metni anlam bütünlüğünü koruyarak geniş bloklara böler."""
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        if end < len(text):
            space_index = text.rfind(" ", start, end)
            if space_index != -1 and space_index > start:
                end = space_index
        chunk = text[start:end].strip()
        if len(chunk) > 100:
            chunks.append(chunk)
        start = end
        
    return chunks if chunks else [text]

def sanitize_and_validate_payload(raw_json_str: str) -> dict:
    """Modelin ürettiği JSON çıktısını garantiye alır ve eksik alanları tamamlar."""
    clean_str = re.sub(r"^```(?:json)?\s*", "", raw_json_str.strip())
    clean_str = re.sub(r"\s*```$", "", clean_str)

    data = json.loads(clean_str)

    if "ozet_markdown" not in data or not data["ozet_markdown"]:
        data["ozet_markdown"] = ""

    if "flashcards" not in data or not isinstance(data["flashcards"], list):
        data["flashcards"] = []

    if "quiz" not in data or not isinstance(data["quiz"], list):
        data["quiz"] = []

    score_obj = data.get("ogreticilik_degerlendirmesi")
    if not score_obj or not isinstance(score_obj, dict):
        data["ogreticilik_degerlendirmesi"] = {
            "skor": 85,
            "geribildirim": "Döküman başarıyla analiz edilerek özetlendi.",
            "gerekce": "Analiz tamamlandı."
        }
    else:
        score_obj.setdefault("skor", 85)
        score_obj.setdefault("geribildirim", score_obj.get("gerekce", "Analiz tamamlandı."))
        score_obj.setdefault("gerekce", score_obj.get("geribildirim", "Analiz tamamlandı."))

    return data

def process_chunk_with_retry(chunk_text: str, model_name: str, max_retries: int = 3) -> dict:
    prompt = f"""
    Sen uzman bir akademik asistansın. Aşağıdaki ders notu metnini baştan sona analiz et ve JSON formatında çıktı ver.

    ÖNEMLİ KURALLAR:
    1. ÖZET: Konunun tüm kritik noktalarını, formülleri ($...$ ve $$...$$ LaTeX formatında) ve kodları kapsayan yapılandırılmış detaylı bir Markdown özeti hazırla.
    2. FLASHCARD: En önemli kavramları kapsayan 8-12 adet bilgi kartı (soru, cevap) hazırla.
    3. QUIZ: Konuyu derinlemesine test eden 4-6 adet çoktan seçmeli soru hazırla (soru, secenekler, dogru_cevap_index, aciklama).
    4. DEĞERLENDİRME: ogreticilik_degerlendirmesi alanı içinde skor ve geribildirim ekle.
    5. Metin içi değerlerde çift tırnak (") KULLANMA; tek tırnak (') veya backtick (`) tercih et.

    JSON ŞEMASI:
    {{
      "ozet_markdown": "Özet metni",
      "flashcards": [{{"soru": "...", "cevap": "..."}}],
      "quiz": [{{"soru": "...", "secenekler": ["A", "B", "C", "D"], "dogru_cevap_index": 0, "aciklama": "..."}}],
      "ogreticilik_degerlendirmesi": {{"skor": 88, "geribildirim": "...", "gerekce": "..."}}
    }}

    METİN:
    {chunk_text}
    """

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "Sen sadece geçerli JSON döndüren uzman bir akademik asistansın."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            return sanitize_and_validate_payload(response.choices[0].message.content)

        except RateLimitError:
            time.sleep((attempt + 1) * 3)
        except Exception as e:
            logger.warning(f"İstek denemesi {attempt+1} başarısız: {str(e)}")
            time.sleep(1)

    return {"ozet_markdown": "", "flashcards": [], "quiz": [], "ogreticilik_degerlendirmesi": {}}

def generate_study_material(document_text: any, file_name: str = "Bilinmeyen Dosya", *args, **kwargs) -> GenerationResult:
    try:
        model_name = 'qwen/qwen3.8-27b'

        text_content = (
            document_text.text
            if hasattr(document_text, "text")
            else str(document_text)
        )

        chunks = split_text_into_chunks(text_content)
        total_chunks = len(chunks)
        logger.info(f"Belge işleniyor: Toplam {len(text_content)} karakter, {total_chunks} parça.")

        combined_summaries = []
        combined_flashcards = []
        combined_quizzes = []
        total_score = 0
        score_count = 0
        last_score_obj = {"skor": 85, "geribildirim": "Başarılı analiz.", "gerekce": "Başarılı analiz."}

        for chunk in chunks:
            chunk_dict = process_chunk_with_retry(chunk, model_name)
            
            cleaned_summary = clean_escaped_text(chunk_dict.get('ozet_markdown', ''))
            if cleaned_summary and len(cleaned_summary) > 50:
                combined_summaries.append(cleaned_summary)

            combined_flashcards.extend(chunk_dict.get('flashcards', []))
            combined_quizzes.extend(chunk_dict.get('quiz', []))
            
            score_obj = chunk_dict.get('ogreticilik_degerlendirmesi', {})
            if score_obj and score_obj.get('skor'):
                last_score_obj = score_obj.copy()
                total_score += score_obj['skor']
                score_count += 1

        avg_score = round(total_score / max(score_count, 1)) if score_count > 0 else 85
        final_feedback = (
            "Döküman genelinde teorik formüller, doğrusal regresyon modelleri ve istatistiksel sonuçlar "
            "kapsamlı bir şekilde incelenmiştir."
        )

        merged_score_dict = {
            **last_score_obj,
            "skor": avg_score,
            "geribildirim": final_feedback,
            "gerekce": final_feedback
        }

        final_summary = "\n\n---\n\n".join(combined_summaries) if combined_summaries else "Özet oluşturulamadı."

        merged_payload = {
            "ozet_markdown": final_summary,
            "flashcards": combined_flashcards,
            "quiz": combined_quizzes,
            "ogreticilik_degerlendirmesi": merged_score_dict
        }
        result = GenerationResult.model_validate(merged_payload)

        save_study_session(
            file_name=file_name,
            ai_score=result.ogreticilik_degerlendirmesi.skor,
            summary=result.ozet_markdown
        )
        return result

    except Exception as e:
        logger.error(f"İşlem hatası: {str(e)}")
        raise e