from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from backend.routers import documents # noqa: E402  (load_dotenv'den sonra import edilmeli)

app = FastAPI(title="Ders Notu Asistanı API")

app.add_middleware(
    CORSMiddleware,
    # Local test aşamasında frontend dosyayı doğrudan file:// olarak açıyor veya
    # farklı portlarda çalışabiliyor, bu yüzden tüm origin'lere izin veriyoruz.
    # Production'a geçerken bu, gerçek frontend domain'iyle sınırlandırılmalı.
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
