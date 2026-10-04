import { useRef, useState } from "react";

export default function UploadScreen({ onFileSelected }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div style={{ textAlign: "center", marginBottom: "28px" }}>
      {/* Vurucu Rozet */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        background: "rgba(168, 85, 247, 0.12)",
        border: "1px solid rgba(168, 85, 247, 0.35)",
        padding: "6px 16px",
        borderRadius: "30px",
        marginBottom: "22px",
        boxShadow: "0 0 20px rgba(168, 85, 247, 0.15)"
      }}>
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#c084fc", boxShadow: "0 0 10px #c084fc" }} />
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#e879f9", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          AI Destekli Akademik Çalışma Alanı
        </span>
      </div>

      {/* Büyük & Vurucu Başlık */}
      <h1 style={{
        fontSize: "2.75rem",
        fontWeight: 800,
        color: "#ffffff",
        margin: "0 auto 16px auto",
        lineHeight: 1.2,
        letterSpacing: "-0.035em",
        maxWidth: "640px"
      }}>
        Ders Notların,{" "}
        <span style={{
          background: "linear-gradient(135deg, #c084fc 0%, #f472b6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Dakikalar İçinde
        </span>{" "}
        Sınav Materyaline Dönüşsün.
      </h1>

      {/* Alt Açıklama */}
      <p style={{
        fontSize: "15px",
        color: "#94a3b8",
        margin: "0 auto 36px auto",
        maxWidth: "540px",
        lineHeight: 1.6
      }}>
        Dökümanını yükle; yapay zeka formülleri koruyarak özet çıkarsın, ezber kartları ve seviye tespit testleri hazırlasın.
      </p>

      {/* Koyu Cam (Dark Glass) Yükleme Alanı - Beyaz zemin kaldırıldı */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          background: isDragging ? "rgba(168, 85, 247, 0.08)" : "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `2px dashed ${isDragging ? "#c084fc" : "rgba(255, 255, 255, 0.15)"}`,
          borderRadius: "24px",
          padding: "52px 30px",
          cursor: "pointer",
          transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: isDragging 
            ? "0 20px 40px -10px rgba(168, 85, 247, 0.3)" 
            : "0 10px 35px -10px rgba(0, 0, 0, 0.5)"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.5)";
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
            e.currentTarget.style.transform = "none";
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.pptx"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* Parıltılı İkon */}
        <div style={{
          width: "60px",
          height: "60px",
          borderRadius: "18px",
          background: "linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(244, 114, 182, 0.2) 100%)",
          border: "1px solid rgba(168, 85, 247, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 18px auto",
          fontSize: "26px",
          boxShadow: "0 8px 20px -5px rgba(168, 85, 247, 0.3)"
        }}>
          📑
        </div>

        {/* Net ve Okunabilir Tipografi */}
        <div style={{
          fontSize: "1.2rem",
          fontWeight: 700,
          color: "#f8fafc",
          marginBottom: "8px",
          letterSpacing: "-0.01em"
        }}>
          Dosyanı buraya sürükleyip bırak
        </div>

        <div style={{
          fontSize: "13.5px",
          color: "#94a3b8",
          marginBottom: "26px"
        }}>
          PDF, DOCX, PPTX dosyaları desteklenir
        </div>

        {/* Buton */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          style={{
            background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
            color: "#ffffff",
            padding: "12px 28px",
            borderRadius: "12px",
            border: "none",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 8px 24px -4px rgba(236, 72, 153, 0.45)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
        >
          Dosya Seç
        </button>
      </div>
    </div>
  );
}