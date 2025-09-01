const KEY = 'ws_tester_endpoints_v1';

const uuid = () =>
  Math.random().toString(36).slice(2, 10) +
  Math.random().toString(36).slice(2, 6);

// PUBLIC_INTERFACE
export function getSavedEndpoints() {
  /** Returns a list of saved endpoints from localStorage. */
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    return [];
  }
}

// PUBLIC_INTERFACE
export function saveEndpoint({ label, url }) {
  /** Saves an endpoint and returns the updated list. */
  const current = getSavedEndpoints();
  const item = { id: uuid(), label, url };
  const updated = [item, ...current].slice(0, 100); // cap list size
  localStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}

// PUBLIC_INTERFACE
export function deleteEndpoint(id) {
  /** Deletes an endpoint by id and returns the updated list. */
  const current = getSavedEndpoints();
  const updated = current.filter(e => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}
