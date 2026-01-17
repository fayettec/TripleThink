/**
 * Application Entry Point
 * Initializes all components and starts router
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('TripleThink v4.1 - Initializing...');

  // Initialize components
  PowerDrawer.init();

  // Register routes
  Router.register('dashboard', DashboardScreen);
  Router.register('timeline', TimelineScreen);
  Router.register('epistemic', EpistemicScreen);
  Router.register('characters', CharactersScreen);
  Router.register('story-logic', StoryLogicScreen);
  Router.register('narrative', NarrativeScreen);
  Router.register('validation', ValidationScreen);

  // Start router
  Router.init();

  console.log('TripleThink v4.1 - Ready');
});
