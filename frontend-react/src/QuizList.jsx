import { useState } from "react";

export default function QuizList({ quiz }) {
  const [answers, setAnswers] = useState({});

  const select = (qIndex, optIndex) => {
    if (answers[qIndex] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.entries(answers).filter(
    ([qIndex, optIndex]) => quiz[qIndex].dogru_cevap_index === optIndex
  ).length;

  return (
    <div>
      {answeredCount > 0 && (
        <div
          style={{
            display: "inline-block",
            background: "var(--purple-soft)",
            color: "#3C3489",
            fontSize: 13,
            fontWeight: 800,
            padding: "8px 16px",
            borderRadius: 100,
            marginBottom: 20,
          }}
        >
          {correctCount} / {answeredCount} doğru
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {quiz.map((q, qIndex) => {
          const selected = answers[qIndex];
          const isAnswered = selected !== undefined;

          return (
            <div
              key={qIndex}
              style={{
                border: "3px solid var(--ink)",
                borderRadius: 20,
                padding: "20px 22px",
                background: "#fff",
              }}
            >
              <p style={{ fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>
                {qIndex + 1}. {q.soru}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {q.secenekler.map((opt, optIndex) => {
                  let bg = "#fff";
                  let border = "2px solid var(--line)";
                  if (isAnswered) {
                    if (optIndex === q.dogru_cevap_index) {
                      bg = "var(--green-soft)";
                      border = "2px solid var(--green)";
                    } else if (optIndex === selected) {
                      bg = "var(--red-soft)";
                      border = "2px solid var(--red)";
                    }
                  }
                  return (
                    <button
                      key={optIndex}
                      onClick={() => select(qIndex, optIndex)}
                      style={{
                        textAlign: "left",
                        padding: "12px 16px",
                        borderRadius: 12,
                        border,
                        background: bg,
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: isAnswered ? "default" : "pointer",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {isAnswered && q.aciklama && (
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--ink-soft)",
                    fontWeight: 600,
                    marginTop: 14,
                    marginBottom: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {q.aciklama}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
