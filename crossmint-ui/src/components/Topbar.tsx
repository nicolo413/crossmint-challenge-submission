export function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <img src="/crossmint-mark.svg" alt="Crossmint" className="topbar-mark" />
        <div className="topbar-brand-text">
          <span className="topbar-name">Crossmint</span>
          <span className="topbar-product">Megaverse Solver</span>
        </div>
      </div>
      <div className="topbar-status">
        <span className="status-dot status-dot--pulse" />
        All systems operational
      </div>
    </header>
  );
}
