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
    geribildirim: "Ders notu başarıyla analiz edilmiştir.",
  };
  const rawSummary = result.ozet_markdown || "Özet bulunamadı.";
  const summaryText = formatMarkdownText(rawSummary);
  const flashcards = result.flashcards || [];
  const quiz = result.quiz || [];

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.12), rgba(255, 255, 255, 0)), #fafafa",
      backgroundImage: `
        radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
        radial-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px)
      `,
      backgroundSize: "100% 100%, 24px 24px",
      padding: "40px 20px 80px 20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: "#0f172a"
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Header Bar */}
        <div style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(14px)",
          borderRadius: "20px",
          padding: "22px 28px",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.04)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(99, 102, 241, 0.08)", padding: "3px 10px", borderRadius: "12px", marginBottom: "6px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4f46e5" }}></span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Hazırlandı
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
              {filename}
            </h1>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            background: "#ffffff",
            padding: "8px 18px",
            borderRadius: "16px",
            border: "1px solid #f1f5f9",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Kalite Skoru</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>{evaluation.skor}</div>
            </div>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px"
            }}>
              ✨
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: "flex",
          background: "rgba(241, 245, 249, 0.7)",
          backdropFilter: "blur(8px)",
          padding: "5px",
          borderRadius: "14px",
          gap: "6px",
          marginBottom: "24px",
          border: "1px solid rgba(226, 232, 240, 0.6)"
        }}>
          <TabButton active={activeTab === "summary"} onClick={() => setActiveTab("summary")}>
            📄 Ders Özeti
          </TabButton>
          <TabButton active={activeTab === "cards"} onClick={() => setActiveTab("cards")}>
            💡 Flashcards ({flashcards.length})
          </TabButton>
          <TabButton active={activeTab === "quiz"} onClick={() => setActiveTab("quiz")}>
            🎯 Test & Sorular ({quiz.length})
          </TabButton>
        </div>

        {/* 1. ÖZET */}
        {activeTab === "summary" && (
          <div style={{
            background: "#ffffff",
            borderRadius: "22px",
            padding: "36px 40px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 14px 35px -5px rgba(0, 0, 0, 0.04)",
            lineHeight: 1.8
          }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h2: ({ node, ...props }) => (
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", marginTop: "32px", marginBottom: "12px", letterSpacing: "-0.02em" }} {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#334155", marginTop: "24px", marginBottom: "8px" }} {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p style={{ marginBottom: "16px", fontSize: "15px", color: "#334155" }} {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul style={{ paddingLeft: "20px", marginBottom: "18px", color: "#334155" }} {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li style={{ marginBottom: "6px", fontSize: "14.5px" }} {...props} />
                ),
                code: ({ node, inline, ...props }) =>
                  inline ? (
                    <code style={{ background: "#f1f5f9", color: "#4f46e5", padding: "2px 6px", borderRadius: "5px", fontSize: "13px", fontFamily: "ui-monospace, monospace" }} {...props} />
                  ) : (
                    <pre style={{ background: "#0f172a", color: "#f8fafc", padding: "16px 20px", borderRadius: "12px", overflowX: "auto", fontSize: "13.5px", margin: "20px 0" }}><code {...props} /></pre>
                  ),
                table: ({ node, ...props }) => (
                  <div style={{ overflowX: "auto", margin: "24px 0", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }} {...props} />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "12px 16px", fontWeight: 600, color: "#475569", textAlign: "left" }} {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td style={{ borderBottom: "1px solid #f1f5f9", padding: "12px 16px", color: "#334155" }} {...props} />
                ),
                hr: () => <hr style={{ border: "none", borderTop: "1px dashed #e2e8f0", margin: "32px 0" }} />
              }}
            >
              {summaryText}
            </ReactMarkdown>

            <div style={{
              marginTop: "36px",
              padding: "16px 20px",
              background: "rgba(248, 250, 252, 0.8)",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              fontSize: "13.5px",
              color: "#64748b",
              display: "flex",
              gap: "12px",
              alignItems: "center"
            }}>
              <span style={{ fontSize: "18px" }}>💡</span>
              <div>
                <strong style={{ color: "#1e293b" }}>Yapay Zeka Değerlendirmesi:</strong> {evaluation.geribildirim}
              </div>
            </div>
          </div>
        )}

        {/* 2. FLASHCARDS */}
        {activeTab === "cards" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {flashcards.map((card, index) => (
              <FlashcardItem key={index} index={index + 1} soru={card.soru} cevap={card.cevap} />
            ))}
          </div>
        )}

        {/* 3. QUIZ */}
        {activeTab === "quiz" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {quiz.map((q, index) => (
              <QuizCardItem
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

        {/* Yeni Yükleme Aksiyonu */}
        <div style={{ marginTop: "44px", textAlign: "center" }}>
          <button
            onClick={onNewUpload}
            style={{
              background: "#0f172a",
              color: "#ffffff",
              padding: "12px 26px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontWeight: 600,
              fontSize: "13.5px",
              cursor: "pointer",
              boxShadow: "0 6px 20px -4px rgba(15, 23, 42, 0.2)",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
          >
            ← Yeni Dosya Yükle
          </button>
        </div>
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
        color: active ? "#0f172a" : "#64748b",
        border: "none",
        borderRadius: "10px",
        fontWeight: active ? 600 : 500,
        fontSize: "13px",
        cursor: "pointer",
        boxShadow: active ? "0 2px 8px rgba(0, 0, 0, 0.04)" : "none",
        transition: "all 0.15s ease"
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
        background: flipped ? "#ffffff" : "#ffffff",
        border: `1px solid ${flipped ? "rgba(99, 102, 241, 0.4)" : "rgba(226, 232, 240, 0.9)"}`,
        borderRadius: "18px",
        padding: "24px",
        minHeight: "160px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: flipped ? "0 10px 25px -4px rgba(99, 102, 241, 0.1)" : "0 4px 15px -2px rgba(0,0,0,0.03)",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
    >
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: flipped ? "#4f46e5" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {flipped ? "Cevap" : `Kart #${index}`}
          </span>
          <span style={{ fontSize: "11px", color: "#cbd5e1" }}>{flipped ? "Dönmek için tıkla" : "Cevap için tıkla"}</span>
        </div>
        <div style={{ fontSize: "14.5px", fontWeight: 600, color: "#1e293b", lineHeight: 1.5 }}>
          {flipped ? cevap : soru}
        </div>
      </div>
      <div style={{ fontSize: "11.5px", color: "#6366f1", fontWeight: 600, marginTop: "14px" }}>
        {flipped ? "↺ Soruyu göster" : "Cevabı gör ➔"}
      </div>
    </div>
  );
}

function QuizCardItem({ index, soru, secenekler, dogruIndex, aciklama }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  return (
    <div style={{
      background: "#ffffff",
      borderRadius: "18px",
      padding: "24px 28px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03)"
    }}>
      <div style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", marginBottom: "16px", display: "flex", gap: "8px" }}>
        <span style={{ color: "#6366f1", fontWeight: 700 }}>{index}.</span>
        <span>{soru}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {secenekler && secenekler.map((opt, i) => {
          const isSelected = selectedIndex === i;
          const isCorrect = i === dogruIndex;

          let bg = "rgba(248, 250, 252, 0.6)";
          let border = "1px solid #e2e8f0";
          let textColor = "#334155";

          if (selectedIndex !== null) {
            if (isCorrect) {
              bg = "rgba(240, 253, 244, 0.9)";
              border = "1px solid #86efac";
              textColor = "#15803d";
            } else if (isSelected) {
              bg = "rgba(254, 242, 242, 0.9)";
              border = "1px solid #fca5a5";
              textColor = "#b91c1c";
            }
          }

          return (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              style={{
                textAlign: "left",
                padding: "12px 18px",
                borderRadius: "12px",
                border: border,
                background: bg,
                color: textColor,
                fontWeight: 500,
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
          padding: "14px 18px",
          borderRadius: "12px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          fontSize: "13px",
          color: "#475569",
          lineHeight: 1.5
        }}>
          <strong style={{ color: "#0f172a" }}>Çözüm & Açıklama:</strong> {aciklama}
        </div>
      )}
    </div>
  );
}