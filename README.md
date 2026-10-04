```markdown
<div align="center">

# 📚 Kampüs Çalışma Asistanı
### Akademik Notlardan Dakikalar İçinde Sınav Materyali Üreten AI SaaS

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Groq](https://img.shields.io/badge/Groq_API-Qwen_27B-f97316?style=for-the-badge)](https://groq.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![KaTeX](https://img.shields.io/badge/KaTeX-LaTeX_Render-00d084?style=for-the-badge)](https://katex.org/)

<p align="center">
  <b>PDF ve akademik ders notlarını işleyerek yapılandırılmış özetler, formülleri koruyan çalışma kartları (flashcards) ve seviye tespit testleri (quiz) üreten tam yığın (full-stack) yapay zeka uygulaması.</b>
</p>

</div>

---

## ⚡ Temel Özellikler

- **LaTeX & Formül Hassasiyeti:** Akademik dokümanlardaki matematiksel, istatistiksel ve teknik formülleri bozmadan KaTeX standardında render eder.
- **Akıllı Çıkarım & Değerlendirme:** Yüklenen ders notunu derinlemesine analiz eder; pedagojik bir kalite skoru ve geribildirim sunar.
- **İnteraktif Sınav Modu:** Çoktan seçmeli testler, anlık geri bildirim ve ayrıntılı çözüm açıklamalarıyla aktif öğrenmeyi destekler.
- **Çift Yönlü Bilgi Kartları (Flashcards):** Ezber ve terim pekiştirmesi için optimize edilmiş, çevrilebilir kart mekanizması.
- **Kalıcı Kütüphane & Geçmiş:** Oturum sonuçlarını Supabase ve yerel depolama senkronizasyonuyla saklar; eski dökümanlara tek tıkla erişim sağlar.
- **Modern Dark Glassmorphism UI:** Aurora ambient glow efektleri, mikromimari animasyonlar ve modern SaaS estetiği.

---

## 🛠️ Teknoloji Yığını

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **LLM Entegrasyonu:** Groq Cloud API (`qwen/qwen3.8-27b`)
- **Validasyon & Güvenlik:** Pydantic V2, defansif JSON sanitizasyonu ve retry mekanizmaları
- **Veritabanı:** Supabase (PostgreSQL)

### Frontend
- **Kütüphane:** React (Vite)
- **Matematik & Notasyon:** `remark-math`, `rehype-katex`, `KaTeX`
- **İçerik Render:** `react-markdown`, `remark-gfm`
- **Tasarım:** Custom CSS Glassmorphism, Dark Neon Aurora UI

---

## 🏗️ Sistem Mimarisi

```text
[Kullanıcı PDF Yükler]
        │
        ▼
[FastAPI Backend] ── (Metin Çıkarma & Chunking)
        │
        ▼
[Groq API (Qwen 27B)] ── (Yapılandırılmış JSON & Markdown Üretimi)
        │
        ▼
[Pydantic Validasyonu] ── (Hata/Bozuk JSON Ayıklama)
        │
   ┌────┴────────────────────────┐
   ▼                             ▼
[Supabase Kaydı]        [React Frontend (KaTeX + UI)]

```

---

## 🚀 Hızlı Başlangıç

### 1. Gereksinimler

* Python 3.10+
* Node.js 18+
* Groq API Anahtarı
* Supabase Proje Bilgileri

### 2. Backend Kurulumu

```bash
# Backend dizinine geçin
cd backend

# Sanal ortam oluşturup aktifleştirin
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Bağımlılıkları yükleyin
pip install -r requirements.txt

# Çevre değişkenlerini ayarlayın (.env)
cp .env.example .env

```

`.env` dosyanızı yapılandırın:

```env
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

```

Sunucuyu başlatın:

```bash
uvicorn main:app --reload --port 8000

```

### 3. Frontend Kurulumu

```bash
# Frontend dizinine geçin
cd frontend-react

# Paketleri yükleyin
npm install

# .env yapılandırması
VITE_API_BASE=http://localhost:8000

# Geliştirme sunucusunu başlatın
npm run dev

```

---

## 🗺️ Gelecek Yol Haritası

* [ ] Flashcard'ları Anki (`.tsv` / `.txt`) formatında dışa aktarma
* [ ] Ders özetini biçimli PDF/Markdown olarak indirme
* [ ] Doküman odaklı interaktif AI sohbet paneli (Chat with PDF)
* [ ] Supabase Auth ile kullanıcı bazlı oturum yönetimi

```

```
