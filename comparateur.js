require('dotenv').config();
const { PROVIDERS, callProvider } = require('./lib');

const PROMPTS = [
  { type: 'traduction', text: 'Traduis en anglais (réponse uniquement) : "Le chat dort sur le canapé."' },
  { type: 'résumé',    text: 'Résume en UNE phrase : "L\'IA est un domaine de l\'informatique qui crée des systèmes capables de tâches nécessitant normalement l\'intelligence humaine, comme comprendre le langage, reconnaître des images ou prendre des décisions."' },
  { type: 'code',      text: 'Écris une fonction JavaScript qui inverse une chaîne. Code uniquement, pas d\'explication.' },
  { type: 'créatif',   text: 'Donne UNE métaphore originale et courte pour expliquer ce qu\'est un LLM.' },
  { type: 'factuel',   text: 'Qui a publié le papier "Attention is All You Need" en 2017 ? Réponds en une phrase.' },
];

async function main() {
  console.log('\nComparateur de modèles — 5 tâches × 3 providers (temp 0.3)\n');

  const all = await Promise.all(
    PROMPTS.flatMap(p =>
      PROVIDERS.map(provider =>
        callProvider(provider, p.text, 0.3, 150).then(r => ({ ...r, type: p.type }))
      )
    )
  );

  const W = 42;
  const header = `| ${'Type'.padEnd(10)} | ${'Mistral'.padEnd(W)} | ${'Groq'.padEnd(W)} | ${'HuggingFace'.padEnd(W)} |`;
  const sep    = `|${'-'.repeat(12)}|${'-'.repeat(W + 2)}|${'-'.repeat(W + 2)}|${'-'.repeat(W + 2)}|`;

  console.log(header);
  console.log(sep);

  for (const p of PROMPTS) {
    const cells = PROVIDERS.map(prov => {
      const r = all.find(x => x.type === p.type && x.provider === prov.name);
      if (!r || !r.content) return `[${r?.error ?? 'ERR'}]`.padEnd(W);
      return r.content.replace(/\n/g, ' ').slice(0, W).padEnd(W);
    });
    console.log(`| ${p.type.padEnd(10)} | ${cells.join(' | ')} |`);
  }

  console.log('\n(copiez ce tableau dans un .md ou Google Doc pour la discussion)');
}

main();
