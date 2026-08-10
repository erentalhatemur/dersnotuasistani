<<<<<<< HEAD
# Ders Notu Asistanı

Ders notu (PDF/DOCX/PPTX/görsel) yükle → özet, flashcard ve quiz üret.

## Kurulum (local test)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# .env dosyasını açıp GEMINI_API_KEY'ini gir (aistudio.google.com/apikey)
```

```bash
cd frontend-react
npm install
```

## Çalıştırma

**Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```
API dokümantasyonu: http://localhost:8000/docs

**Frontend (React):**
```bash
cd frontend-react
npm run dev
```
Tarayıcıda http://localhost:3000 açılır.

**Eski test arayüzü:** `frontend/index.html` hâlâ duruyor (build gerektirmeyen hızlı test için), ama artık asıl arayüz `frontend-react`.

## Proje Yapısı

```
backend/
  extractors/       # Dosya formatı -> ham metin (PDF, DOCX, PPTX, görsel)
  services/
    llm_service.py  # Gemini API ile özet/flashcard/quiz üretimi
    job_store.py    # İş takibi (şu an in-memory, sonra DB'ye taşınacak)
  routers/
    documents.py    # /api/upload, /api/status, /api/result
  models/schemas.py # Pydantic veri modelleri
  main.py           # FastAPI giriş noktası
frontend-react/
  src/
    App.jsx             # Ana state makinesi (idle/processing/error/done)
    UploadScreen.jsx    # Dosya yükleme (sürükle-bırak)
    ProcessingScreen.jsx
    ErrorScreen.jsx
    ResultsScreen.jsx   # Sekmeli sonuç görünümü
    FlashcardDeck.jsx   # Çevrilebilir kart bileşeni
    QuizList.jsx        # Seçenekli quiz + skor
    index.css           # Kampüs Enerjisi renk paleti / tema
frontend/
  index.html        # Eski build-gerektirmeyen test arayüzü

```

## Yeni bir dosya formatı eklemek

1. `extractors/xyz_extractor.py` dosyasında `extract(path) -> ExtractionResult` yaz
2. `extractors/registry.py` içine uzantıyı ekle

Bu kadar — LLM katmanı hiçbir extractor detayı bilmediği için başka bir şey
değiştirmene gerek yok.

## Sırada ne var (Faz 2)

- [ ] Kullanıcı hesapları / auth (Supabase Auth önerilir)
- [ ] SQLite → Postgres geçişi
- [ ] Ödeme entegrasyonu (Stripe)
- [ ] React frontend (bu test HTML'inin yerini alacak)
- [ ] Ses kaydı desteği (Whisper API)
- [ ] Spaced repetition / ilerleme takibi

## Notlar

- Şu an job'lar in-memory tutuluyor — backend restart olunca kaybolur (local test için sorun değil).
- Dosya boyutu sınırı: 25MB (main.py / documents.py içinde değiştirilebilir).
- Uzun belgeler (60K+ karakter) otomatik olarak map-reduce ile özetlenip sonra materyal üretiliyor.
=======
# dersnotuasistani
>>>>>>> 60cfb2ec354a2bbac14da1d58a52a152acdbd69a
