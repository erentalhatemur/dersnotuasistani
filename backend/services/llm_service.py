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

CHUNK_CHAR_LIMIT = 2800  

def clean_escaped_text(text: str) -> str:
    """JSON içinden gelen kaçış karakterlerini (\n, \t) gerçek satır sonuna çevirir."""
    if not text:
        return ""
    cleaned = text.replace("\\n", "\n").replace("\\t", "\t")
    cleaned = re.sub(r"^##\s*Bölüm\s*\d+\s*", "", cleaned, flags=re.MULTILINE)
    return cleaned.strip()

def split_text_into_chunks(text: str, chunk_size: int = CHUNK_CHAR_LIMIT) -> list[str]:
    """Metni kelime bütünlüğünü koruyarak güvenli parçalara böler."""
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
        if chunk:
            chunks.append(chunk)
        start = end
        
    return chunks if chunks else [text]

def sanitize_and_validate_payload(raw_json_str: str) -> dict:
    """Modelin ürettiği JSON'daki eksik alanları tamamlar, Pydantic'in patlamasını önler."""
    data = json.loads(raw_json_str)

    # 1. Özet kontrolü
    if "ozet_markdown" not in data or not data["ozet_markdown"]:
        data["ozet_markdown"] = "Özet oluşturulamadı."

    # 2. Flashcard kontrolü
    if "flashcards" not in data or not isinstance(data["flashcards"], list):
        data["flashcards"] = []

    # 3. Quiz kontrolü
    if "quiz" not in data or not isinstance(data["quiz"], list):
        data["quiz"] = []

    # 4. Öğreticilik Değerlendirmesi kontrolü (Hatanın çıktığı asıl yer)
    score_obj = data.get("ogreticilik_degerlendirmesi")
    if not score_obj or not isinstance(score_obj, dict):
        # Model alternatif isimler kullanmış olabilir mi?
        alt_score = data.get("degerlendirme") or data.get("evaluation") or {}
        skor_val = alt_score.get("skor") or alt_score.get("score") or 85
        fb_val = alt_score.get("geribildirim") or alt_score.get("feedback") or "Materyal başarıyla işlendi ve özetlendi."
        
        data["ogreticilik_degerlendirmesi"] = {
            "skor": int(skor_val) if str(skor_val).isdigit() else 85,
            "geribildirim": str(fb_val),
            "gerekce": str(fb_val)
        }
    else:
        # Alan eksikliklerini doldur
        if "skor" not in score_obj:
            score_obj["skor"] = 85
        if "geribildirim" not in score_obj:
            score_obj["geribildirim"] = score_obj.get("gerekce", "Analiz tamamlandı.")
        if "gerekce" not in score_obj:
            score_obj["gerekce"] = score_obj.get("geribildirim", "Analiz tamamlandı.")

    return data

