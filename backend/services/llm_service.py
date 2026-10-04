import os
import time
import logging
import re
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

def process_chunk_with_retry(chunk_text: str, chunk_index: int, total_chunks: int, model_name: str, max_retries: int = 4) -> GenerationResult:
    prompt = f"""
    Sen uzman bir akademik asistansın. Görevin verilen ders notu bölümünden çalışma materyalleri üretmektir.
    Bu metin belgenin {chunk_index}/{total_chunks}. bölümüdür.

    JSON KURALLARI (ÇOK ÖNEMLİ):
    - Metin değerleri içinde KESİNLİKLE çift tırnak (") karakteri kullanma. Formül, kod veya vurguları tek tırnak (') ya da ters tırnak (`) içine al.
    - Çıktı kesinlikle hatasız ve geçerli bir JSON objesi olmalıdır.

    İÇERİK KURALLARI:
    1. ÖZET: Bu bölümdeki kritik noktaları içeren alt başlıklı (Markdown ## ve ###) detaylı bir özet çıkar. Yapay 'Bölüm 1' gibi başlıklar atma.
    2. FLASHCARD: Bu bölümün kritik kavramlarını sorgulayan en az 3-5 adet bilgi kartı üret (soru ve cevap).
    3. QUIZ: Bu bölümdeki kavramları ölçen 2-3 adet çoktan seçmeli soru hazırla (soru, secenekler, dogru_cevap_index, aciklama).
    4. ÖĞRETİCİLİK SKORU: 0-100 arası skor ve kısa geribildirim sun.

    Şema yapısı (GenerationResult):
    {GenerationResult.model_json_schema()}

    KAYNAK METİN:
    {chunk_text}
    """

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "Sen geçerli JSON üreten bir eğitim asistanısın. Çıktı alanları içinde asla çift tırnak kullanma."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            return GenerationResult.model_validate_json(response.choices[0].message.content)

        except RateLimitError:
            wait_time = (attempt + 1) * 3
            logger.warning(f"Limit koruması: {wait_time}s bekleniyor...")
            time.sleep(wait_time)
        except Exception as e:
            if "429" in str(e):
                time.sleep((attempt + 1) * 3)
            elif "json_validate_failed" in str(e) or "400" in str(e):
                logger.warning(f"JSON format hatası, yeniden deneniyor ({attempt + 1}/{max_retries})...")
                time.sleep(1)
            else:
                raise e

    raise RuntimeError(f"Parça {chunk_index} işlenemedi. Lütfen tekrar deneyin.")

def generate_study_material(document_text: any, file_name: str = "Bilinmeyen Dosya", *args, **kwargs) -> GenerationResult:
    try:
        # JSON formatına en sadık ve kotası rahat model
        model_name = 'qwen/qwen3.8-27b'

        text_content = (
            document_text.text
            if hasattr(document_text, "text")
            else str(document_text)
        )

        chunks = split_text_into_chunks(text_content)
        total_chunks = len(chunks)
        logger.info(f"Belge analiz ediliyor: {total_chunks} parça.")

        if total_chunks == 1:
            raw_result = process_chunk_with_retry(chunks[0], 1, 1, model_name)
            res_dict = raw_result.model_dump()
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
                chunk_result = process_chunk_with_retry(chunk, i, total_chunks, model_name)
                
                res_dict = chunk_result.model_dump()
                cleaned_summary = clean_escaped_text(res_dict.get('ozet_markdown', ''))
                if cleaned_summary:
                    combined_summaries.append(cleaned_summary)

                combined_flashcards.extend(res_dict.get('flashcards', []))
                combined_quizzes.extend(res_dict.get('quiz', []))
                
                score_obj = res_dict.get('ogreticilik_degerlendirmesi', {})
                last_score_obj = score_obj.copy()
                total_score += score_obj.get('skor', 80)
                
                fb = score_obj.get('geribildirim') or score_obj.get('gerekce') or ""
                if fb:
                    feedback_list.append(clean_escaped_text(fb))

                if i < total_chunks:
                    time.sleep(3)

            avg_score = round(total_score / total_chunks)
            consolidated_feedback = (
                f"Döküman genelinde teorik kavramlar analiz edilmiştir. "
                f"Özet notlar: {' '.join(feedback_list[:3])}"
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