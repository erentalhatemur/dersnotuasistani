import os
from supabase import create_client, Client

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def save_study_session(file_name: str, ai_score: int, summary: str):
    data = {
        "file_name": file_name,
        "ai_score": ai_score,
        "summary": summary
    }
    return supabase.table("study_sessions").insert(data).execute()

def get_user_sessions():
    return supabase.table("study_sessions").select("*").order("created_at", desc=True).execute()