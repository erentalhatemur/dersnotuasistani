import os
import time
import logging
from groq import Groq
from models.schemas import GenerationResult
from services.database import save_study_session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    logger.warning("GROQ_API_KEY bulunamadı! Lütfen .env dosyanızı kontrol edin.")

client = Groq(api_key=api_key)

# 3500 karakter ~850 token. 8000 TPM limitini asla zorlamaz.
CHUNK_CHAR_LIMIT = 3500  

def split_text_into_chunks(text: str, chunk_size: int = CHUNK_CHAR_LIMIT) -> list[str]:
    """Metni satır sonu olmasa dahi garanti olarak 3500 karakterlik parçalara böler."""
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

def process_chunk(chunk_text: str, chunk_index: int, total_chunks: int, model_name: str) -> GenerationResult:
    prompt = f"""
    Sen uzman bir akademik asistansın. Görevin, aşağıda verilen ders notu bölümünü kullanarak 
    öğrencilerin konuyu derinlemesine öğrenmesini sağlayacak çalışma materyalleri oluşturmaktır.
    
    Bu metin toplam {total_chunks} bölümden oluşan belgenin {chunk_index}. bölümüdür.

    LÜTFEN KURALLARA UY:
    1. ÖZET: Bu bölümdeki tüm kritik noktaları içeren alt başlıklı (Markdown ## ve ###) detaylı bir özet çıkar.
    2. FLASHCARD: Bu bölümün kritik kavramlarını sorgulayan en az 4-6 adet bilgi kartı (flashcard) üret.
    3. QUIZ: Bu bölümdeki kavramları ölçen analitik 3-4 adet çoktan seçmeli soru hazırla.
    4. ÖĞRETİCİLİK SKORU: Bu bölümün kapsayıcılığını 0-100 arası puanla ve açıklayıcı bir değerlendirme/geribildirim sun.

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

        if total_chunks == 1:
            result = process_chunk(chunks[0], 1, 1, model_name)
        else:
            combined_summaries = []
            combined_flashcards = []
            combined_quizzes = []
            total_score = 0
            feedback_list = []
            last_score_obj = {}

            for i, chunk in enumerate(chunks, start=1):
                logger.info(f"Parça {i}/{total_chunks} Groq API'ye gönderiliyor...")
                chunk_result = process_chunk(chunk, i, total_chunks, model_name)
                
                res_dict = chunk_result.model_dump()
                
                combined_summaries.append(f"## Bölüm {i}\n\n{res_dict.get('ozet_markdown', '')}")
                combined_flashcards.extend(res_dict.get('flashcards', []))
                combined_quizzes.extend(res_dict.get('quiz', []))
                
                score_obj = res_dict.get('ogreticilik_degerlendirmesi', {})
                last_score_obj = score_obj.copy()
                total_score += score_obj.get('skor', 80)
                
                # Model 'geribildirim' veya 'gerekce' hangisini döndürdüyse alıyoruz
                fb = score_obj.get('geribildirim') or score_obj.get('gerekce') or "Başarılı"
                feedback_list.append(f"Bölüm {i}: {fb}")

                if i < total_chunks:
                    logger.info("Dakikalık token kotasını korumak için 6 saniye bekleniyor...")
                    time.sleep(6)

            avg_score = round(total_score / total_chunks)
            merged_feedback = " | ".join(feedback_list)

            # Hem 'geribildirim' hem 'gerekce' alanını garantiye alıyoruz
            merged_score_dict = {
                **last_score_obj,
                "skor": avg_score,
                "geribildirim": merged_feedback,
                "gerekce": merged_feedback
            }

            merged_payload = {
                "ozet_markdown": "\n\n---\n\n".join(combined_summaries),
                "flashcards": combined_flashcards,
                "quiz": combined_quizzes,
                "ogreticilik_degerlendirmesi": merged_score_dict
            }
            result = GenerationResult.model_validate(merged_payload)

        logger.info(f"İçerik başarıyla üretildi! Toplam Soru: {len(result.quiz)}, Flashcard: {len(result.flashcards)}, Skor: {result.ogreticilik_degerlendirmesi.skor}")

        # Supabase veritabanına kayıt
        save_study_session(
            file_name=file_name,
            ai_score=result.ogreticilik_degerlendirmesi.skor,
            summary=result.ozet_markdown
        )
        logger.info("Çalışma oturumu Supabase veritabanına kaydedildi.")

        return result

    except Exception as e:
        logger.error(f"LLM içerik üretimi sırasında hata oluştu: {str(e)}")
        raise e