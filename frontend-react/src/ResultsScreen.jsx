import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function ResultsScreen({ filename, result, onNewUpload }) {
  const [activeTab, setActiveTab] = useState("summary"); // summary | cards | quiz

  const evaluation = result.ogreticilik_degerlendirmesi || { skor: 95, geribildirim: "Harika materyal!" };
  const summaryText = result.ozet_markdown || "Özet bulunamadı.";
  const flashcards = result.flashcards || [];
  const quiz = result.quiz || [];

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", color: "var(--ink)" }}>
      
      {/* Başlık ve Skor Kartı */}
      <div style={{ 
        border: "3px solid var(--ink)", 
        borderRadius: 20, 
        padding: "20px", 
        background: "#fff", 
        boxShadow: "4px 4px 0px var(--ink)",
        marginBottom: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900 }}>Ders Notu Asistanı</h2>
          <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem", opacity: 0.7 }}>{filename}</p>
        </div>
        <div style={{ 
          background: "#fef08a", 
          border: "2px solid var(--ink)", 
          borderRadius: "12px", 
          padding: "8px 16px", 
          textAlign: "center",
          boxShadow: "2px 2px 0px var(--ink)"
        }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 900 }}>{evaluation.skor}</div>
          <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>Skor</div>
        </div>
      </div>

      {/* Sekme Butonları */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <TabButton active={activeTab === "summary"} onClick={() => setActiveTab("summary")}>📖 Özet</TabButton>
        <TabButton active={activeTab === "cards"} onClick={() => setActiveTab("cards")}>⚡ Kartlar ({flashcards.length})</TabButton>
        <TabButton active={activeTab === "quiz"} onClick={() => setActiveTab("quiz")}>🎯 Quiz ({quiz.length})</TabButton>
      </div>

      {/* 1. ÖZET SEKMESİ */}
      {activeTab === "summary" && (
        <div style={{ border: "3px solid var(--ink)", borderRadius: 20, padding: "24px", background: "#fff", boxShadow: "4px 4px 0px var(--ink)" }}>
          <ReactMarkdown>{summaryText}</ReactMarkdown>
          <div style={{ marginTop: "20px", padding: "12px", background: "#f8fafc", border: "2px solid var(--ink)", borderRadius: "10px", fontSize: "13px" }}>
            <strong>Analitik Geri Bildirim:</strong> {evaluation.geribildirim}
          </div>
        </div>
      )}

      {/* 2. FLASHCARD SEKMESİ (Şemadaki 'soru' ve 'cevap' alanlarına göre ayarlandı) */}
      {activeTab === "cards" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {flashcards.map((card, index) => (
            <FlashcardItem key={index} index={index + 1} soru={card.soru} cevap={card.cevap} />
          ))}
        </div>
      )}

      {/* 3. QUIZ SEKMESİ (Şemadaki 'secenekler' ve 'dogru_cevap_index' alanlarına göre ayarlandı) */}
      {activeTab === "quiz" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {quiz.map((q, index) => (
            <QuizItem 
              key={index} 
              index={index + 1} 
              soru={q.soru} 
              secenekler={q.secenekler} 
              dogruIndex={q.dogru_cevap_index} 
              aciklama={q.aciklama}
            />
          ))}
        </div>
      )}

      {/* Yeni Dosya Yükle Butonu */}
      <button 
        onClick={onNewUpload} 
        style={{ 
          marginTop: "30px", 
          width: "100%", 
          padding: "14px", 
          background: "#ff6b6b", 
          color: "#fff", 
          border: "3px solid var(--ink)", 
          borderRadius: "14px", 
          fontWeight: 900,
          cursor: "pointer",
          boxShadow: "3px 3px 0px var(--ink)"
        }}
      >
        + Yeni Dosya Yükle
      </button>
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{
        flex: 1,
        padding: "12px 8px",
        background: active ? "var(--ink)" : "#fff",
        color: active ? "#fff" : "var(--ink)",
        border: "3px solid var(--ink)",
        borderRadius: "12px",
        fontWeight: 800,
        cursor: "pointer",
        boxShadow: active ? "none" : "2px 2px 0px var(--ink)",
        transform: active ? "translate(2px, 2px)" : "none",
        transition: "all 0.1s ease"
      }}
    >
      {children}
    </button>
  );
}

function FlashcardItem({ index, soru, cevap }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div 
      onClick={() => setFlipped(!flipped)}
      style={{
        border: "3px solid var(--ink)",
        borderRadius: "16px",
        padding: "20px",
        background: flipped ? "#fef08a" : "#fff",
        boxShadow: "3px 3px 0px var(--ink)",
        cursor: "pointer",
        minHeight: "100px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        transition: "background 0.2s ease"
      }}
    >
      <div style={{ fontSize: "11px", fontWeight: 800, opacity: 0.6, marginBottom: "8px" }}>
        KART #{index} {flipped ? "(CEVAP)" : "(SORU - Çevirmek için tıkla)"}
      </div>
      <div style={{ fontSize: "15px", fontWeight: 700 }}>
        {flipped ? cevap : soru}
      </div>
    </div>
  );
}

function QuizItem({ index, soru, secenekler, dogruIndex, aciklama }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  return (
    <div style={{
      border: "3px solid var(--ink)",
      borderRadius: "16px",
      padding: "20px",
      background: "#fff",
      boxShadow: "3px 3px 0px var(--ink)"
    }}>
      <div style={{ fontSize: "14px", fontWeight: 900, marginBottom: "12px" }}>
        Soru {index}: {soru}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
        {secenekler && secenekler.map((opt, i) => {
          const isSelected = selectedIndex === i;
          const isCorrect = i === dogruIndex;
          
          let bg = "#fff";
          if (selectedIndex !== null) {
            if (isCorrect) bg = "#bbf7d0"; // Doğru şık yeşil
            else if (isSelected) bg = "#fecaca"; // Yanlış seçilen kırmızı
          }

          return (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              style={{
                textAlign: "left",
                padding: "10px 14px",
                border: "2px solid var(--ink)",
                borderRadius: "10px",
                background: bg,
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "13px"
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selectedIndex !== null && aciklama && (
        <div style={{ fontSize: "12px", background: "#f1f5f9", padding: "10px", borderRadius: "8px", border: "1px solid var(--ink)" }}>
          <strong>Açıklama:</strong> {aciklama}
        </div>
      )}
    </div>
  );
}