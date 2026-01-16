// Test script for db/api-functions.js facade
// Verifies all 7 logic layer modules are accessible through unified interface

const Database = require('better-sqlite3');
const createAPI = require('./api-functions');

console.log('Testing db/api-functions.js facade...\n');

// Create in-memory database
const db = new Database(':memory:');

// Initialize facade
const api = createAPI(db);

// Test 1: Verify facade structure
console.log('Test 1: Verify facade has all 7 module properties');
const expectedModules = [
  'causalityChains',
  'characterArcs',
  'storyConflicts',
  'thematicElements',
  'motifInstances',
  'setupPayoffs',
  'worldRules'
];

const actualModules = Object.keys(api);
console.log('  Expected modules:', expectedModules);
console.log('  Actual modules:  ', actualModules);

if (actualModules.length !== 7) {
  throw new Error(`Expected 7 modules, got ${actualModules.length}`);
}

for (const moduleName of expectedModules) {
  if (!api.hasOwnProperty(moduleName)) {
    throw new Error(`Missing module: ${moduleName}`);
  }
  console.log(`  ✓ ${moduleName} exists`);
}

// Test 2: Verify causalityChains module has expected functions
console.log('\nTest 2: Verify causalityChains module functions');
const expectedCausalityFunctions = [
  'createChain',
  'getChainsByCause',
  'getChainsByEffect',
  'getChainById',
  'updateChain',
  'deleteChain',
  'traverseChain'
];

for (const funcName of expectedCausalityFunctions) {
  if (typeof api.causalityChains[funcName] !== 'function') {
    throw new Error(`causalityChains.${funcName} is not a function`);
  }
  console.log(`  ✓ causalityChains.${funcName} is a function`);
}

// Test 3: Verify characterArcs module has expected functions
console.log('\nTest 3: Verify characterArcs module functions');
const expectedArcFunctions = [
  'createArc',
  'getArcsByProject',
  'getArcByCharacter',
  'getArcById',
  'updateArc',
  'deleteArc',
  'advancePhase'
];

for (const funcName of expectedArcFunctions) {
  if (typeof api.characterArcs[funcName] !== 'function') {
    throw new Error(`characterArcs.${funcName} is not a function`);
  }
  console.log(`  ✓ characterArcs.${funcName} is a function`);
}

// Test 4: Verify storyConflicts module has expected functions
console.log('\nTest 4: Verify storyConflicts module functions');
const expectedConflictFunctions = [
  'createConflict',
  'getConflictsByProject',
  'getConflictsByProtagonist',
  'getConflictById',
  'updateConflict',
  'deleteConflict',
  'transitionConflictStatus'
];

for (const funcName of expectedConflictFunctions) {
  if (typeof api.storyConflicts[funcName] !== 'function') {
    throw new Error(`storyConflicts.${funcName} is not a function`);
  }
  console.log(`  ✓ storyConflicts.${funcName} is a function`);
}

// Test 5: Verify thematicElements module has expected functions
console.log('\nTest 5: Verify thematicElements module functions');
const expectedThemeFunctions = [
  'createTheme',
  'getThemesByProject',
  'getThemeById',
  'updateTheme',
  'deleteTheme',
  'addManifestation',
  'removeManifestation'
];

for (const funcName of expectedThemeFunctions) {
  if (typeof api.thematicElements[funcName] !== 'function') {
    throw new Error(`thematicElements.${funcName} is not a function`);
  }
  console.log(`  ✓ thematicElements.${funcName} is a function`);
}

// Test 6: Verify motifInstances module has expected functions
console.log('\nTest 6: Verify motifInstances module functions');
const expectedMotifFunctions = [
  'createMotifInstance',
  'getMotifInstancesByProject',
  'getMotifInstancesByType',
  'getMotifInstanceById',
  'updateMotifInstance',
  'deleteMotifInstance'
];

for (const funcName of expectedMotifFunctions) {
  if (typeof api.motifInstances[funcName] !== 'function') {
    throw new Error(`motifInstances.${funcName} is not a function`);
  }
  console.log(`  ✓ motifInstances.${funcName} is a function`);
}

// Test 7: Verify setupPayoffs module has expected functions
console.log('\nTest 7: Verify setupPayoffs module functions');
const expectedSetupFunctions = [
  'createSetupPayoff',
  'getSetupPayoffsByProject',
  'getSetupPayoffById',
  'updateSetupPayoff',
  'deleteSetupPayoff',
  'getUnfiredSetups',
  'fireSetup'
];

for (const funcName of expectedSetupFunctions) {
  if (typeof api.setupPayoffs[funcName] !== 'function') {
    throw new Error(`setupPayoffs.${funcName} is not a function`);
  }
  console.log(`  ✓ setupPayoffs.${funcName} is a function`);
}

// Test 8: Verify worldRules module has expected functions
console.log('\nTest 8: Verify worldRules module functions');
const expectedRuleFunctions = [
  'createWorldRule',
  'getWorldRulesByProject',
  'getWorldRulesByCategory',
  'getWorldRuleById',
  'updateWorldRule',
  'deleteWorldRule'
];

for (const funcName of expectedRuleFunctions) {
  if (typeof api.worldRules[funcName] !== 'function') {
    throw new Error(`worldRules.${funcName} is not a function`);
  }
  console.log(`  ✓ worldRules.${funcName} is a function`);
}

// Test 9: Verify modules are properly initialized (each module is an object with functions)
console.log('\nTest 9: Verify all modules are properly initialized objects');
for (const moduleName of expectedModules) {
  if (typeof api[moduleName] !== 'object') {
    throw new Error(`${moduleName} should be an object`);
  }
  if (api[moduleName] === null) {
    throw new Error(`${moduleName} should not be null`);
  }
  console.log(`  ✓ ${moduleName} is properly initialized`);
}

// Test 10: Verify facade can be called multiple times with different databases
console.log('\nTest 10: Verify facade factory can be called with different databases');
const db2 = new Database(':memory:');
const api2 = createAPI(db2);

if (api === api2) {
  throw new Error('Facade should return different instances for different calls');
}

if (Object.keys(api2).length !== 7) {
  throw new Error('Second facade instance should also have 7 modules');
}
console.log('  ✓ Facade factory returns independent instances');

// Success
console.log('\n✓ All facade modules loaded');
console.log('\nAll tests passed!');
process.exit(0);
