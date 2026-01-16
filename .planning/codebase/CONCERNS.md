# Codebase Concerns

**Analysis Date:** 2026-01-16

## Tech Debt

**GUI API Base URL Detection:**
- Issue: API_BASE URL uses runtime port detection which can fail in different deployment scenarios (proxy, Docker networking, cloud hosting)
- Files: `/app/gui/js/api-client.js:7-15`
- Impact: API calls will fail if GUI is served from different port than expected (e.g., reverse proxy, production CDN)
- Fix approach: Use environment variable injection or config file instead of runtime detection

**SQLite Library Inconsistency:**
- Issue: Codebase mixes `better-sqlite3` (synchronous) and `sqlite3` (async callback-based) for different modules
- Files: `/app/db/init-database.js:10` uses `better-sqlite3`, `/app/api/services/validator.js:15` uses `sqlite3`
- Impact: Inconsistent error handling patterns, potential performance differences, maintenance complexity
- Fix approach: Standardize on `better-sqlite3` throughout (already declared in package.json)

**Missing formatDate Alias:**
- Issue: Code calls `formatters.formatDate()` in 6 locations but function was missing (documented in GUI-FIXES-PLAN.md)
- Files: `/app/gui/js/screens/epistemic.js:132`, `/app/gui/js/components/event-mapper.js:122`, `/app/gui/js/components/timeline-viz.js:204`, `/app/gui/js/utils/timeline-slider.js:47,97,98`
- Impact: JavaScript errors break Epistemic Graph, Timeline Visualization, and Timeline Slider functionality
- Fix approach: Already documented in GUI-FIXES-PLAN.md Phase 1.1 - add formatDate alias to formatters.js

**Hardcoded Port Configuration:**
- Issue: API server defaults to port 3000 with no graceful handling of port conflicts
- Files: `/app/api/server.js:44`
- Impact: Server crashes if port 3000 is already in use instead of attempting alternate port
- Fix approach: Add port conflict detection and retry logic, or clearer error messaging

**Large Route Files:**
- Issue: Some route files exceed 900 lines with mixed concerns
- Files: `/app/api/routes/validation.js:904`, `/app/api/routes/ai.js:668`, `/app/api/routes/narrative.js:652`
- Impact: Difficult to navigate, test, and maintain; violates single responsibility principle
- Fix approach: Split into smaller route modules by subdomain (e.g., validation.js → validation-rules.js, validation-reports.js, validation-health.js)

**Project Management UI Missing:**
- Issue: Projects screen shows hardcoded placeholder data instead of functional CRUD
- Files: `/app/gui/js/screens/projects.js:12-31`
- Impact: Users cannot create or manage projects, blocking core workflow
- Fix approach: Complete implementation documented in GUI-FIXES-PLAN.md Phase 3.2

**Event Editor Missing Handlers:**
- Issue: Add Phase/Fact/Participant buttons in event editor have no event listeners
- Files: `/app/gui/js/components/entity-editor.js`
- Impact: Cannot add phases, facts, or participants when creating events
- Fix approach: Wire up button handlers as documented in GUI-FIXES-PLAN.md Phase 2.3

**Timeline Filter Passing:**
- Issue: Filters not passed from Timeline screen to TimelineView component when switching to List mode
- Files: `/app/gui/js/screens/timeline.js:133`, `/app/gui/js/components/timeline-view.js`
- Impact: List view ignores active filters, showing all events instead of filtered subset
- Fix approach: Pass filters parameter to TimelineView.render() as documented in GUI-FIXES-PLAN.md Phase 2.4

## Known Bugs

**Validator Stats Typo:**
- Symptoms: Validator stats object has `errorsFount` instead of `errorsFound`
- Files: `/app/api/services/validator.js:27,64`
- Trigger: Any validation run will track errors under wrong property name
- Workaround: None - cosmetic typo but affects API response structure

**Knowledge Modal Close Button:**
- Symptoms: X button on knowledge modal does nothing
- Files: `/app/gui/js/components/knowledge-editor.js`
- Trigger: Opening Epistemic Graph, selecting character, clicking X button
- Workaround: Refresh page or navigate away

**Search Button Unwired:**
- Symptoms: Header search button has no click handler
- Files: `/app/gui/js/app.js`
- Trigger: Clicking "Search" button in header
- Workaround: Use keyboard shortcut (Ctrl+K) instead

**Scene Metadata Button Wrong Function:**
- Symptoms: Scene editor metadata button calls `MetadataModal.show()` but function is `showMetadataModal()`
- Files: `/app/gui/js/components/scene-editor.js:196`
- Trigger: Opening scene, clicking "Edit Metadata" button on Metadata tab
- Workaround: None

**Characters/Fictions Routes Show All Entities:**
- Symptoms: Navigating to /characters or /fictions shows all entity types instead of filtering
- Files: `/app/gui/js/screens/entities.js:145-146`
- Trigger: Clicking "Characters" or "Fictions" in navigation
- Workaround: Manually select filter after page loads

