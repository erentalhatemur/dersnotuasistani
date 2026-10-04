import os
import logging
from supabase import create_client, Client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

supabase: Client = None

if url and key:
    try:
        supabase = create_client(url, key)
        logger.info("Supabase baglantisi basariyla kuruldu.")
    except Exception as e:
        logger.error(f"Supabase baglanti hatasi: {str(e)}")
else:
    logger.warning("SUPABASE_URL veya SUPABASE_KEY tanimli degil!")

def save_study_session(file_name: str, ai_score: int, summary: str):
    """Calisma oturumunu Supabase veritabanina kaydeder."""
    if not supabase:
        logger.warning("Supabase istemcisi aktif olmadigi icin oturum kaydedilemedi.")
        return None

    try:
        data = {
            "file_name": file_name,
            "ai_score": ai_score,
            "summary": summary
        }
        return supabase.table("study_sessions").insert(data).execute()
    except Exception as e:
        logger.error(f"Oturum kaydedilirken hata: {str(e)}")
        return None

def get_study_sessions(limit: int = 15):
    """Gecmis calisma oturumlarini en yeniden eskiye sirali getirir."""
    if not supabase:
        logger.warning("Supabase istemcisi aktif olmadigi icin gecmis oturumlar getirilemedi.")
        return []

    try:
        response = (
            supabase.table("study_sessions")
            .select("id, file_name, ai_score, summary, created_at")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []
    except Exception as e:
        logger.error(f"Gecmis oturumlar cekilirken hata: {str(e)}")
        return []