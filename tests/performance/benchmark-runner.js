// Unified Performance Benchmark Runner
// Executes all performance benchmarks and generates comprehensive report

const fs = require('fs');
const path = require('path');

const benchmarkStateReconstruction = require('./state-reconstruction.bench');
const benchmarkOrchestrator = require('./orchestrator.bench');
const benchmarkValidation = require('./validation.bench');

/**
 * Format duration for display
 */
function formatDuration(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Print benchmark results to console
 */
function printResults(results) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`  ${results.category}`);
  console.log(`  Target: <${formatDuration(results.target_ms)}`);
  console.log(`${'='.repeat(80)}\n`);

  for (const result of results.results) {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const duration = formatDuration(result.avg_duration_ms || result.duration_ms);
    const target = formatDuration(result.target_ms || results.target_ms);

    console.log(`  ${status}  ${result.scenario}`);
    console.log(`         Duration: ${duration} (target: <${target})`);

    if (result.iterations) {
      console.log(`         Iterations: ${result.iterations}`);
    }

    if (result.warning) {
      console.log(`         ⚠ ${result.warning}`);
    }

    if (result.details) {
      const detailKeys = Object.keys(result.details).filter(k =>
        !k.includes('_') && typeof result.details[k] !== 'object'
      );
      if (detailKeys.length > 0) {
        const detailStr = detailKeys
          .map(k => `${k}: ${result.details[k]}`)
          .join(', ');
        console.log(`         Details: ${detailStr}`);
      }
    }

    console.log('');
  }
}

/**
 * Calculate summary statistics
 */
function calculateSummary(allResults) {
  const summary = {
    all_targets_met: true,
    total_operations: allResults.length,
    passed: 0,
    failed: 0,
    total_duration_ms: 0
  };

  for (const results of allResults) {
    if (results.all_passed) {
      summary.passed++;
    } else {
      summary.failed++;
      summary.all_targets_met = false;
    }

    // Sum up duration from first result in each category
    if (results.results.length > 0) {
      summary.total_duration_ms +=
        results.results[0].avg_duration_ms || results.results[0].duration_ms || 0;
    }
  }

  return summary;
}

/**
 * Run all benchmarks
 */
async function runAllBenchmarks() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                 TripleThink v4.1 Performance Benchmarks                      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  const startTime = Date.now();
  const allResults = [];

  // Run state reconstruction benchmarks
  console.log('📊 Running State Reconstruction Benchmarks...');
  const stateResults = await benchmarkStateReconstruction();
  allResults.push(stateResults);
  printResults(stateResults);

  // Run orchestrator benchmarks
  console.log('📊 Running Orchestrator Context Assembly Benchmarks...');
  const orchResults = await benchmarkOrchestrator();
  allResults.push(orchResults);
  printResults(orchResults);

  // Run validation benchmarks
  console.log('📊 Running Validation Performance Benchmarks...');
  const validResults = await benchmarkValidation();
  allResults.push(validResults);
  printResults(validResults);

  const totalDuration = Date.now() - startTime;

  // Calculate summary
  const summary = calculateSummary(allResults);

  // Build report
  const report = {
    timestamp: new Date().toISOString(),
    title: 'TripleThink v4.1 Performance Benchmarks',
    summary: {
      ...summary,
      benchmark_duration_ms: totalDuration
    },
    performance_targets: {
      state_reconstruction_ms: 100,
      orchestrator_operation_ms: 1000,
      full_validation_ms: 30000
    },
    results: allResults
  };

  // Write report to file
  const reportPath = path.join(__dirname, '../../performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log(`${'='.repeat(80)}`);
  console.log('  SUMMARY');
  console.log(`${'='.repeat(80)}\n`);
  console.log(`  Total operations: ${summary.total_operations}`);
  console.log(`  Passed: ${summary.passed}`);
  console.log(`  Failed: ${summary.failed}`);
  console.log(`  Benchmark duration: ${formatDuration(totalDuration)}`);
  console.log('');
  console.log(`  Report written to: ${reportPath}`);
  console.log('');

  if (summary.all_targets_met) {
    console.log('  ✓ All performance targets met!');
    console.log('');
    return 0;
  } else {
    console.log('  ✗ Some performance targets not met!');
    console.log('');
    return 1;
  }
}

// Run benchmarks if executed directly
if (require.main === module) {
  runAllBenchmarks()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(err => {
      console.error('\n❌ Benchmark error:', err);
      process.exit(1);
    });
}

module.exports = runAllBenchmarks;
