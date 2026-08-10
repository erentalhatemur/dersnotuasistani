import { useState } from "react";

const CARD_COLORS = ["a", "b", "c"];

export default function FlashcardDeck({ flashcards }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = flashcards[index];
  const colorClass = CARD_COLORS[index % CARD_COLORS.length];
  const bg =
    colorClass === "a"
      ? "var(--yellow-soft)"
      : colorClass === "b"
      ? "var(--green-soft)"
      : "var(--pink-soft)";

  const goTo = (newIndex) => {
    setFlipped(false);
    setIndex((newIndex + flashcards.length) % flashcards.length);
  };

  return (
    <div>
      <p
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--ink-soft)",
          margin: "0 0 16px",
        }}
      >
        {index + 1} / {flashcards.length}
      </p>

      <div
        onClick={() => setFlipped((f) => !f)}
        style={{
          minHeight: 220,
          borderRadius: 20,
          border: "3px solid var(--ink)",
          background: bg,
          padding: "32px 28px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            background: "var(--ink)",
            color: "#fff",
            padding: "3px 10px",
            borderRadius: 100,
            width: "fit-content",
            marginBottom: 16,
          }}
        >
          {flipped ? "Cevap" : "Soru"}
        </span>
        <p style={{ fontSize: 19, fontWeight: 700, margin: 0, lineHeight: 1.4 }}>
          {flipped ? card.cevap : card.soru}
        </p>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink-soft)",
            margin: "20px 0 0",
          }}
        >
          Çevirmek için tıkla
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button
          onClick={() => goTo(index - 1)}
          style={navBtnStyle}
        >
          ← Önceki
        </button>
        <button
          onClick={() => goTo(index + 1)}
          style={{ ...navBtnStyle, background: "var(--ink)", color: "#fff" }}
        >
          Sonraki →
        </button>
      </div>
    </div>
  );
}

const navBtnStyle = {
  flex: 1,
  padding: "12px 20px",
  borderRadius: 100,
  border: "2px solid var(--ink)",
  background: "#fff",
  fontWeight: 800,
  fontSize: 14,
};
