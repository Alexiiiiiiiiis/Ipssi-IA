require('dotenv').config();
const { callProvider, PROVIDERS } = require('./lib');

const monPrompt = "tu penses quoi du gold sur les marchés financiers ?";

async function main() {
  const results = await Promise.all(
    PROVIDERS.map(p => callProvider(p, monPrompt, 0.7, 200))
  );

  for (const result of results) {
    console.log(`\n── ${result.provider} ──`);
    console.log(result.content);
    console.log(`Latence : ${result.latency}ms — Tokens : ${result.tokens}`);
  }
}

main();
