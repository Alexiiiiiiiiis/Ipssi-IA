
require('dotenv').config();
const { PROVIDERS, callProvider } = require('./lib');

function calcP95(latencies) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, idx)];
}

async function stressTest(provider, n = 10) {
  const prompt = 'Réponds juste "ok".';
  const tasks = Array.from({ length: n }, () =>
    callProvider(provider, prompt, 0, 5)
  );

  const settled = await Promise.allSettled(tasks);
  const results = settled.map(s => (s.status === 'fulfilled' ? s.value : { error: s.reason?.message }));

  const successes = results.filter(r => r.content !== null && !r.error);
  const failures  = results.filter(r => r.content === null || r.error);
  const latencies = successes.map(r => r.latency).filter(Boolean);

  const avgLatency = latencies.length
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0;
  const p95 = latencies.length ? calcP95(latencies) : 0;
  const errors = [...new Set(failures.map(r => r.error).filter(Boolean))];

  return {
    provider: provider.name,
    n,
    success: successes.length,
    failed: failures.length,
    avgLatency,
    p95,
    errors,
  };
}

function displayStress(r) {
  const icon = r.failed === 0 ? '✅' : r.success > r.failed ? '⚠️ ' : '❌';
  const errStr = r.errors.length ? ` (${r.errors.slice(0, 2).join(', ')})` : '';
  console.log(
    `${r.provider.padEnd(14)}: ${r.success}/${r.n} ${icon}  avg ${r.avgLatency}ms  p95 ${r.p95}ms${errStr}`
  );
}

async function main() {
  for (const n of [5, 10]) {
    console.log(`\nStress test : ${n} requêtes parallèles\n`);
    const results = await Promise.all(PROVIDERS.map(p => stressTest(p, n)));
    results.forEach(displayStress);
  }
}

main();
