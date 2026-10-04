import { useEffect, useState } from "react";

const STEPS = [
  "PDF belgesi taranıyor ve metin katmanları okunuyor...",
  "Akademik formüller, LaTeX ifadeleri ve kavramlar ayrıştırılıyor...",
  "Qwen 27B ile pedagojik özet ve analiz yapılıyor...",
  "Flashcard destesi ve çoktan seçmeli quiz hazırlanıyor...",
  "Son rötuşlar yapılıyor, çalışma masan oluşturuluyor..."
];

export default function ProcessingScreen({ filename }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#090a0f",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      color: "#f8fafc",
      padding: "20px"
    }}>
      {/* Arka Plan Ambient Glow */}
      <div style={{
        position: "absolute",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(236, 72, 153, 0.12) 40%, transparent 70%)",
        filter: "blur(110px)",
        pointerEvents: "none",
        zIndex: 0
      }} />

      {/* Cam Panel */}
      <div style={{
        position: "relative",
        zIndex: 1,
        maxWidth: "480px",
        width: "100%",
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "28px",
        padding: "48px 32px",
        textAlign: "center",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)"
      }}>
        {/* Neon Dönen Spinner */}
        <div style={{
          position: "relative",
          width: "72px",
          height: "72px",
          margin: "0 auto 28px"
        }}>
          {/* Arka plan silik halka */}
          <div style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "3px solid rgba(168, 85, 247, 0.15)"
          }} />
          {/* Dönen neon gradient halka */}
          <div style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "3px solid transparent",
            borderTopColor: "#c084fc",
            borderRightColor: "#f472b6",
            animation: "spinPulse 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
            filter: "drop-shadow(0 0 10px rgba(192, 132, 252, 0.6))"
          }} />
          {/* Ortadaki ışıltı ikonu */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px"
          }}>
            ✨
          </div>
        </div>

        {/* Dosya Adı Etiketi */}
        <div style={{
          display: "inline-block",
          maxWidth: "80%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "5px 14px",
          borderRadius: "20px",
          fontSize: "12px",
          color: "#94a3b8",
          marginBottom: "16px"
        }}>
          📄 {filename || "Ders Notu"}
        </div>

        {/* Başlık */}
        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "#ffffff",
          margin: "0 0 10px",
          letterSpacing: "-0.02em"
        }}>
          Yapay Zeka Analiz Yapıyor
        </h2>

        {/* Dinamik Adım Metni */}
        <p style={{
          fontSize: "14px",
          color: "#cbd5e1",
          margin: 0,
          minHeight: "42px",
          lineHeight: 1.5,
          transition: "all 0.3s ease"
        }}>
          {STEPS[currentStepIndex]}
        </p>

        {/* İlerleme Çubuğu */}
        <div style={{
          marginTop: "28px",
          height: "4px",
          width: "100%",
          background: "rgba(255, 255, 255, 0.06)",
          borderRadius: "99px",
          overflow: "hidden"
        }}>
          <div style={{
            height: "100%",
            width: `${((currentStepIndex + 1) / STEPS.length) * 100}%`,
            background: "linear-gradient(90deg, #a855f7 0%, #ec4899 100%)",
            borderRadius: "99px",
            transition: "width 0.6s ease",
            boxShadow: "0 0 10px rgba(236, 72, 153, 0.5)"
          }} />
        </div>
      </div>

      <style>{`
        @keyframes spinPulse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}