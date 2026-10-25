export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg)",
    }}>
      <style>{`
        .falling-item {
          position: absolute;
          font-size: 2.5rem;
          line-height: 1;
          pointer-events: none;
          will-change: transform;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));
          z-index: 2;
        }
      `}</style>
      {children}
    </div>
  );
}