## Security Considerations

**CORS Wide Open:**
- Risk: CORS configured with `origin: '*'` allowing any domain to access API
- Files: `/app/api/server.js:47`
- Current mitigation: None in default configuration
- Recommendations: Configure whitelist of allowed origins for production, use environment variable for CORS_ORIGIN

**No Input Sanitization:**
- Risk: API accepts arbitrary JSON in POST/PUT requests without input sanitization
- Files: All `/app/api/routes/*.js` files
- Current mitigation: Helmet middleware provides basic headers, but no input validation
- Recommendations: Add JSON schema validation for all request bodies, implement input sanitization middleware

**Authentication Disabled by Default:**
- Risk: API authentication requires explicit opt-in via environment variable
- Files: `/app/api/middleware/auth.js:18`
- Current mitigation: Rate limiting provides some abuse protection
- Recommendations: Enable authentication by default, require explicit opt-out for development

**Stack Traces Exposed in Non-Production:**
- Risk: Full error stack traces returned to client when NODE_ENV != 'production'
- Files: `/app/api/error-handling.js:263,324`
- Current mitigation: Only affects development environments
- Recommendations: Acceptable for development, ensure NODE_ENV=production in deployment

**API Key in Environment Variable:**
- Risk: API key stored in plain text environment variable
- Files: `/app/api/middleware/auth.js:21`
- Current mitigation: Environment variable not committed to git
- Recommendations: Use secrets manager (AWS Secrets Manager, Azure Key Vault) for production deployments

**No Request Size Limits Beyond JSON:**
- Risk: JSON body limited to 10mb but no overall request size limit
- Files: `/app/api/server.js:84`
- Current mitigation: Express body parser has size limit
- Recommendations: Add overall request timeout and size limits at middleware level

## Performance Bottlenecks

**Validation Full Scan:**
- Problem: Full validation (`POST /api/validate/run-all`) scans entire database with 100+ rules
- Files: `/app/api/services/validator.js`, `/app/api/routes/validation.js`
- Cause: Linear scan through all entities, relationships, states with complex joins
- Improvement path: Implement incremental validation (track dirty entities), parallelize rule execution, add validation result caching with TTL

**Temporal Query Recursion:**
- Problem: Causal chain traversal uses unbounded recursion with visited set
- Files: `/app/api/routes/temporal.js:309,332`
- Cause: Deep causal chains (>50 events) cause stack growth
- Improvement path: Convert to iterative breadth-first search with queue, add depth limit configuration

**Large Route File Load Time:**
- Problem: Route modules >600 lines take longer to parse on server startup
- Files: `/app/api/routes/validation.js:904`, `/app/api/routes/ai.js:668`
- Cause: Monolithic route files with multiple endpoint handlers
- Improvement path: Split into smaller modules, lazy-load routes on first access

**No Query Result Caching:**
- Problem: Identical epistemic/temporal queries re-execute full database scan
- Files: All `/app/api/routes/*.js` query endpoints
- Cause: Cache middleware exists (`/app/api/middleware/cache.js`) but not applied to all endpoints
- Improvement path: Apply caching middleware to read-only endpoints, tune TTL per endpoint type (temporal: 1min, epistemic: 30sec)

## Fragile Areas

**Database Migration Script:**
- Files: `/app/db/init-database.js`
- Why fragile: Continues on error (line 50), splits SQL by semicolon which fails with complex statements
- Safe modification: Always test migrations on backup database, add transaction support for rollback
- Test coverage: No automated tests for migration script

**Validator Database Initialization:**
- Files: `/app/api/services/validator.js:33-40`
- Why fragile: Uses callback-based sqlite3 with promise wrapper, potential race conditions
- Safe modification: Convert to better-sqlite3 synchronous API
- Test coverage: 40+ tests in `/app/tests/validator.test.js` but no init failure tests

**API Client URL Construction:**
- Files: `/app/gui/js/api-client.js:7-15,23`
- Why fragile: Runtime port detection breaks with proxies, load balancers, Docker port mapping
- Safe modification: Add configuration fallback, test across deployment scenarios
- Test coverage: No automated tests for API client

**State Reconstruction Logic:**
- Files: Referenced in hybrid state architecture, not yet implemented
- Why fragile: Binary search for nearest snapshot + delta application is complex, off-by-one errors likely
- Safe modification: Comprehensive unit tests for edge cases (no snapshots, single delta, 50+ deltas)
- Test coverage: Planned but not yet implemented

**Event Editor Form Collection:**
- Files: `/app/gui/js/components/entity-editor.js`
- Why fragile: Dynamically generates form rows, collects data via indexed names (phase_0_name, phase_1_name)
- Safe modification: Add form validation before submit, handle missing indices gracefully
- Test coverage: No automated GUI tests

## Scaling Limits

