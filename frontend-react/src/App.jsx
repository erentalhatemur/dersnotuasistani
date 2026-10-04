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
    if (window.confirm("Geçmiş kayıtları silmek istiyor musunuz?")) {
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
      background: "#090a0f",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      color: "#f8fafc",
      padding: "50px 20px 100px"
    }}>
      {/* Aurora Ambient Glow Orbs */}
      <div style={{
        position: "absolute",
        top: "-15%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "700px",
        height: "450px",
        background: "radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, rgba(236, 72, 153, 0.12) 40%, transparent 70%)",
        filter: "blur(90px)",
        pointerEvents: "none",
        zIndex: 0
      }} />

      <div style={{ maxWidth: "680px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        
        {/* Upload Alanı */}
        <UploadScreen onFileSelected={handleFileSelected} />

        {/* Kütüphane / Geçmiş Bölümü */}
        <div style={{ marginTop: "48px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a855f7", boxShadow: "0 0 10px #a855f7" }} />
              <h3 style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>
                Kütüphanem & Geçmiş
              </h3>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "color 0.2s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f43f5e")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
              >
                Temizle
              </button>
            )}
          </div>

          {isLoadingHistory && (
            <div style={{ textAlign: "center", fontSize: "13px", color: "#64748b", padding: "20px" }}>
              Arşiv taranıyor...
            </div>
          )}

          {!isLoadingHistory && history.length === 0 && (
            <div style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px dashed rgba(255, 255, 255, 0.08)",
              borderRadius: "18px",
              padding: "36px",
              textAlign: "center",
              fontSize: "13px",
              color: "#64748b"
            }}>
              Henüz kayıtlı bir çalışma notu bulunmuyor.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectHistoryItem(item)}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "16px",
                  padding: "16px 20px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.4)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(168, 85, 247, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.07)";
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ overflow: "hidden", paddingRight: "14px" }}>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#f8fafc", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {item.filename}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    {item.date}
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexShrink: 0
                }}>
                  <div style={{
                    background: "linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    color: "#e879f9",
                    padding: "5px 12px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.04em"
                  }}>
                    {item.result?.ogreticilik_degerlendirmesi?.skor ? `${item.result.ogreticilik_degerlendirmesi.skor} Puan` : "İncele"}
                  </div>
                  <span style={{ color: "#475569", fontSize: "13px" }}>➔</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}