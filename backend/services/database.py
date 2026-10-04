import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Supabase baglanti hatasi: {e}")


def save_study_session(
    file_name: str,
    ai_score: int,
    summary: str,
    flashcards: list = None,
    quiz: list = None,
):
    if not supabase:
        return None
    try:
        data = {
            "file_name": file_name,
            "ai_score": ai_score,
            "summary": summary,
            "flashcards": flashcards or [],
            "quiz": quiz or [],
        }
        res = supabase.table("study_sessions").insert(data).execute()
        return res
    except Exception as e:
        print(f"Supabase kayit hatasi: {e}")
        return None


def get_study_sessions(limit: int = 15):
    if not supabase:
        return []
    try:
        res = (
            supabase.table("study_sessions")
            .select("id, file_name, ai_score, summary, flashcards, quiz, created_at")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return res.data
    except Exception as e:
        print(f"Supabase veri cekme hatasi: {e}")
        return []