import React from 'react';

/**
 * Manages WebSocket connection, status, messages, and logs.
 * Includes safe cleanup and reconnection guard.
 * @param {string} defaultUrl
 */
const useWebSocketManager = (defaultUrl = '') => {
  const [url, setUrl] = React.useState(defaultUrl);
  const [status, setStatus] = React.useState('disconnected'); // 'disconnected' | 'connecting' | 'connected'
  const [logs, setLogs] = React.useState([]);
  const [messages, setMessages] = React.useState([]);
  const socketRef = React.useRef(null);

  const log = (level, message) => {
    setLogs(prev => [
      ...prev,
      { level, message, timestamp: new Date().toLocaleTimeString() }
    ]);
  };

  const connect = (targetUrl) => {
    const finalUrl = targetUrl || url;
    if (!finalUrl) {
      log('warn', 'Please provide a WebSocket URL.');
      return;
    }
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      log('warn', 'Already connected or connecting.');
      return;
    }
    setStatus('connecting');
    try {
      const ws = new WebSocket(finalUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        log('info', `Connected to ${finalUrl}`);
      };
      ws.onmessage = (evt) => {
        setMessages(prev => [
          ...prev,
          { direction: 'in', text: evt.data, timestamp: new Date().toLocaleTimeString() }
        ]);
      };
      ws.onerror = (err) => {
        log('error', `WebSocket error: ${err?.message || 'Unknown error'}`);
      };
      ws.onclose = (evt) => {
        setStatus('disconnected');
        log('warn', `Disconnected (${evt.code}${evt.reason ? `: ${evt.reason}` : ''})`);
      };
    } catch (e) {
      setStatus('disconnected');
      log('error', `Failed to connect: ${e.message}`);
    }
  };

  const disconnect = () => {
    const ws = socketRef.current;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close(1000, 'Client disconnect');
    } else {
      log('warn', 'Not connected.');
    }
  };

  const sendMessage = (text) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(text);
      setMessages(prev => [
        ...prev,
        { direction: 'out', text, timestamp: new Date().toLocaleTimeString() }
      ]);
    } else {
      log('warn', 'Cannot send: not connected.');
    }
  };

  const clearLogs = () => setLogs([]);
  const clearMessages = () => setMessages([]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
        socketRef.current.close(1000, 'App unmount');
      }
    };
  }, []);

  return {
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
  };
};

export default useWebSocketManager;
