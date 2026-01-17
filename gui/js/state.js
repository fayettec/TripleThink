/**
 * State Management with Pub/Sub Pattern
 * Centralized state for TripleThink GUI with reactive updates
 */

class State {
  constructor() {
    this.data = {
      // Project context
      currentProjectId: null,
      currentTimestamp: null,
      selectedCharacter: null,

      // View configuration
      viewMode: 'world-truth', // 'world-truth' | 'character-view' | 'reader-view'
      powerDrawerOpen: false,
      causalityDepth: 3,
      activeTab: null,
      characterTab: 'list', // 'list' | 'relationships'

      // Future: add more fields as needed by Phases 9-12
    };

    this.subscribers = new Map(); // key: string, value: Set<function>
  }

  get(key) {
    return this.data[key];
  }

  getAll() {
    return { ...this.data }; // Return copy to prevent mutation
  }

  update(changes) {
    // changes: object with key-value pairs to update
    // Example: state.update({ viewMode: 'character-view', selectedCharacter: 'char-alice' })

    const changedKeys = [];
    for (const [key, value] of Object.entries(changes)) {
      if (this.data[key] !== value) {
        this.data[key] = value;
        changedKeys.push(key);
      }
    }

    // Notify subscribers for changed keys
    changedKeys.forEach(key => this.notify(key));
  }

  subscribe(key, callback) {
    // Subscribe to changes for specific key
    // Returns unsubscribe function
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    return () => {
      this.subscribers.get(key).delete(callback);
    };
  }

  notify(key) {
    // Notify all subscribers for this key
    if (this.subscribers.has(key)) {
      const value = this.data[key];
      this.subscribers.get(key).forEach(callback => callback(value));
    }
  }
}

// Export singleton
const state = new State();

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { state };
}
