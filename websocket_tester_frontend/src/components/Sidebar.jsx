import React from 'react';

/**
 * Sidebar lists saved endpoints and allows save/delete/select.
 * @param {{endpoints: Array, onSelect: Function, onSave: Function, onDelete: Function}} props
 */
const Sidebar = ({ endpoints, onSelect, onSave, onDelete }) => {
  const [label, setLabel] = React.useState('');
  const [url, setUrl] = React.useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!label.trim() || !url.trim()) return;
    onSave(label.trim(), url.trim());
    setLabel('');
    setUrl('');
  };

  return (
    <aside className="sidebar" aria-label="Saved endpoints">
      <div className="sidebar-header">
        <span>Saved Endpoints</span>
      </div>
      <div className="sidebar-list">
        {endpoints.length === 0 && (
          <div className="endpoint-item" style={{ color: '#6b7280' }}>
            No endpoints saved yet.
          </div>
        )}
        {endpoints.map(ep => (
          <div key={ep.id} className="endpoint-item">
            <div className="endpoint-title">{ep.label}</div>
            <div className="endpoint-url">{ep.url}</div>
            <div className="endpoint-actions">
              <button className="btn btn-accent" onClick={() => onSelect(ep)} aria-label={`Use ${ep.label}`}>
                Use
              </button>
              <button className="btn btn-danger" onClick={() => onDelete(ep.id)} aria-label={`Delete ${ep.label}`}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <form className="sidebar-form" onSubmit={submit}>
        <input
          className="input"
          placeholder="Label e.g. Echo Server"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          aria-label="Endpoint label"
        />
        <input
          className="input"
          placeholder="wss://echo.websocket.events"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label="Endpoint URL"
        />
        <button type="submit" className="btn btn-primary">Save Endpoint</button>
      </form>
    </aside>
  );
};

export default Sidebar;
