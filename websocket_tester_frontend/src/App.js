import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

/**
 * WebSocket Tester Frontend
 * - Top nav bar with app title and connection status
 * - Left sidebar to manage saved endpoints
 * - Main panel with connection controls and real-time log/messages
 * - Supports connect/disconnect, send message, copy and clear logs
 * - Modern, minimalistic, light theme using provided color palette
 * - Enhanced: Auto-reconnect with backoff and visible "Reconnecting" status
 */

// Color palette from request
const COLORS = {
  primary: '#1976d2',
  secondary: '#424242',
  accent: '#ff9800',
};

// Helpers
const formatTimestamp = (d = new Date()) =>
  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

// Types of log entries
const LOG_TYPES = {
  INFO: 'info',
  SENT: 'sent',
  RECEIVED: 'received',
  ERROR: 'error',
  STATUS: 'status',
};

// PUBLIC_INTERFACE
export default function App() {
  // Saved endpoints state (persisted to localStorage)
  const [savedEndpoints, setSavedEndpoints] = useState(() => {
    try {
      const raw = localStorage.getItem('ws_saved_endpoints');
      return raw ? JSON.parse(raw) : ['wss://echo.websocket.events', 'wss://ws.postman-echo.com/raw'];
    } catch {
      return ['wss://echo.websocket.events', 'wss://ws.postman-echo.com/raw'];
    }
  });

  const [serverUrl, setServerUrl] = useState(savedEndpoints[0] || '');
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [nextRetryInMs, setNextRetryInMs] = useState(null);
  const [autoReconnect, setAutoReconnect] = useState(() => {
    try {
      const raw = localStorage.getItem('ws_auto_reconnect');
      return raw ? JSON.parse(raw) : true;
    } catch {
      return true;
    }
  });

  const [messageText, setMessageText] = useState('');
  const [logs, setLogs] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState('all'); // all | sent | received | status | error

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const isManualCloseRef = useRef(false);

  const logEndRef = useRef(null);
  const logScrollerRef = useRef(null);

  // Persist endpoints and autoReconnect preference
  useEffect(() => {
    try {
      localStorage.setItem('ws_saved_endpoints', JSON.stringify(savedEndpoints));
    } catch {
      // ignore storage errors
    }
  }, [savedEndpoints]);

  useEffect(() => {
    try {
      localStorage.setItem('ws_auto_reconnect', JSON.stringify(autoReconnect));
    } catch {
      // ignore storage errors
    }
  }, [autoReconnect]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
      }
    };
  }, []);

  // Autoscroll behavior
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Track manual scroll to disable autoscroll if user scrolls up
  useEffect(() => {
    const el = logScrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      setAutoScroll(nearBottom);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const addLog = (type, content) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ts: new Date().toISOString(),
        type,
        content,
      },
    ]);
  };

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs;
    return logs.filter((l) => l.type === filter);
  }, [logs, filter]);

  const clearReconnectTimers = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setNextRetryInMs(null);
  };

  const scheduleReconnect = () => {
    if (!autoReconnect) return;
    // Exponential backoff with jitter: base 1000ms, cap 30000ms
    const base = 1000;
    const max = 30000;
    const attempt = Math.max(1, retryCount + 1);
    const delay = Math.min(max, base * Math.pow(2, attempt - 1));
    const jitter = Math.floor(Math.random() * 400); // up to 400ms jitter
    const nextDelay = delay + jitter;

    setRetryCount(attempt);
    setReconnecting(true);
    setConnecting(false);
    addLog(LOG_TYPES.STATUS, `Reconnecting in ${(nextDelay / 1000).toFixed(1)}s (attempt ${attempt})...`);

    // Update countdown indicator every 200ms
    setNextRetryInMs(nextDelay);
    const start = Date.now();
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, nextDelay - elapsed);
      setNextRetryInMs(remaining);
      if (remaining <= 0 && countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    }, 200);

    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      attemptConnect(true);
    }, nextDelay);
  };

  const attemptConnect = (isRetry = false) => {
    if (isConnected || connecting || !serverUrl) return;
    try {
      setConnecting(true);
      setReconnecting(isRetry);
      addLog(LOG_TYPES.STATUS, `${isRetry ? 'Reconnecting' : 'Connecting'} to ${serverUrl} ...`);
      const ws = new WebSocket(serverUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnecting(false);
        setReconnecting(false);
        setRetryCount(0);
        clearReconnectTimers();
        addLog(LOG_TYPES.STATUS, `Connected to ${serverUrl}`);
      };

      ws.onmessage = (evt) => {
        addLog(LOG_TYPES.RECEIVED, evt.data);
      };

      ws.onerror = (evt) => {
        addLog(LOG_TYPES.ERROR, `WebSocket error${evt?.message ? `: ${evt.message}` : ''}`);
      };

      ws.onclose = (evt) => {
        setIsConnected(false);
        setConnecting(false);
        const wasManual = isManualCloseRef.current;
        isManualCloseRef.current = false;

        addLog(
          LOG_TYPES.STATUS,
          `Connection closed${evt?.code ? ` (code: ${evt.code})` : ''}${wasManual ? ' (manual)' : ''}`
        );

        if (!wasManual && autoReconnect) {
          scheduleReconnect();
        } else {
          setReconnecting(false);
          clearReconnectTimers();
        }
      };
    } catch (e) {
      setConnecting(false);
      setReconnecting(false);
      addLog(LOG_TYPES.ERROR, `Failed to connect: ${e.message}`);
      // If failed immediately and autoReconnect is on, schedule retry
      if (autoReconnect) {
        scheduleReconnect();
      }
    }
  };

  // PUBLIC_INTERFACE
  const connect = () => {
    isManualCloseRef.current = false;
    attemptConnect(false);
  };

  // PUBLIC_INTERFACE
  const disconnect = () => {
    clearReconnectTimers();
    setRetryCount(0);
    setReconnecting(false);
    if (wsRef.current && (isConnected || connecting)) {
      addLog(LOG_TYPES.STATUS, 'Disconnecting...');
      try {
        isManualCloseRef.current = true;
        wsRef.current.close();
      } catch (e) {
        addLog(LOG_TYPES.ERROR, `Error during disconnect: ${e.message}`);
      }
      wsRef.current = null;
      setIsConnected(false);
      setConnecting(false);
    }
  };

  // PUBLIC_INTERFACE
  const sendMessage = () => {
    if (!wsRef.current || !isConnected) {
      addLog(LOG_TYPES.ERROR, 'Not connected. Please connect first.');
      return;
    }
    if (!messageText.trim()) return;
    try {
      wsRef.current.send(messageText);
      addLog(LOG_TYPES.SENT, messageText);
      setMessageText('');
    } catch (e) {
      addLog(LOG_TYPES.ERROR, `Failed to send: ${e.message}`);
    }
  };

  // PUBLIC_INTERFACE
  const copyLogs = async () => {
    const text = logs
      .map((l) => `[${formatTimestamp(new Date(l.ts))}] ${l.type.toUpperCase()}: ${l.content}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      addLog(LOG_TYPES.INFO, 'Logs copied to clipboard.');
    } catch {
      addLog(LOG_TYPES.ERROR, 'Failed to copy logs.');
    }
  };

  // PUBLIC_INTERFACE
  const clearLogs = () => {
    setLogs([]);
    addLog(LOG_TYPES.STATUS, 'Log cleared.');
  };

  const addEndpoint = () => {
    const trimmed = serverUrl.trim();
    if (!trimmed) return;
    if (!savedEndpoints.includes(trimmed)) {
      setSavedEndpoints((prev) => [trimmed, ...prev].slice(0, 50));
    }
  };

  const removeEndpoint = (url) => {
    setSavedEndpoints((prev) => prev.filter((e) => e !== url));
  };

  const effectiveStatus = isConnected
    ? 'Connected'
    : reconnecting
    ? `Reconnecting${nextRetryInMs != null ? ` in ${(nextRetryInMs / 1000).toFixed(1)}s...` : '...'}` 
    : connecting
    ? 'Connecting...'
    : 'Disconnected';

  const statusColor = isConnected
    ? 'connected'
    : reconnecting
    ? 'reconnecting'
    : connecting
    ? 'connecting'
    : 'disconnected';

  return (
    <div className="ws-app" data-theme="light">
      <TopNav status={effectiveStatus} statusColor={statusColor} />

      <div className="ws-layout">
        <Sidebar
          endpoints={savedEndpoints}
          current={serverUrl}
          onSelect={setServerUrl}
          onRemove={removeEndpoint}
          onAddCurrent={addEndpoint}
        />

        <MainPanel
          serverUrl={serverUrl}
          setServerUrl={setServerUrl}
          isConnected={isConnected}
          isConnecting={connecting}
          isReconnecting={reconnecting}
          autoReconnect={autoReconnect}
          setAutoReconnect={setAutoReconnect}
          onConnect={connect}
          onDisconnect={disconnect}
          messageText={messageText}
          setMessageText={setMessageText}
          onSend={sendMessage}
          logs={filteredLogs}
          logEndRef={logEndRef}
          logScrollerRef={logScrollerRef}
          filter={filter}
          setFilter={setFilter}
          onCopy={copyLogs}
          onClear={clearLogs}
          retryCount={retryCount}
          nextRetryInMs={nextRetryInMs}
        />
      </div>
    </div>
  );
}

function TopNav({ status, statusColor }) {
  return (
    <nav className="ws-topnav">
      <div className="brand">
        <span className="logo-dot" />
        <span className="brand-name">WebSocket Tester</span>
      </div>
      <div className="status">
        <span className={`status-dot ${statusColor}`} />
        <span className="status-text">{status}</span>
      </div>
    </nav>
  );
}

function Sidebar({ endpoints, current, onSelect, onRemove, onAddCurrent }) {
  return (
    <aside className="ws-sidebar">
      <div className="sidebar-header">
        <h3>Saved Endpoints</h3>
        <button className="btn btn-accent btn-xs" onClick={onAddCurrent} title="Save current URL">
          Save
        </button>
      </div>
      <ul className="endpoint-list">
        {endpoints.length === 0 && (
          <li className="endpoint-empty">No saved endpoints yet.</li>
        )}
        {endpoints.map((url) => (
          <li key={url} className={`endpoint-item ${current === url ? 'active' : ''}`}>
            <button className="endpoint-select" onClick={() => onSelect(url)} title={url}>
              {url}
            </button>
            <button
              className="endpoint-remove"
              onClick={() => onRemove(url)}
              aria-label={`Remove ${url}`}
              title="Remove"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <p className="muted">Tip: Select an endpoint to populate the URL field.</p>
      </div>
    </aside>
  );
}

function MainPanel({
  serverUrl,
  setServerUrl,
  isConnected,
  isConnecting,
  isReconnecting,
  autoReconnect,
  setAutoReconnect,
  onConnect,
  onDisconnect,
  messageText,
  setMessageText,
  onSend,
  logs,
  logEndRef,
  logScrollerRef,
  filter,
  setFilter,
  onCopy,
  onClear,
  retryCount,
  nextRetryInMs,
}) {
  return (
    <main className="ws-main">
      <section className="connection-controls card">
        <div className="field-row">
          <label htmlFor="ws-url" className="label">
            Server URL
          </label>
          <input
            id="ws-url"
            className="input"
            placeholder="wss://example.com/socket"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            aria-label="WebSocket server URL"
          />
          {!isConnected ? (
            <button
              className="btn btn-primary"
              onClick={onConnect}
              disabled={!serverUrl.trim() || isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={onDisconnect}>
              Disconnect
            </button>
          )}
        </div>

        <div className="field-row">
          <label className="label" htmlFor="auto-reconnect-toggle">
            Auto-reconnect
          </label>
          <button
            id="auto-reconnect-toggle"
            className={`chip ${autoReconnect ? 'chip-active' : ''}`}
            onClick={() => setAutoReconnect((v) => !v)}
            aria-pressed={autoReconnect}
            title="Toggle automatic reconnection"
          >
            {autoReconnect ? 'Enabled' : 'Disabled'}
          </button>
          <div style={{ minHeight: 40, display: 'flex', alignItems: 'center' }}>
            {(isReconnecting || isConnecting) && (
              <span className="muted" aria-live="polite">
                {isReconnecting
                  ? `Reconnecting${nextRetryInMs != null ? ` in ${(nextRetryInMs / 1000).toFixed(1)}s` : ''} (attempt ${retryCount})`
                  : 'Attempting connection...'}
              </span>
            )}
          </div>
        </div>

        <div className="field-row">
          <label htmlFor="ws-message" className="label">
            Message
          </label>
          <input
            id="ws-message"
            className="input"
            placeholder='Type a message, e.g., {"hello":"world"}'
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSend();
            }}
            aria-label="Message to send"
          />
          <button className="btn btn-accent" onClick={onSend} disabled={!isConnected}>
            Send ⏎
          </button>
        </div>
      </section>

      <section className="logs card">
        <div className="logs-toolbar">
          <div className="filters">
            <FilterButton label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
            <FilterButton label="Sent" active={filter === 'sent'} onClick={() => setFilter('sent')} />
            <FilterButton
              label="Received"
              active={filter === 'received'}
              onClick={() => setFilter('received')}
            />
            <FilterButton
              label="Status"
              active={filter === 'status'}
              onClick={() => setFilter('status')}
            />
            <FilterButton
              label="Error"
              active={filter === 'error'}
              onClick={() => setFilter('error')}
            />
          </div>
          <div className="actions">
            <button className="btn btn-ghost" onClick={onCopy} title="Copy logs">
              Copy
            </button>
            <button className="btn btn-ghost" onClick={onClear} title="Clear logs">
              Clear
            </button>
          </div>
        </div>
        <div className="logs-body" ref={logScrollerRef} role="log" aria-live="polite">
          {logs.length === 0 ? (
            <div className="logs-empty">
              <p>No messages yet. Connect to a server and send or wait for messages.</p>
            </div>
          ) : (
            logs.map((l) => <LogItem key={l.id} entry={l} />)
          )}
          <div ref={logEndRef} />
        </div>
      </section>
    </main>
  );
}

function FilterButton({ label, active, onClick }) {
  return (
    <button
      className={`chip ${active ? 'chip-active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function LogItem({ entry }) {
  const time = formatTimestamp(new Date(entry.ts));
  return (
    <div className={`log-item ${entry.type}`}>
      <span className="log-time">{time}</span>
      <span className="log-type">{entry.type.toUpperCase()}</span>
      <pre className="log-content">{String(entry.content)}</pre>
    </div>
  );
}
