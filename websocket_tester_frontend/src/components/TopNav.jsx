import React from 'react';

/**
 * TopNav displays application branding and current connection status.
 * @param {{status: 'disconnected'|'connecting'|'connected'}} props
 */
const TopNav = ({ status }) => {
  const statusClass = `status-chip ${status}`;
  const statusLabel = status === 'connected'
    ? 'Connected'
    : status === 'connecting'
      ? 'Connecting...'
      : 'Disconnected';

  return (
    <header className="topnav">
      <div className="brand">
        <span className="dot" />
        WebSocket Tester
      </div>
      <div className="topnav-spacer" />
      <div className={statusClass} aria-live="polite">
        {statusLabel}
      </div>
    </header>
  );
};

export default TopNav;