**SQLite Concurrent Writes:**
- Current capacity: 1 writer at a time (SQLite limitation)
- Limit: ~10 concurrent users with frequent writes
- Scaling path: Migrate to PostgreSQL for multi-user scenarios, implement write queue, or shard by project

**Full Validation Duration:**
- Current capacity: 8.4 seconds for 2,847 entities (per Phase 6 report)
- Limit: Linear scaling means 28,470 entities = 84 seconds (unacceptable)
- Scaling path: Parallelize validation rules, implement incremental validation, add background job queue

**In-Memory Cache Size:**
- Current capacity: LRU caches configured for 50-200 items per type
- Limit: ~10MB heap for all caches combined (may cause memory pressure with large projects)
- Scaling path: Implement Redis for distributed caching, tune cache sizes per deployment

**Timeline Visualization Rendering:**
- Current capacity: Unknown (no large dataset tests)
- Limit: D3.js timeline likely struggles with >1000 events on client side
- Scaling path: Implement virtualized rendering, server-side aggregation, progressive loading

## Dependencies at Risk

**better-sqlite3 Native Compilation:**
- Risk: Requires C++ compiler and Python for installation, fails on some platforms
- Impact: Server won't start if better-sqlite3 fails to compile during npm install
- Migration plan: Add pre-built binaries for common platforms, or migrate to pure JavaScript SQLite (sql.js) with performance tradeoff

**Express.js Framework:**
- Risk: Express is in maintenance mode, community moving to Fastify/Hono
- Impact: No new features, potential security vulnerabilities in dependencies
- Migration plan: Evaluate migration to Fastify (drop-in replacement for most routes) when Express reaches EOL

**D3.js for Visualization:**
- Risk: D3 v7 is current but has steep learning curve, limited bundle size optimization
- Impact: Large client-side bundle (~250KB), difficult to maintain custom visualizations
- Migration plan: Evaluate lightweight alternatives (Chart.js, Apache ECharts) or server-side rendering

**Node.js 18+ Requirement:**
- Risk: Package.json requires Node >=18.0.0, but no version ceiling
- Impact: Future Node.js breaking changes may break dependencies
- Migration plan: Add upper bound (node: ">=18.0.0 <23.0.0"), test on Node 20/22 LTS

## Missing Critical Features

**No Authentication Implementation:**
- Problem: Auth middleware exists but requires manual configuration
- Blocks: Multi-user deployments, cloud hosting, team collaboration
- Priority: High for any deployment beyond single-user local

**No Real-time Collaboration:**
- Problem: No WebSocket support for concurrent editing
- Blocks: Team writing workflows, simultaneous editing
- Priority: Medium - would enable collaborative storytelling

**No Data Export to Standard Formats:**
- Problem: Export exists but no EPUB/DOCX/FDX (Final Draft) output
- Blocks: Integration with publishing workflows
- Priority: Medium - workaround is manual copy/paste

**No Version Control Integration:**
- Problem: No git-like branching/merging for narrative timelines
- Blocks: Professional revision workflows with rollback
- Priority: Low - timeline branching provides partial solution

**No Mobile Interface:**
- Problem: GUI not responsive, unusable on mobile devices
- Blocks: Writing on-the-go, reference checking on mobile
- Priority: Low - desktop-first design is acceptable for v1

## Test Coverage Gaps

**GUI Components Untested:**
- What's not tested: All `/app/gui/js/components/*.js` and `/app/gui/js/screens/*.js` files
- Files: 25+ JavaScript files with zero automated tests
- Risk: Breaking changes to GUI go undetected until manual testing
- Priority: High

**API Route Integration Tests Incomplete:**
- What's not tested: Logic layer routes, narrative routes, search routes
- Files: `/app/api/routes/logic-layer.js`, `/app/api/routes/narrative.js`, `/app/api/routes/search.js`
- Risk: Endpoint regressions, breaking API contracts
- Priority: High

**Database Migration Rollback:**
- What's not tested: Migration failure recovery, rollback procedures
- Files: `/app/db/init-database.js`, `/app/db/migrations/*.sql`
- Risk: Failed migrations leave database in inconsistent state
- Priority: Medium

**Error Handling Paths:**
- What's not tested: Error middleware, 404 handlers, malformed request handling
- Files: `/app/api/error-handling.js`
- Risk: Unhandled edge cases cause server crashes
- Priority: Medium

**Performance Regression:**
- What's not tested: No continuous performance benchmarking
- Files: `/app/tests/benchmark.js` exists but not in CI pipeline
- Risk: Performance degradation goes unnoticed until production
- Priority: Medium

**Cross-Browser Compatibility:**
- What's not tested: GUI only tested in Chrome/Edge
- Files: All GUI files
- Risk: May break in Firefox, Safari, mobile browsers
- Priority: Low

**Large Dataset Handling:**
- What's not tested: No tests with >10,000 entities
- Files: All query endpoints and GUI components
- Risk: Pagination breaks, queries timeout, UI freezes
- Priority: Medium

---

*Concerns audit: 2026-01-16*
