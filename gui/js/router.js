/**
 * Client-side Router
 * Hash-based routing for screen navigation
 */

const Router = {
  routes: new Map(),
  currentRoute: null,

  register(path, screen) {
    // path: string like 'timeline', 'epistemic', 'characters', 'story-logic'
    // screen: object with render() method
    this.routes.set(path, screen);
  },

  init() {
    // Set up hash change listener
    window.addEventListener('hashchange', () => {
      this.navigate(window.location.hash.slice(1) || 'dashboard');
    });

    // Navigate to initial route
    const initialRoute = window.location.hash.slice(1) || 'dashboard';
    this.navigate(initialRoute);
  },

  navigate(path) {
    const screen = this.routes.get(path);
    if (!screen) {
      console.error(`Route not found: ${path}`);
      return;
    }

    this.currentRoute = path;

    // Clear current content
    const app = document.getElementById('app');
    app.innerHTML = '';

    // Render new screen
    screen.render();

    // Update navigation active state
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.route === path);
    });
  }
};

// For Node.js environments (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Router };
}
