import { useCallback, useRef, useState, useEffect } from "react";
import UploadScreen from "./UploadScreen.jsx";
import ProcessingScreen from "./ProcessingScreen.jsx";
import ErrorScreen from "./ErrorScreen.jsx";
import ResultsScreen from "./ResultsScreen.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || "https://dersnotuasistani-backend.onrender.com";
const POLL_INTERVAL_MS = 2000;
const STORAGE_KEY = "ders_notu_history_v1";

export default function App() {
  const [status, setStatus] = useState("idle"); // "idle" | "processing" | "error" | "done"
  const [filename, setFilename] = useState("");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const pollTimeoutRef = useRef(null);

  // Veritabanı (Supabase) ve LocalStorage geçmişini birleştirip getir
  const fetchCombinedHistory = useCallback(async () => {
    setIsLoadingHistory(true);

    let localItems = [];
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        localItems = JSON.parse(saved);
      } catch (e) {
        console.error("Yerel geçmiş okunamadı:", e);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/api/history`);
      if (res.ok) {
        const body = await res.json();
        const serverItems = (body.data || []).map((s) => ({
          id: `supabase-${s.id}`,
          filename: s.file_name,
          date: new Date(s.created_at).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          result: {
            ozet_markdown: s.summary,
            flashcards: [],
            quiz: [],
            ogreticilik_degerlendirmesi: {
              skor: s.ai_score,
              geribildirim: "Veritabanı arşivinden yüklendi.",
            },
          },
        }));

        // Eşleşen dosyaları birleştir (yereldeki quiz/flashcard'ları önceliklendir)
        const combined = [...localItems];
        serverItems.forEach((serverItem) => {
          const exists = combined.some((l) => l.filename === serverItem.filename);
          if (!exists) {
            combined.push(serverItem);
          }
        });

        setHistory(combined);
      } else {
        setHistory(localItems);
      }
    } catch (err) {
      console.warn("Sunucu geçmişine ulaşılamadı, yerel geçmiş kullanılıyor:", err);
      setHistory(localItems);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchCombinedHistory();
  }, [fetchCombinedHistory]);

  const saveToHistory = (name, resData) => {
    const newItem = {
      id: Date.now().toString(),
      filename: name,
      date: new Date().toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      result: resData,
    };
    const updated = [newItem, ...history.filter((h) => h.filename !== name)];
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const reset = useCallback(() => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    setStatus("idle");
    setFilename("");
    setResult(null);
    setErrorMessage("");
    fetchCombinedHistory();
  }, [fetchCombinedHistory]);

  const pollStatus = useCallback(
    (jobId, currentFilename) => {
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
          setErrorMessage("Sunucuya bağlanılamadı. Backend servisinin açık olduğundan emin olun.");
          setStatus("error");
        }
      };
      poll();
    },
    [history]
  );

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

  const handleSelectHistoryItem = (item) => {
    setFilename(item.filename);
    setResult(item.result);
    setStatus("done");
  };

  const clearHistory = () => {
    if (window.confirm("Geçmiş çalışma kayıtlarını temizlemek istiyor musun?")) {
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

  return (
    <div style={{ padding: "30px 20px", maxWidth: "680px", margin: "0 auto", color: "var(--ink, #1e293b)" }}>
      {/* Dosya Yükleme Ekranı */}
      <UploadScreen onFileSelected={handleFileSelected} />

      {/* Geçmiş Çalışmalar Bölümü */}
      <div style={{ marginTop: "36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 900, margin: 0 }}>⏱️ Geçmiş Çalışmalarım</h3>
          {history.length > 0 && (
            <button 
              onClick={clearHistory}
              style={{ background: "none", border: "none", color: "#ef4444", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}
            >
              Temizle
            </button>
          )}
        </div>

        {isLoadingHistory && (
          <div style={{ textAlign: "center", fontSize: "13px", color: "#64748b", padding: "12px" }}>
            Geçmiş yükleniyor...
          </div>
        )}

        {!isLoadingHistory && history.length === 0 && (
          <div style={{
            border: "2px dashed #cbd5e1",
            borderRadius: "14px",
            padding: "24px",
            textAlign: "center",
            fontSize: "13px",
            color: "#64748b",
            background: "#f8fafc"
          }}>
            Henüz kaydedilmiş bir çalışma oturumu bulunmuyor.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelectHistoryItem(item)}
              style={{
                border: "2.5px solid var(--ink, #1e293b)",
                borderRadius: "14px",
                padding: "16px 20px",
                background: "#fff",
                boxShadow: "4px 4px 0px var(--ink, #1e293b)",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translate(-2px, -2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            >
              <div style={{ overflow: "hidden", paddingRight: "12px" }}>
                <div style={{ fontWeight: 800, fontSize: "14px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {item.filename}
                </div>
                <div style={{ fontSize: "11px", opacity: 0.6, marginTop: "4px" }}>
                  {item.date}
                </div>
              </div>
              <div style={{
                background: "#fef08a",
                border: "2px solid var(--ink, #1e293b)",
                padding: "6px 12px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 900,
                flexShrink: 0
              }}>
                {item.result?.ogreticilik_degerlendirmesi?.skor ? `${item.result.ogreticilik_degerlendirmesi.skor} Puan` : "İncele"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}