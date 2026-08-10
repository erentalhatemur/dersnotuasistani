import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

print("--- HESABINIZA TANIMLI GEÇERLİ MODELLER ---")
try:
    # list_models() yerine güncel kütüphane metodu olan list() kullanıyoruz
    for m in client.models.list():
        print(m.name)
except Exception as e:
    print(f"API'ye bağlanırken hata oluştu: {e}")