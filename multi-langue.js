require('dotenv').config();
const { PROVIDERS, callProvider, estimateTokens } = require('./lib');

const PRICE_PER_M = 0.20; // Mistral Small €/1M tokens

const QUESTIONS = [
  { lang: 'Français', text: 'Explique ce qu\'est le machine learning en deux phrases.' },
  { lang: 'English',  text: 'Explain what machine learning is in two sentences.' },
  { lang: 'Español',  text: 'Explica qué es el machine learning en dos frases.' },
];

async function main() {
  const provider = PROVIDERS[0]; // Mistral
  console.log(`\nMulti-langue (${provider.name}, même question)\n`);

  const results = await Promise.all(
    QUESTIONS.map(q => callProvider(provider, q.text, 0.3, 150))
  );

  const W = 10;
  console.log(
    `| ${'Langue'.padEnd(W)} | ${'Tokens input'.padEnd(13)} | ${'Tokens output'.padEnd(14)} | ${'Coût estimé'.padEnd(13)} |`
  );
  console.log(`|${'-'.repeat(W + 2)}|${'-'.repeat(15)}|${'-'.repeat(16)}|${'-'.repeat(15)}|`);

  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    const r = results[i];
    const inputTokens  = estimateTokens(q.text);
    const outputTokens = r.tokens || 0;
    const cost = ((inputTokens + outputTokens) / 1_000_000 * PRICE_PER_M).toFixed(7) + '€';

    console.log(
      `| ${q.lang.padEnd(W)} | ${String(inputTokens).padEnd(13)} | ${String(outputTokens).padEnd(14)} | ${cost.padEnd(13)} |`
    );
  }

  // Calcul surcoût FR vs EN
  const frTokens = estimateTokens(QUESTIONS[0].text);
  const enTokens = estimateTokens(QUESTIONS[1].text);
  const surcoût = Math.round((frTokens / enTokens - 1) * 100);
  console.log(`\nFR consomme ~${surcoût}% de tokens en plus que EN (côté input).`);
  console.log('Conseil : system prompt en anglais = 20-30% d\'économie sur les tokens d\'input.');
}

main();
