
require('dotenv').config();
const { PROVIDERS, callProvider } = require('./lib');

const VARIATIONS = [
  'Explique le machine learning',
  'Explique-moi le machine learning',
  'Peux-tu m\'expliquer le machine learning ?',
  'C\'est quoi le machine learning ?',
  'Machine learning : définition et explication',
];

async function main() {
  const provider = PROVIDERS[0]; // Mistral, temperature 0.3 pour stabilité
  console.log(`\nSensibilité du prompt (${provider.name}, temperature 0.3)\n`);

  const results = await Promise.all(
    VARIATIONS.map(v => callProvider(provider, v, 0.3, 300))
  );

  const W1 = 32, W2 = 6, W3 = 8, W4 = 45;
  const header = `| ${'Formulation'.padEnd(W1)} | ${'Tokens'.padEnd(W2)} | ${'Longueur'.padEnd(W3)} | ${'Première phrase'.padEnd(W4)} |`;
  const sep    = `|${'-'.repeat(W1 + 2)}|${'-'.repeat(W2 + 2)}|${'-'.repeat(W3 + 2)}|${'-'.repeat(W4 + 2)}|`;

  console.log(header);
  console.log(sep);

  for (let i = 0; i < VARIATIONS.length; i++) {
    const r = results[i];
    const firstSentence = r.content
      ? r.content.split(/[.!?]/)[0].trim().slice(0, W4)
      : `[${r.error}]`;
    const length = r.content ? r.content.length : 0;
    console.log(
      `| ${('\"' + VARIATIONS[i] + '\"').padEnd(W1)} | ${String(r.tokens || 0).padEnd(W2)} | ${String(length).padEnd(W3)} | ${firstSentence.padEnd(W4)} |`
    );
  }

  console.log('\nObservation : la formulation impacte le ton et la longueur, pas le fond.');
}

main();
