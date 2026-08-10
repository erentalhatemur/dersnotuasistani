import { useCallback, useRef, useState, useEffect } from "react";
import UploadScreen from "./UploadScreen.jsx";
import ProcessingScreen from "./ProcessingScreen.jsx";
import ErrorScreen from "./ErrorScreen.jsx";
import ResultsScreen from "./ResultsScreen.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const POLL_INTERVAL_MS = 2000;
const STORAGE_KEY = "ders_notu_history_v1";

export default function App() {
  const [status, setStatus] = useState("idle"); // "idle" | "processing" | "error" | "done" | "history_detail"
  const [filename, setFilename] = useState("");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [history, setHistory] = useState([]);
  const pollTimeoutRef = useRef(null);

  // Uygulama açıldığında localStorage'dan geçmişi yükle
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Geçmiş yüklenemedi:", e);
      }
    }
  }, []);

  // Yeni bir sonuç üretildiğinde geçmişe kaydet
  const saveToHistory = (name, resData) => {
    const newItem = {
      id: Date.now().toString(),
      filename: name,
      date: new Date().toLocaleDateString("tr-TR", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      result: resData,
    };
    const updated = [newItem, ...history];
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const reset = useCallback(() => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    setStatus("idle");
    setFilename("");
    setResult(null);
    setErrorMessage("");
  }, []);

  const pollStatus = useCallback((jobId, currentFilename) => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/status/${jobId}`);
        if (!res.ok) throw new Error("Durum sorgulanamadı.");
        const job = await res.json();

        if (job.status === "processing") {
          pollTimeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        } else if (job.status === "done") {
          setResult(job.result);
          setStatus("done");
          saveToHistory(currentFilename, job.result);
        } else {
          setErrorMessage(job.error_message || "Bilinmeyen bir hata oluştu.");
          setStatus("error");
        }
      } catch (err) {
        setErrorMessage("Sunucuya bağlanılamadı. Backend'in çalıştığından emin ol.");
        setStatus("error");
      }
    };
    poll();
  }, [history]);

  const handleFileSelected = useCallback(
    async (file) => {
      setFilename(file.name);
      setStatus("processing");
      setErrorMessage("");

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`${API_BASE}/api/upload`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || "Yükleme başarısız oldu.");
        }
        const job = await res.json();
        pollStatus(job.job_id, file.name);
      } catch (err) {
        setErrorMessage(err.message || "Yükleme sırasında bir hata oluştu.");
        setStatus("error");
      }
    },
    [pollStatus]
  );

  // Geçmişten bir öğe seçildiğinde
  const handleSelectHistoryItem = (item) => {
    setFilename(item.filename);
    setResult(item.result);
    setStatus("done");
  };

  // Geçmişi temizleme
  const clearHistory = () => {
    if (confirm("Geçmişi temizlemek istediğine emin misin?")) {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  if (status === "processing") {
    return <ProcessingScreen filename={filename} />;
  }

  if (status === "error") {
    return <ErrorScreen message={errorMessage} onRetry={reset} />;
  }

  if (status === "done" && result) {
    return (
      <ResultsScreen 
        filename={filename} 
        result={result} 
        onNewUpload={reset} 
      />
    );
  }

  // Ana Ekran (Yükleme + Geçmiş Listesi)
  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", color: "var(--ink)" }}>
      {/* Üst Başlık */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 900, margin: "0 0 8px 0" }}>📚 Kampüs Çalışma Asistanı</h1>
        <p style={{ fontSize: "0.9rem", opacity: 0.7, margin: 0 }}>PDF'ini yükle, yapay zeka senin için özetlesin, kartlar ve quiz hazırlasın.</p>
      </div>

      {/* Yükleme Ekranı Bileşeni */}
      <UploadScreen onFileSelected={handleFileSelected} />

      {/* Geçmiş Çalışmalar Bölümü */}
      {history.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 900, margin: 0 }}>⏱️ Geçmiş Çalışmalarım</h3>
            <button 
              onClick={clearHistory}
              style={{ background: "none", border: "none", color: "#ef4444", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
            >
              Temizle
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectHistoryItem(item)}
                style={{
                  border: "2px solid var(--ink)",
                  borderRadius: "12px",
                  padding: "14px",
                  background: "#fff",
                  boxShadow: "3px 3px 0px var(--ink)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "transform 0.1s ease"
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: "14px" }}>{item.filename}</div>
                  <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "2px" }}>{item.date}</div>
                </div>
                <div style={{ background: "#fef08a", border: "2px solid var(--ink)", padding: "4px 8px", borderRadius: "8px", fontSize: "12px", fontWeight: 900 }}>
                  Skor: {item.result.ogreticilik_degerlendirmesi?.skor || "-"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}