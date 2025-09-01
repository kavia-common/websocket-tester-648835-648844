import React from 'react';

/**
 * ConnectionPanel provides URL input, connect/disconnect controls,
 * and a message send input.
 * @param {{
 *  url: string, setUrl: Function,
 *  status: 'disconnected'|'connecting'|'connected',
 *  onConnect: Function, onDisconnect: Function, onSend: Function
 * }} props
 */
const ConnectionPanel = ({ url, setUrl, status, onConnect, onDisconnect, onSend }) => {
  const [outgoing, setOutgoing] = React.useState('');

  const connect = (e) => {
    e.preventDefault();
    if (!url) return;
    onConnect(url);
  };

  const disconnect = (e) => {
    e.preventDefault();
    onDisconnect();
  };

  const send = (e) => {
    e.preventDefault();
    if (!outgoing.trim()) return;
    onSend(outgoing);
    setOutgoing('');
  };

  const isConnected = status === 'connected';

  return (
    <section className="card" aria-label="Connection controls">
      <div className="connection-row">
        <div className="url-input">
          <input
            className="input"
            placeholder="wss://echo.websocket.events"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label="WebSocket URL"
          />
        </div>
        {isConnected ? (
          <button className="btn btn-danger" onClick={disconnect} aria-label="Disconnect">
            Disconnect
          </button>
        ) : (
          <button className="btn btn-primary" onClick={connect} aria-label="Connect">
            Connect
          </button>
        )}
        <span className={`status-chip ${status}`} aria-live="polite">
          {status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
        </span>
      </div>

      <form className="send-row" onSubmit={send}>
        <input
          className="input"
          placeholder="Type a message to send..."
          value={outgoing}
          onChange={(e) => setOutgoing(e.target.value)}
          aria-label="Outgoing message"
          disabled={!isConnected}
        />
        <button className="btn" type="submit" disabled={!isConnected} aria-label="Send message">
          Send
        </button>
      </form>
    </section>
  );
};

export default ConnectionPanel;
