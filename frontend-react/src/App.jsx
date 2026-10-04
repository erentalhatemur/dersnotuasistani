import { useCallback, useRef, useState, useEffect } from "react";
import UploadScreen from "./UploadScreen.jsx";
import ProcessingScreen from "./ProcessingScreen.jsx";
import ErrorScreen from "./ErrorScreen.jsx";
import ResultsScreen from "./ResultsScreen.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || "https://dersnotuasistani-backend.onrender.com";
const POLL_INTERVAL_MS = 2000;
const STORAGE_KEY = "ders_notu_history_v1";

export default function App() {
  const [status, setStatus] = useState("idle");
  const [filename, setFilename] = useState("");
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const pollTimeoutRef = useRef(null);

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

        const combined = [...localItems];
        serverItems.forEach((serverItem) => {
          const exists = combined.some((l) => l.filename === serverItem.filename);
          if (!exists) combined.push(serverItem);
        });

        setHistory(combined);
      } else {
        setHistory(localItems);
      }
    } catch (err) {
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
          setErrorMessage("Sunucuya bağlanılamadı.");
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
        setErrorMessage(err.message || "Yükleme sırasında hata oluştu.");
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

  if (status === "processing") return <ProcessingScreen filename={filename} />;
  if (status === "error") return <ErrorScreen message={errorMessage} onRetry={reset} />;
  if (status === "done" && result) {
    return <ResultsScreen filename={filename} result={result} onNewUpload={reset} />;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.15), rgba(255, 255, 255, 0)), #fafafa",
      backgroundImage: `
        radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
        radial-gradient(rgba(148, 163, 184, 0.18) 1px, transparent 1px)
      `,
      backgroundSize: "100% 100%, 24px 24px",
      padding: "48px 20px 80px 20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: "#0f172a"
    }}>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        
        {/* Upload Alanı */}
        <UploadScreen onFileSelected={handleFileSelected} />

        {/* Geçmiş Çalışmalar */}
        <div style={{ marginTop: "44px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px" }}>📂</span>
              <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                Kütüphanem & Geçmiş
              </h3>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "color 0.2s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >
                Temizle
              </button>
            )}
          </div>

          {isLoadingHistory && (
            <div style={{ textAlign: "center", fontSize: "13px", color: "#94a3b8", padding: "24px" }}>
              Kayıtlar taranıyor...
            </div>
          )}

          {!isLoadingHistory && history.length === 0 && (
            <div style={{
              border: "1px dashed rgba(203, 213, 225, 0.8)",
              borderRadius: "16px",
              padding: "32px",
              textAlign: "center",
              fontSize: "13.5px",
              color: "#94a3b8",
              background: "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(6px)"
            }}>
              Henüz kaydedilmiş çalışma notu yok. İlk notunu yukarıdan yükle!
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectHistoryItem(item)}
                style={{
                  background: "rgba(255, 255, 255, 0.85)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(226, 232, 240, 0.8)",
                  borderRadius: "16px",
                  padding: "16px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 6px 16px -4px rgba(0,0,0,0.03)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "#c7d2fe";
                  e.currentTarget.style.boxShadow = "0 12px 24px -6px rgba(99, 102, 241, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "rgba(226, 232, 240, 0.8)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02), 0 6px 16px -4px rgba(0,0,0,0.03)";
                }}
              >
                <div style={{ overflow: "hidden", paddingRight: "16px" }}>
                  <div style={{ fontWeight: 600, fontSize: "14.5px", color: "#1e293b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {item.filename}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                    {item.date}
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexShrink: 0
                }}>
                  <div style={{
                    background: "rgba(99, 102, 241, 0.08)",
                    color: "#4f46e5",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "-0.01em"
                  }}>
                    {item.result?.ogreticilik_degerlendirmesi?.skor ? `${item.result.ogreticilik_degerlendirmesi.skor} Puan` : "Görüntüle"}
                  </div>
                  <span style={{ color: "#cbd5e1", fontSize: "14px" }}>➔</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}