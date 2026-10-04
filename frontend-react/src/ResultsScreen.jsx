import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

function formatMarkdownText(rawText) {
  if (!rawText) return "";
  return rawText
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/^##\s*Bölüm\s*\d+\s*/gim, "")
    .replace(/Bu bölüm işlenirken bir sorun oluştu\./g, "")
    .trim();
}

export default function ResultsScreen({ filename, result, onNewUpload }) {
  const [activeTab, setActiveTab] = useState("summary");

  const evaluation = result.ogreticilik_degerlendirmesi || {
    skor: 85,
    geribildirim: "Analiz başarıyla tamamlandı.",
  };
  const rawSummary = result.ozet_markdown || "Özet bulunamadı.";
  const summaryText = formatMarkdownText(rawSummary);
  const flashcards = result.flashcards || [];
  const quiz = result.quiz || [];

  return (
    <div style={{ maxWidth: "820px", margin: "0 auto", padding: "32px 20px", fontFamily: "system-ui, -apple-system, sans-serif", color: "#0f172a" }}>
      
      {/* Üst Header / Metrik Barı */}
      <div style={{
        background: "#ffffff",
        borderRadius: "18px",
        padding: "24px 28px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px"
      }}>
        <div>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Ders Notu Özeti
          </span>
          <h2 style={{ margin: "4px 0 0 0", fontSize: "1.35rem", fontWeight: 800, color: "#1e293b" }}>
            {filename}
          </h2>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "#f8fafc",
          padding: "8px 16px",
          borderRadius: "14px",
          border: "1px solid #e2e8f0"
        }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Akademik Skor</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{evaluation.skor}</div>
          </div>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "#e0e7ff",
            color: "#4f46e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "14px"
          }}>
            🎯
          </div>
        </div>
      </div>

      {/* Modern Sekme Seçici */}
      <div style={{
        display: "flex",
        background: "#f1f5f9",
        padding: "5px",
        borderRadius: "14px",
        gap: "6px",
        marginBottom: "24px"
      }}>
        <TabButton active={activeTab === "summary"} onClick={() => setActiveTab("summary")}>
          📖 Konu Özeti
        </TabButton>
        <TabButton active={activeTab === "cards"} onClick={() => setActiveTab("cards")}>
          ⚡ Bilgi Kartları ({flashcards.length})
        </TabButton>
        <TabButton active={activeTab === "quiz"} onClick={() => setActiveTab("quiz")}>
          🎯 Quiz & Test ({quiz.length})
        </TabButton>
      </div>

      {/* 1. ÖZET ALANI */}
      {activeTab === "summary" && (
        <div style={{
          background: "#ffffff",
          borderRadius: "18px",
          padding: "32px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 25px -4px rgba(0, 0, 0, 0.04)",
          lineHeight: 1.7
        }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              h2: ({ node, ...props }) => (
                <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", marginTop: "32px", marginBottom: "14px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }} {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#334155", marginTop: "24px", marginBottom: "10px" }} {...props} />
              ),
              p: ({ node, ...props }) => (
                <p style={{ marginBottom: "16px", fontSize: "15px", color: "#334155" }} {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul style={{ paddingLeft: "24px", marginBottom: "18px", color: "#334155" }} {...props} />
              ),
              li: ({ node, ...props }) => (
                <li style={{ marginBottom: "8px", fontSize: "14.5px" }} {...props} />
              ),
              code: ({ node, inline, ...props }) =>
                inline ? (
                  <code style={{ background: "#f1f5f9", color: "#4f46e5", padding: "3px 7px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, fontFamily: "monospace" }} {...props} />
                ) : (
                  <pre style={{ background: "#0f172a", color: "#f8fafc", padding: "18px", borderRadius: "12px", overflowX: "auto", fontSize: "13.5px", marginBottom: "20px" }}><code {...props} /></pre>
                ),
              table: ({ node, ...props }) => (
                <div style={{ overflowX: "auto", margin: "20px 0" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, borderRadius: "10px", overflow: "hidden", border: "1px solid #e2e8f0" }} {...props} />
                </div>
              ),
              th: ({ node, ...props }) => (
                <th style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "12px 14px", fontWeight: 700, fontSize: "13px", color: "#475569", textAlign: "left" }} {...props} />
              ),
              td: ({ node, ...props }) => (
                <td style={{ borderBottom: "1px solid #f1f5f9", padding: "12px 14px", fontSize: "13.5px", color: "#334155" }} {...props} />
              ),
              hr: () => <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "32px 0" }} />
            }}
          >
            {summaryText}
          </ReactMarkdown>

          <div style={{ marginTop: "32px", padding: "18px 20px", background: "#f8fafc", borderRadius: "14px", border: "1px solid #e2e8f0", fontSize: "13.5px", color: "#475569", display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "18px" }}>💡</span>
            <div>
              <strong style={{ color: "#1e293b" }}>Analitik Değerlendirme:</strong> {evaluation.geribildirim}
            </div>
          </div>
        </div>
      )}

      {/* 2. FLASHCARD ALANI */}
      {activeTab === "cards" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {flashcards.map((card, index) => (
            <ModernFlashcard key={index} index={index + 1} soru={card.soru} cevap={card.cevap} />
          ))}
        </div>
      )}

      {/* 3. QUIZ ALANI */}
      {activeTab === "quiz" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {quiz.map((q, index) => (
            <ModernQuizCard
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

      {/* Alt Aksiyon Butonu */}
      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <button
          onClick={onNewUpload}
          style={{
            background: "#4f46e5",
            color: "#ffffff",
            padding: "14px 28px",
            borderRadius: "12px",
            border: "none",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#4338ca")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#4f46e5")}
        >
          + Yeni Döküman Analiz Et
        </button>
      </div>
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 14px",
        background: active ? "#ffffff" : "transparent",
        color: active ? "#4f46e5" : "#64748b",
        border: "none",
        borderRadius: "10px",
        fontWeight: active ? 700 : 600,
        fontSize: "13.5px",
        cursor: "pointer",
        boxShadow: active ? "0 2px 8px rgba(0, 0, 0, 0.04)" : "none",
        transition: "all 0.15s ease"
      }}
    >
      {children}
    </button>
  );
}

function ModernFlashcard({ index, soru, cevap }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      style={{
        background: flipped ? "#f8fafc" : "#ffffff",
        border: "1px solid",
        borderColor: flipped ? "#c7d2fe" : "#e2e8f0",
        borderRadius: "16px",
        padding: "24px",
        minHeight: "150px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#818cf8")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = flipped ? "#c7d2fe" : "#e2e8f0")}
    >
      <div>
        <div style={{ fontSize: "11px", fontWeight: 700, color: flipped ? "#4f46e5" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
          {flipped ? "Cevap" : `Kart #${index}`}
        </div>
        <div style={{ fontSize: "14.5px", fontWeight: 600, color: "#1e293b", lineHeight: 1.5 }}>
          {flipped ? cevap : soru}
        </div>
      </div>
      <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "14px", textAlign: "right" }}>
        {flipped ? "Soruya dönmek için tıkla" : "Cevabı görmek için tıkla ➔"}
      </div>
    </div>
  );
}

