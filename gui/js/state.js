/**
 * Simple State Management
 * Reactive state with change listeners
 */

class State {
  constructor(initialState = {}) {
    this._state = initialState;
    this._listeners = new Map();
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    const oldValue = this._state[key];
    this._state[key] = value;

    // Notify listeners
    if (this._listeners.has(key)) {
      this._listeners.get(key).forEach(callback => {
        callback(value, oldValue);
      });
    }
  }

  update(updates) {
    Object.keys(updates).forEach(key => {
      this.set(key, updates[key]);
    });
  }

  subscribe(key, callback) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, []);
    }
    this._listeners.get(key).push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this._listeners.get(key);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  getAll() {
    return { ...this._state };
  }
}

// Global state
const state = new State({
  currentRoute: 'dashboard',
  selectedEntity: null,
  entities: [],
  loading: false,
  project: null,
});
