# 📚 Kampüs Çalışma Asistanı

Akademik ders notlarını (PDF) derinlemesine analiz ederek formülleri koruyan özetler, interaktif bilgi kartları (flashcards) ve seviye tespit testleri (quiz) üreten tam yığın yapay zeka çalışma ortamı.

---

## ⚡ Temel Özellikler

* **LaTeX & Formül Bütünlüğü:** Matematiksel ve istatistiksel modelleri KaTeX standartlarında kusursuz render eder.
* **Akıllı Analiz & Kalite Skoru:** Dökümanın öğreticilik seviyesini ölçer, pedagojik kalite skoru ve geribildirim sağlar.
* **İnteraktif Sınav Modu:** Çoktan seçmeli testler, anlık geri bildirim ve detaylı çözüm açıklamaları sunar.
* **Çift Yönlü Bilgi Kartları:** Ezber ve aktif hatırlama (active recall) için optimize edilmiş çevrilebilir kart mekanizması.
* **Kalıcı Kütüphane & Geçmiş:** Oturum sonuçlarını Supabase ve yerel depolama hibrit mimarisiyle saklar.
* **Modern Dark Glassmorphism:** Derin zemin, neon ışıltılar ve akıcı mikro animasyonlar.

---

## 🛠️ Teknoloji Yığını

* **Backend:** FastAPI (Python 3.10+)
* **LLM:** Groq Cloud API (Qwen 27B)
* **Validasyon:** Pydantic V2
* **Veritabanı:** Supabase (PostgreSQL)
* **Frontend:** React + Vite
* **Matematik & Render:** KaTeX, remark-math, rehype-katex, react-markdown

---

## 🏗️️ Sistem Mimarisi

```text
[PDF Yükleme] ──> [FastAPI Backend] ──> [Groq Qwen 27B] ──> [Pydantic Doğrulama]
                                                                  │
                                      ┌───────────────────────────┴───────────────────────────┐
                                      ▼                                                       ▼
                            [Supabase Arşivi]                                      [React İstemci UI]

```

---

## 📁 Proje Dizin Yapısı

* `backend/`
* `main.py` - FastAPI yönlendiricileri ve polling uç noktaları
* `requirements.txt` - Python kütüphaneleri
* `services/`
* `ai_service.py` - Groq API istemcisi ve Pydantic modelleri
* `database.py` - Supabase veri tabanı bağlantısı
* `pdf_service.py` - PDF metin ayıklama fonksiyonları




* `frontend-react/`
* `package.json` - Node bağımlılıkları
* `src/`
* `App.jsx` - Ana durum ve kütüphane geçmiş yönetimi
* `UploadScreen.jsx` - Dosya yükleme ve sürükle-bırak alanı
* `ResultsScreen.jsx` - Özet, flashcard ve test sekmeleri





---

## 🚀 Kurulum ve Çalıştırma

### 1. Backend Kurulumu

```bash
cd backend
python -m venv venv

```

Sanal ortamı aktifleştirin:

* Windows: `venv\Scripts\activate`
* macOS/Linux: `source venv/bin/activate`

Bağımlılıkları yükleyin ve sunucuyu başlatın:

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

```

> `backend/.env` dosyası oluşturup `GROQ_API_KEY`, `SUPABASE_URL` ve `SUPABASE_KEY` değerlerini tanımlayın.

### 2. Frontend Kurulumu

```bash
cd frontend-react
npm install
npm run dev

```

> Tarayıcıda `http://localhost:5173` adresine giderek uygulamayı kullanabilirsiniz.

---

## 🗺️️ Geliştirme Yol Haritası

* [x] Temel MVP ve PDF ayrıştırma akışı
* [x] Groq Qwen-27B yapılandırılmış JSON çıktısı ve KaTeX render
* [x] Dark Neon Glassmorphism arayüzü
* [x] Supabase hibrit geçmiş entegrasyonu
* [ ] Bilgi kartlarını Anki (.tsv / .txt) formatında dışa aktarma
* [ ] Ders özetini biçimli PDF ve Markdown (.md) olarak indirme
* [ ] Dökümana özel interaktif yapay zeka sohbeti (Chat with PDF)
* [ ] Quiz sonuç analiz ekranı ve başarı metrikleri
