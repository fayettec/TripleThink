/**
 * Simple Client-Side Router
 * Handles navigation without page reloads
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;

    window.addEventListener('hashchange', () => this.handleRouteChange());
    window.addEventListener('load', () => this.handleRouteChange());
  }

  register(path, handler) {
    this.routes.set(path, handler);
  }

  navigate(path) {
    window.location.hash = path;
  }

  handleRouteChange() {
    const hash = window.location.hash.slice(1) || 'landing'; // Changed from 'dashboard'
    const route = hash.split('/')[0];

    if (this.routes.has(route)) {
      this.currentRoute = route;
      state.set('currentRoute', route);

      // Update navigation
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.route === route) {
          item.classList.add('active');
        }
      });

      // Call route handler
      this.routes.get(route)();
    } else {
      console.warn(`Route not found: ${route}`);
      this.navigate('landing'); // Changed from 'dashboard'
    }
  }
}

const router = new Router();
