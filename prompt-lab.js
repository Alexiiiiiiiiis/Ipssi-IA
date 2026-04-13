
require('dotenv').config();
const { PROVIDERS, callProvider } = require('./lib');

const PROMPT = "Explique ce qu'est un cookie HTTP en une phrase.";
const TEMPERATURES = [0, 0.5, 1];

async function main() {
  console.log(`\nPrompt Lab\nPrompt : "${PROMPT}"\n`);
  console.log('─'.repeat(90));

  const combinations = PROVIDERS.flatMap(provider =>
    TEMPERATURES.map(temp => ({ provider, temp }))
  );

  const results = await Promise.all(
    combinations.map(({ provider, temp }) =>
      callProvider(provider, PROMPT, temp, 100).then(r => ({ ...r, temperature: temp }))
    )
  );

  for (const r of results) {
    const tempStr = r.temperature.toFixed(1);
    const content = r.content
      ? r.content.replace(/\n/g, ' ').slice(0, 75)
      : `[ERREUR: ${r.error}]`;
    console.log(`${r.provider.padEnd(12)} | temp ${tempStr} | ${content}`);
  }

  console.log('─'.repeat(90));
  console.log('\nObservation : à temp 0, réponses déterministes. À temp 1, variées.');
}

main();
