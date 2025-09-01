import React from 'react';

/**
 * LogArea shows logs and messages with copy and clear controls.
 * @param {{logs: Array, messages: Array, onCopy: Function, onClear: Function}} props
 */
const LogArea = ({ logs, messages, onCopy, onClear }) => {
  const ref = React.useRef(null);

  // Auto-scroll to bottom on new entries
  React.useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [logs, messages]);

  return (
    <section className="logs-card" aria-label="Logs and messages">
      <div className="logs-toolbar">
        <div style={{ fontWeight: 600, color: '#374151' }}>
          Live Log
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={onCopy} aria-label="Copy logs">
            Copy
          </button>
          <button className="btn" onClick={onClear} aria-label="Clear logs">
            Clear
          </button>
        </div>
      </div>
      <div ref={ref} className="logs-scroller">
        {logs.map((l, idx) => (
          <div key={`log-${idx}`} className="log-entry">
            <span className="log-meta">[{l.timestamp}]</span>
            <span className={`log-level-${l.level}`}>{l.level.toUpperCase()}:</span>{' '}
            <span>{l.message}</span>
          </div>
        ))}
        {messages.map((m, idx) => (
          <div key={`msg-${idx}`} className="log-entry message">
            <span className="log-meta">[{m.timestamp}]</span>
            <span className={m.direction === 'in' ? 'msg-direction-in' : 'msg-direction-out'}>
              {m.direction === 'in' ? '⬇ Incoming' : '⬆ Outgoing'}:
            </span>
            <span className="msg-text">{m.text}</span>
          </div>
        ))}
        {logs.length === 0 && messages.length === 0 && (
          <div className="log-entry" style={{ color: '#6b7280' }}>
            No activity yet. Connect to a server and start sending messages.
          </div>
        )}
      </div>
    </section>
  );
};

export default LogArea;
