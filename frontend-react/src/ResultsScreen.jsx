import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Metindeki kaçış karakterlerini ve yapay başlıkları temizleyen filtre
function formatMarkdownText(rawText) {
  if (!rawText) return "";
  return rawText
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/^##\s*Bölüm\s*\d+\s*/gim, "")
    .trim();
}

export default function ResultsScreen({ filename, result, onNewUpload }) {
  const [activeTab, setActiveTab] = useState("summary"); // summary | cards | quiz

  const evaluation = result.ogreticilik_degerlendirmesi || { skor: 95, geribildirim: "Harika materyal!" };
  const rawSummary = result.ozet_markdown || "Özet bulunamadı.";
  const summaryText = formatMarkdownText(rawSummary);
  const flashcards = result.flashcards || [];
  const quiz = result.quiz || [];

  return (
    <div style={{ padding: "20px", maxWidth: "680px", margin: "0 auto", color: "var(--ink)" }}>
      
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
        <div style={{ 
          border: "3px solid var(--ink)", 
          borderRadius: 20, 
          padding: "24px", 
          background: "#fff", 
          boxShadow: "4px 4px 0px var(--ink)",
          lineHeight: 1.6
        }}>
          <div className="markdown-body">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({node, ...props}) => <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: "24px", marginBottom: "12px", borderBottom: "2px solid #e2e8f0", paddingBottom: "6px" }} {...props} />,
                h3: ({node, ...props}) => <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "18px", marginBottom: "8px" }} {...props} />,
                p: ({node, ...props}) => <p style={{ marginBottom: "12px", fontSize: "14.5px" }} {...props} />,
                ul: ({node, ...props}) => <ul style={{ paddingLeft: "20px", marginBottom: "14px" }} {...props} />,
                li: ({node, ...props}) => <li style={{ marginBottom: "6px", fontSize: "14px" }} {...props} />,
                code: ({node, inline, ...props}) => inline 
                  ? <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "13px", fontFamily: "monospace" }} {...props} />
                  : <pre style={{ background: "#0f172a", color: "#f8fafc", padding: "14px", borderRadius: "10px", overflowX: "auto", fontSize: "13px", marginBottom: "14px" }}><code {...props} /></pre>,
                table: ({node, ...props}) => (
                  <div style={{ overflowX: "auto", marginBottom: "16px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", border: "1px solid #cbd5e1" }} {...props} />
                  </div>
                ),
                th: ({node, ...props}) => <th style={{ background: "#f8fafc", border: "1px solid #cbd5e1", padding: "8px 12px", fontWeight: 700, textAlign: "left" }} {...props} />,
                td: ({node, ...props}) => <td style={{ border: "1px solid #cbd5e1", padding: "8px 12px" }} {...props} />,
                hr: () => <hr style={{ border: "none", borderTop: "2px dashed #cbd5e1", margin: "24px 0" }} />
              }}
            >
              {summaryText}
            </ReactMarkdown>
          </div>

          <div style={{ marginTop: "24px", padding: "14px", background: "#f8fafc", border: "2px solid var(--ink)", borderRadius: "12px", fontSize: "13px" }}>
            <strong>Analitik Geri Bildirim:</strong> {formatMarkdownText(evaluation.geribildirim)}
          </div>
        </div>
      )}

      {/* 2. FLASHCARD SEKMESİ */}
      {activeTab === "cards" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {flashcards.map((card, index) => (
            <FlashcardItem key={index} index={index + 1} soru={card.soru} cevap={card.cevap} />
          ))}
        </div>
      )}

      {/* 3. QUIZ SEKMESİ */}
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
            if (isCorrect) bg = "#bbf7d0"; 
            else if (isSelected) bg = "#fecaca"; 
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