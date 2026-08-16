import os
import logging
from groq import Groq
from models.schemas import GenerationResult
from services.database import save_study_session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    logger.warning("GROQ_API_KEY bulunamadı! Lütfen .env dosyanızı kontrol edin.")

# Groq istemcisini başlatıyoruz
client = Groq(api_key=api_key)

def generate_study_material(document_text: any, file_name: str = "Bilinmeyen Dosya", *args, **kwargs) -> GenerationResult:
    try:
        # Groq'un en güçlü ve hızlı modellerinden biri (Llama 3.3 70B)
        model_name = 'llama-3.3-70b-versatile'

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

        LÜTFEN ÇIKTIYI KESİNLİKLE GEÇERLİ BİR JSON FORMATINDA VER. Başka hiçbir açıklama metni ekleme, doğrudan JSON ile başla. Şema şu yapıya uygun olmalıdır (GenerationResult):
        {GenerationResult.model_json_schema()}

        KAYNAK METİN:
        {text_content}
        """

        logger.info("Groq API'ye içerik talebi gönderiliyor...")

        # Groq çağrısı
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "Sen JSON formatında çıktı veren uzman bir eğitim asistanısın."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        
        response_text = response.choices[0].message.content

        # Gelen saf JSON metnini Pydantic model nesnesine çeviriyoruz
        result = GenerationResult.model_validate_json(response_text)
        
        logger.info(f"İçerik başarıyla üretildi! Skor: {result.ogreticilik_degerlendirmesi.skor}")
        
        # Üretilen materyali Supabase veritabanına kaydediyoruz
        logger.info(f"Supabase'e kaydediliyor... Dosya: {file_name}, Skor: {result.ogreticilik_degerlendirmesi.skor}")
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