import { useCallback, useRef, useState } from "react";

const ACCEPTED = ".pdf,.docx,.pptx,.jpg,.jpeg,.png,.webp";

export default function UploadScreen({ onFileSelected }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = useCallback((e, active) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(active);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px" }}>
      <span
        style={{
          display: "inline-block",
          background: "var(--purple-soft)",
          color: "#3C3489",
          fontSize: 12,
          fontWeight: 700,
          padding: "6px 14px",
          borderRadius: 100,
          marginBottom: 16,
        }}
      >
        ✦ ders notu asistanı
      </span>

      <h1
        style={{
          fontSize: "clamp(28px, 5vw, 40px)",
          fontWeight: 800,
          margin: "0 0 12px",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
        }}
      >
        Ders notların,{" "}
        <span style={{ color: "var(--purple)" }}>3 dakikada</span> sınav
        malzemesine dönüşsün.
      </h1>

      <p
        style={{
          fontSize: 16,
          color: "var(--ink-soft)",
          maxWidth: 460,
          lineHeight: 1.6,
          fontWeight: 600,
          margin: "0 0 40px",
        }}
      >
        Yükle, otomatik özet, flashcard ve quiz üretilsin.
      </p>

      <div
        onDragOver={(e) => handleDrag(e, true)}
        onDragEnter={(e) => handleDrag(e, true)}
        onDragLeave={(e) => handleDrag(e, false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: "3px solid var(--ink)",
          borderRadius: 24,
          padding: "48px 32px",
          textAlign: "center",
          background: dragActive ? "var(--yellow-soft)" : "#fff",
          boxShadow: `6px 6px 0 var(--purple)`,
          cursor: "pointer",
          transition: "background 0.15s ease",
        }}
      >
        <p style={{ fontSize: 19, fontWeight: 800, margin: "0 0 6px" }}>
          Dosyanı buraya bırak
        </p>
        <p
          style={{
            fontSize: 13,
            color: "var(--ink-soft)",
            fontWeight: 600,
            margin: "0 0 20px",
          }}
        >
          PDF, DOCX, PPTX, fotoğraf — hepsi olur
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          style={{
            padding: "14px 32px",
            background: "var(--ink)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 14,
            border: "none",
            borderRadius: 100,
          }}
        >
          Dosya seç
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
          }}
        />
      </div>
    </div>
  );
}
