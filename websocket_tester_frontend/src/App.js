import React from 'react';
import './index.css';
import './styles.css';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import ConnectionPanel from './components/ConnectionPanel';
import LogArea from './components/LogArea';
import useWebSocketManager from './hooks/useWebSocketManager';
import { getSavedEndpoints, saveEndpoint, deleteEndpoint } from './utils/storage';

// PUBLIC_INTERFACE
function App() {
  /** Main application that composes the WebSocket Tester UI:
   * - TopNav: Title and connection status
   * - Sidebar: Saved endpoints management
   * - ConnectionPanel: URL input, connect/disconnect, message send
   * - LogArea: Real-time logs and messages with copy/clear controls
   */
  const {
    url,
    setUrl,
    status,
    connect,
    disconnect,
    sendMessage,
    logs,
    messages,
    clearLogs,
    clearMessages,
  } = useWebSocketManager(process.env.REACT_APP_DEFAULT_WS_URL || '');

  const [endpoints, setEndpoints] = React.useState(getSavedEndpoints());

  const handleSaveEndpoint = (label, endpointUrl) => {
    const updated = saveEndpoint({ label, url: endpointUrl });
    setEndpoints(updated);
  };

  const handleDeleteEndpoint = (id) => {
    const updated = deleteEndpoint(id);
    setEndpoints(updated);
  };

  const handleSelectEndpoint = (endpoint) => {
    setUrl(endpoint.url);
  };

  const copyLogs = async () => {
    const all = [
      ...logs.map(l => `[${l.timestamp}] ${l.level.toUpperCase()}: ${l.message}`),
      ...messages.map(m => `[${m.timestamp}] MESSAGE ${m.direction === 'in' ? '⬇' : '⬆'}: ${m.text}`)
    ].join('\n');
    try {
      await navigator.clipboard.writeText(all);
      // add a small feedback entry
      // eslint-disable-next-line no-console
      console.info('Logs copied to clipboard');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy logs', e);
    }
  };

  const clearAll = () => {
    clearLogs();
    clearMessages();
  };

  return (
    <div className="app-root">
      <TopNav status={status} />
      <div className="app-body">
        <Sidebar
          endpoints={endpoints}
          onSelect={handleSelectEndpoint}
          onSave={handleSaveEndpoint}
          onDelete={handleDeleteEndpoint}
        />
        <main className="main-panel">
          <ConnectionPanel
            url={url}
            setUrl={setUrl}
            status={status}
            onConnect={connect}
            onDisconnect={disconnect}
            onSend={sendMessage}
          />
          <LogArea
            logs={logs}
            messages={messages}
            onCopy={copyLogs}
            onClear={clearAll}
          />
        </main>
      </div>
      <footer className="footer-note">
        <span>
          Tip: You can preconfigure a default WS URL using REACT_APP_DEFAULT_WS_URL in .env
        </span>
      </footer>
    </div>
  );
}

export default App;
