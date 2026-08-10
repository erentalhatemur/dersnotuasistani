export default function ErrorScreen({ message, onRetry }) {
  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "120px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          margin: "0 auto 24px",
          borderRadius: "50%",
          background: "var(--red-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          fontWeight: 800,
          color: "var(--red)",
        }}
      >
        !
      </div>
      <p style={{ fontSize: 19, fontWeight: 800, margin: "0 0 8px" }}>
        Bir şeyler ters gitti
      </p>
      <p
        style={{
          fontSize: 14,
          color: "var(--ink-soft)",
          fontWeight: 600,
          margin: "0 0 28px",
          lineHeight: 1.6,
        }}
      >
        {message}
      </p>
      <button
        onClick={onRetry}
        style={{
          padding: "12px 28px",
          background: "var(--ink)",
          color: "#fff",
          fontWeight: 800,
          fontSize: 14,
          border: "none",
          borderRadius: 100,
        }}
      >
        Tekrar dene
      </button>
    </div>
  );
}
