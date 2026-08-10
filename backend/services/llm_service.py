import os
import logging
from google import genai
from google.genai import types
from models.schemas import GenerationResult

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    logger.warning("GEMINI_API_KEY bulunamadı! Lütfen .env dosyanızı kontrol edin.")

client = genai.Client(api_key=api_key)

def generate_study_material(document_text: any, *args, **kwargs) -> GenerationResult:
    try:
        model_name = 'gemini-pro-latest'

        text_content = (
            document_text.text
            if hasattr(document_text, "text")
            else str(document_text)
        )

        prompt = f"""
        Sen uzman bir akademik asistansın. Görevin, aşağıda verilen kaynak metni kullanarak 
        öğrencilerin konuyu derinlemesine ve kalıcı olarak öğrenmesini sağlayacak 
        maksimum "öğreticilik" (educational value) değerine sahip bir çalışma materyali oluşturmaktır.

        LÜTFEN KURALLARA KESİNLİKLE UY:
        1. ÖZET: Konunun hiçbir kritik noktasını atlamayan, alt başlıklarla (Markdown formatında ## ve ###) yapılandırılmış, çok detaylı bir özet çıkar.
        2. FLASHCARD: En az 15 adet bilgi kartı üret. Bunlar sadece basit tanımlar olmamalı; neden-sonuç ilişkilerini, kıyaslamaları ve temel prensipleri sorgulamalı.
        3. QUİZ: En az 10 adet çoktan seçmeli soru hazırla. Sorular analitik düşünmeyi gerektirmeli ve çeldiriciler çok güçlü olmalı.
        4. ÖĞRETİCİLİK SKORU: Ürettiğin bu materyallerin, orijinal metni ne kadar iyi kapsadığını ve öğrenciye ne kadar derinlikli bir vizyon kattığını değerlendir. 0-100 arası gerçekçi bir skor ver ve bu skoru neden verdiğini kısa, eleştirel bir dille açıkla.

        KAYNAK METİN:
        {text_content}
        """

        logger.info("Gemini API'ye yapılandırılmış JSON talebi gönderiliyor...")

        # Gemini'yi Pydantic şemamıza tam uyan bir JSON döndürmeye zorluyoruz
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GenerationResult,
                temperature=0.3,
            ),
        )
        
        # Gelen saf JSON metnini Pydantic model nesnesine çeviriyoruz
        result = GenerationResult.model_validate_json(response.text)
        
        logger.info(f"İçerik başarıyla üretildi! Skor: {result.ogreticilik_degerlendirmesi.skor}")
        return result

    except Exception as e:
        logger.error(f"LLM içerik üretimi sırasında hata oluştu: {str(e)}")
        raise e