function ModernQuizCard({ index, soru, secenekler, dogruIndex, aciklama }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  return (
    <div style={{
      background: "#ffffff",
      borderRadius: "16px",
      padding: "24px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 2px 12px rgba(0,0,0,0.03)"
    }}>
      <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: "16px" }}>
        <span style={{ color: "#6366f1", marginRight: "8px" }}>Soru {index}.</span>
        {soru}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {secenekler && secenekler.map((opt, i) => {
          const isSelected = selectedIndex === i;
          const isCorrect = i === dogruIndex;

          let bg = "#ffffff";
          let border = "#e2e8f0";
          let color = "#334155";

          if (selectedIndex !== null) {
            if (isCorrect) {
              bg = "#f0fdf4";
              border = "#86efac";
              color = "#15803d";
            } else if (isSelected) {
              bg = "#fef2f2";
              border = "#fca5a5";
              color = "#b91c1c";
            }
          }

          return (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              style={{
                textAlign: "left",
                padding: "12px 16px",
                borderRadius: "12px",
                border: `1.5px solid ${border}`,
                background: bg,
                color: color,
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {selectedIndex !== null && aciklama && (
        <div style={{
          marginTop: "16px",
          padding: "12px 16px",
          borderRadius: "10px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          fontSize: "13px",
          color: "#475569"
        }}>
          <strong style={{ color: "#1e293b" }}>Açıklama:</strong> {aciklama}
        </div>
      )}
    </div>
  );
}