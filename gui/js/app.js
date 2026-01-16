/**
 * Application Entry Point
 * Initializes all components and starts router
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('TripleThink v4.1 - Initializing...');

  // Initialize components
  PowerDrawer.init();

  // Register routes
  Router.register('timeline', TimelineScreen);
  Router.register('epistemic', EpistemicScreen);
  Router.register('characters', CharactersScreen);

  // Start router
  Router.init();

  console.log('TripleThink v4.1 - Ready');
});