def process_chunk_with_retry(chunk_text: str, chunk_index: int, total_chunks: int, model_name: str, max_retries: int = 4) -> dict:
    prompt = f"""
    Sen uzman bir akademik asistansın. Görevin verilen ders notu bölümünden çalışma materyalleri üretmektir.
    Bu metin belgenin {chunk_index}/{total_chunks}. bölümüdür.

    JSON ŞEMASI (AŞAĞIDAKİ TÜM ALANLARI EKSİKSİZ DOLDURMALISIN):
    {{
      "ozet_markdown": "Detaylı konu özeti (Markdown ## ve ### başlıklarıyla)",
      "flashcards": [
        {{"soru": "Soru metni", "cevap": "Cevap metni"}}
      ],
      "quiz": [
        {{"soru": "Soru metni", "secenekler": ["A", "B", "C", "D"], "dogru_cevap_index": 0, "aciklama": "Açıklama"}}
      ],
      "ogreticilik_degerlendirmesi": {{
        "skor": 88,
        "geribildirim": "Konunun anlatım kalitesi değerlendirmesi",
        "gerekce": "Değerlendirme gerekçesi"
      }}
    }}

    KURALLAR:
    - Metin değerleri içinde çift tırnak (") KULLANMA. Gerekirse tek tırnak (') veya backtick (`) kullan.
    - 'ogreticilik_degerlendirmesi' alanını KESİNLİKLE JSON içine ekle, boş bırakma.
    - Başka hiçbir metin veya markdown bloğu (```json) ekleme, sadece saf JSON döndür.

    KAYNAK METİN:
    {chunk_text}
    """

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "Sen sadece geçerli JSON üreten bir eğitim asistanısın. Tüm şema alanlarını eksiksiz üret."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            raw_content = response.choices[0].message.content
            # JSON'ı doğrula ve eksik alan varsa güvenli hale getir
            sanitized_dict = sanitize_and_validate_payload(raw_content)
            return sanitized_dict

        except RateLimitError:
            wait_time = (attempt + 1) * 3
            logger.warning(f"Kota koruması: {wait_time}s bekleniyor...")
            time.sleep(wait_time)
        except Exception as e:
            if "429" in str(e):
                time.sleep((attempt + 1) * 3)
            elif "json_validate_failed" in str(e) or "400" in str(e):
                logger.warning(f"JSON format denemesi ({attempt + 1}/{max_retries})...")
                time.sleep(1)
            else:
                logger.warning(f"İstek hatası: {str(e)}, tekrar deneniyor...")
                time.sleep(1)

    # Hiçbir deneme başarılı olmazsa güvenli boş fallback şeması dön
    return {
        "ozet_markdown": "Bu bölüm işlenirken bir sorun oluştu.",
        "flashcards": [],
        "quiz": [],
        "ogreticilik_degerlendirmesi": {"skor": 75, "geribildirim": "İçerik kısmi işlendi.", "gerekce": "Parça işleme hatası."}
    }

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
        logger.info(f"Belge analiz ediliyor: Toplam {len(text_content)} karakter, {total_chunks} parça.")

        if total_chunks == 1:
            res_dict = process_chunk_with_retry(chunks[0], 1, 1, model_name)
            res_dict["ozet_markdown"] = clean_escaped_text(res_dict.get("ozet_markdown", ""))
            result = GenerationResult.model_validate(res_dict)
        else:
            combined_summaries = []
            combined_flashcards = []
            combined_quizzes = []
            total_score = 0
            feedback_list = []
            last_score_obj = {}

            for i, chunk in enumerate(chunks, start=1):
                logger.info(f"Parça {i}/{total_chunks} işleniyor...")
                chunk_dict = process_chunk_with_retry(chunk, i, total_chunks, model_name)
                
                cleaned_summary = clean_escaped_text(chunk_dict.get('ozet_markdown', ''))
                if cleaned_summary:
                    combined_summaries.append(cleaned_summary)

                combined_flashcards.extend(chunk_dict.get('flashcards', []))
                combined_quizzes.extend(chunk_dict.get('quiz', []))
                
                score_obj = chunk_dict.get('ogreticilik_degerlendirmesi', {})
                last_score_obj = score_obj.copy()
                total_score += score_obj.get('skor', 80)
                
                fb = score_obj.get('geribildirim') or score_obj.get('gerekce') or ""
                if fb:
                    feedback_list.append(clean_escaped_text(fb))

                if i < total_chunks:
                    time.sleep(2)

            avg_score = round(total_score / total_chunks)
            consolidated_feedback = (
                f"Döküman genelinde teorik kavramlar başarıyla analiz edilmiştir. "
                f"Bölüm notları: {' '.join(feedback_list[:2])}"
            )

            merged_score_dict = {
                **last_score_obj,
                "skor": avg_score,
                "geribildirim": consolidated_feedback,
                "gerekce": consolidated_feedback
            }

            merged_payload = {
                "ozet_markdown": "\n\n---\n\n".join(combined_summaries),
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