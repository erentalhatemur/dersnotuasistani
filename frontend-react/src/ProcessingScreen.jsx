import { useEffect, useState } from "react";

const MESSAGES = [
  "Notların taranıyor...",
  "Önemli kavramlar ayıklanıyor...",
  "Flashcard'lar hazırlanıyor...",
  "Quiz soruları yazılıyor...",
  "Son rötuşlar...",
];

export default function ProcessingScreen({ filename }) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "120px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          margin: "0 auto 32px",
          borderRadius: "50%",
          border: "4px solid var(--purple-soft)",
          borderTopColor: "var(--purple)",
          animation: "spin 0.9s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <p style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 700, margin: "0 0 8px" }}>
        {filename}
      </p>
      <p style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
        {MESSAGES[msgIndex]}
      </p>
    </div>
  );
}
