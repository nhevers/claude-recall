/**
 * Search Performance Benchmarks
 * 
 * Measures search performance across different query types and data sizes.
 * Run with: npx tsx benchmarks/search.bench.ts
 */

import { performance } from 'perf_hooks';

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  opsPerSec: number;
}

interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
}

async function benchmark(
  name: string,
  fn: () => Promise<void> | void,
  iterations: number = 100
): Promise<BenchmarkResult> {
  const times: number[] = [];
  
  // Warmup
  for (let i = 0; i < 10; i++) {
    await fn();
  }
  
  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  const totalMs = times.reduce((a, b) => a + b, 0);
  const avgMs = totalMs / iterations;
  const minMs = Math.min(...times);
  const maxMs = Math.max(...times);
  const opsPerSec = 1000 / avgMs;
  
  return {
    name,
    iterations,
    totalMs,
    avgMs,
    minMs,
    maxMs,
    opsPerSec,
  };
}

function formatResult(result: BenchmarkResult): string {
  return [
    `  ${result.name}`,
    `    avg: ${result.avgMs.toFixed(3)}ms`,
    `    min: ${result.minMs.toFixed(3)}ms`,
    `    max: ${result.maxMs.toFixed(3)}ms`,
    `    ops/sec: ${result.opsPerSec.toFixed(2)}`,
  ].join('\n');
}

// Mock data generators
function generateObservations(count: number) {
  const types = ['discovery', 'decision', 'implementation', 'issue', 'learning'];
  const concepts = ['api', 'database', 'auth', 'ui', 'testing', 'performance', 'security'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    type: types[i % types.length],
    title: `Observation ${i + 1}: ${concepts[i % concepts.length]} related work`,
    narrative: `This is a detailed narrative about ${concepts[i % concepts.length]} implementation...`,
    concepts: concepts.slice(0, (i % 3) + 1),
    created_at: new Date(Date.now() - i * 3600000).toISOString(),
  }));
}

// Search implementations to benchmark
function linearSearch(observations: any[], query: string): any[] {
  const lowerQuery = query.toLowerCase();
  return observations.filter(obs => 
    obs.title.toLowerCase().includes(lowerQuery) ||
    obs.narrative.toLowerCase().includes(lowerQuery)
  );
}

function indexedSearch(index: Map<string, Set<number>>, observations: any[], query: string): any[] {
  const terms = query.toLowerCase().split(/\s+/);
  const matchingIds = new Set<number>();
  
  for (const term of terms) {
    const ids = index.get(term);
    if (ids) {
      for (const id of ids) {
        matchingIds.add(id);
      }
    }
  }
  
  return observations.filter(obs => matchingIds.has(obs.id));
}

function buildIndex(observations: any[]): Map<string, Set<number>> {
  const index = new Map<string, Set<number>>();
  
  for (const obs of observations) {
    const terms = `${obs.title} ${obs.narrative}`.toLowerCase().split(/\s+/);
    for (const term of terms) {
      if (!index.has(term)) {
        index.set(term, new Set());
      }
      index.get(term)!.add(obs.id);
    }
  }
  
  return index;
}

async function runSearchBenchmarks(): Promise<BenchmarkSuite> {
  const results: BenchmarkResult[] = [];
  
  // Test different data sizes
  const sizes = [100, 1000, 10000];
  
  for (const size of sizes) {
    const observations = generateObservations(size);
    const index = buildIndex(observations);
    
    // Linear search
    results.push(await benchmark(
      `Linear search (${size} items)`,
      () => linearSearch(observations, 'database'),
      50
    ));
    
    // Indexed search
    results.push(await benchmark(
      `Indexed search (${size} items)`,
      () => indexedSearch(index, observations, 'database'),
      50
    ));
  }
  
  return { name: 'Search Performance', results };
}

async function runFilterBenchmarks(): Promise<BenchmarkSuite> {
  const results: BenchmarkResult[] = [];
  const observations = generateObservations(5000);
  
  // Filter by type
  results.push(await benchmark(
    'Filter by type',
    () => observations.filter(o => o.type === 'discovery'),
    100
  ));
  
  // Filter by date range
  const weekAgo = Date.now() - 7 * 24 * 3600000;
  results.push(await benchmark(
    'Filter by date range',
    () => observations.filter(o => new Date(o.created_at).getTime() > weekAgo),
    100
  ));
  
  // Filter by concept
  results.push(await benchmark(
    'Filter by concept',
    () => observations.filter(o => o.concepts.includes('api')),
    100
  ));
  
  // Combined filters
  results.push(await benchmark(
    'Combined filters',
    () => observations.filter(o => 
      o.type === 'discovery' && 
      o.concepts.includes('api') &&
      new Date(o.created_at).getTime() > weekAgo
    ),
    100
  ));
  
  return { name: 'Filter Performance', results };
}

async function main() {
  console.log('claude-recall Search Benchmarks\n');
  console.log('='.repeat(50));
  
  const suites = [
    await runSearchBenchmarks(),
    await runFilterBenchmarks(),
  ];
  
  for (const suite of suites) {
    console.log(`\n${suite.name}`);
    console.log('-'.repeat(40));
    for (const result of suite.results) {
      console.log(formatResult(result));
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('Benchmarks complete');
}

main().catch(console.error);
