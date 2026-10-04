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
      background: "#090a0f",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      color: "#f8fafc",
      padding: "40px 20px 90px"
    }}>
      {/* Arka Plan Ambient Glow */}
      <div style={{
        position: "absolute",
        top: "-10%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "750px",
        height: "450px",
        background: "radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.1) 40%, transparent 70%)",
        filter: "blur(100px)",
        pointerEvents: "none",
        zIndex: 0
      }} />

      <div style={{ maxWidth: "820px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        
        {/* Üst Başlık & Skor Paneli */}
        <div style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "22px",
          padding: "24px 28px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 15px 35px -10px rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px"
        }}>
          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(168, 85, 247, 0.15)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              padding: "4px 10px",
              borderRadius: "20px",
              marginBottom: "8px"
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c084fc", boxShadow: "0 0 8px #c084fc" }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#e879f9", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                AI Analizi Tamamlandı
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>
              {filename}
            </h1>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "8px 18px",
            borderRadius: "16px"
          }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Skor</div>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#f8fafc", lineHeight: 1 }}>{evaluation.skor}</div>
            </div>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "15px",
              boxShadow: "0 4px 12px rgba(236, 72, 153, 0.3)"
            }}>
              ✨
            </div>
          </div>
        </div>

        {/* Sekme Seçici */}
        <div style={{
          display: "flex",
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(12px)",
          padding: "6px",
          borderRadius: "16px",
          gap: "8px",
          marginBottom: "24px",
          border: "1px solid rgba(255, 255, 255, 0.06)"
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

        {/* 1. ÖZET GÖRÜNÜMÜ */}
        {activeTab === "summary" && (
          <div style={{
            background: "rgba(255, 255, 255, 0.02)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "36px 40px",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
            lineHeight: 1.8
          }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h2: ({ node, ...props }) => (
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#ffffff", marginTop: "32px", marginBottom: "14px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "8px" }} {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#e2e8f0", marginTop: "24px", marginBottom: "10px" }} {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p style={{ marginBottom: "16px", fontSize: "15px", color: "#cbd5e1" }} {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul style={{ paddingLeft: "20px", marginBottom: "18px", color: "#cbd5e1" }} {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li style={{ marginBottom: "8px", fontSize: "14.5px" }} {...props} />
                ),
                code: ({ node, inline, ...props }) =>
                  inline ? (
                    <code style={{ background: "rgba(168, 85, 247, 0.15)", color: "#e879f9", padding: "2px 7px", borderRadius: "6px", fontSize: "13px", fontFamily: "monospace" }} {...props} />
                  ) : (
                    <pre style={{ background: "#050608", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#f8fafc", padding: "16px 20px", borderRadius: "14px", overflowX: "auto", fontSize: "13.5px", margin: "20px 0" }}><code {...props} /></pre>
                  ),
                table: ({ node, ...props }) => (
                  <div style={{ overflowX: "auto", margin: "24px 0", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }} {...props} />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", padding: "12px 16px", fontWeight: 600, color: "#94a3b8", textAlign: "left" }} {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", padding: "12px 16px", color: "#cbd5e1" }} {...props} />
                ),
                hr: () => <hr style={{ border: "none", borderTop: "1px dashed rgba(255, 255, 255, 0.1)", margin: "32px 0" }} />
              }}
            >
              {summaryText}
            </ReactMarkdown>

            <div style={{
              marginTop: "36px",
              padding: "18px 22px",
              background: "rgba(168, 85, 247, 0.06)",
              borderRadius: "16px",
              border: "1px solid rgba(168, 85, 247, 0.2)",
              fontSize: "13.5px",
              color: "#cbd5e1",
              display: "flex",
              gap: "12px",
              alignItems: "center"
            }}>
              <span style={{ fontSize: "18px" }}>💡</span>
              <div>
                <strong style={{ color: "#ffffff" }}>AI Değerlendirmesi:</strong> {evaluation.geribildirim}
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
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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

        {/* Geri Dön Butonu */}
        <div style={{ marginTop: "48px", textAlign: "center" }}>
          <button
            onClick={onNewUpload}
            style={{
              background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
              color: "#ffffff",
              padding: "14px 32px",
              borderRadius: "14px",
              border: "none",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "0 8px 25px -4px rgba(236, 72, 153, 0.35)",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
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
        background: active ? "linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)" : "transparent",
        color: active ? "#ffffff" : "#94a3b8",
        border: active ? "1px solid rgba(168, 85, 247, 0.3)" : "1px solid transparent",
        borderRadius: "12px",
        fontWeight: active ? 700 : 500,
        fontSize: "13px",
        cursor: "pointer",
        transition: "all 0.2s ease"
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
        background: flipped ? "rgba(168, 85, 247, 0.08)" : "rgba(255, 255, 255, 0.02)",
        backdropFilter: "blur(14px)",
        border: `1px solid ${flipped ? "rgba(168, 85, 247, 0.4)" : "rgba(255, 255, 255, 0.07)"}`,
        borderRadius: "20px",
        padding: "24px",
        minHeight: "170px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: flipped ? "0 10px 30px -5px rgba(168, 85, 247, 0.2)" : "none",
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.borderColor = flipped ? "rgba(168, 85, 247, 0.4)" : "rgba(255, 255, 255, 0.07)";
      }}
    >
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: flipped ? "#e879f9" : "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {flipped ? "Cevap" : `Kart #${index}`}
          </span>
          <span style={{ fontSize: "11px", color: "#475569" }}>{flipped ? "Soruya dön" : "Cevabı gör"}</span>
        </div>
        <div style={{ fontSize: "14.5px", fontWeight: 600, color: "#f8fafc", lineHeight: 1.5 }}>
          {flipped ? cevap : soru}
        </div>
      </div>
      <div style={{ fontSize: "12px", color: "#a855f7", fontWeight: 600, marginTop: "14px" }}>
        {flipped ? "↺ Soruyu göster" : "Cevabı göster ➔"}
      </div>
    </div>
  );
}

function QuizCardItem({ index, soru, secenekler, dogruIndex, aciklama }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.02)",
      backdropFilter: "blur(16px)",
      borderRadius: "20px",
      padding: "24px 28px",
      border: "1px solid rgba(255, 255, 255, 0.07)"
    }}>
      <div style={{ fontSize: "15px", fontWeight: 600, color: "#f8fafc", marginBottom: "16px", display: "flex", gap: "10px" }}>
        <span style={{ color: "#c084fc", fontWeight: 700 }}>{index}.</span>
        <span>{soru}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {secenekler && secenekler.map((opt, i) => {
          const isSelected = selectedIndex === i;
          const isCorrect = i === dogruIndex;

          let bg = "rgba(255, 255, 255, 0.03)";
          let border = "1px solid rgba(255, 255, 255, 0.08)";
          let textColor = "#cbd5e1";

          if (selectedIndex !== null) {
            if (isCorrect) {
              bg = "rgba(34, 197, 94, 0.15)";
              border = "1px solid rgba(34, 197, 94, 0.5)";
              textColor = "#4ade80";
            } else if (isSelected) {
              bg = "rgba(239, 68, 68, 0.15)";
              border = "1px solid rgba(239, 68, 68, 0.5)";
              textColor = "#f87171";
            }
          }

          return (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              style={{
                textAlign: "left",
                padding: "13px 18px",
                borderRadius: "14px",
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
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          fontSize: "13px",
          color: "#94a3b8",
          lineHeight: 1.5
        }}>
          <strong style={{ color: "#f8fafc" }}>Açıklama:</strong> {aciklama}
        </div>
      )}
    </div>
  );
}