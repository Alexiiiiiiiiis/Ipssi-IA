require('dotenv').config();
const fs = require('fs');
const { PROVIDERS, checkProvider, checkPinecone, callProvider, estimateTokens, estimateCostData } = require('./lib');

// Couleurs selon statut / latence 
function latencyColor(ms) {
  if (!ms) return '#e74c3c';
  if (ms < 500)  return '#2ecc71';
  if (ms < 1500) return '#f39c12';
  return '#e74c3c';
}

function statusColor(s) {
  return s === 'OK' ? '#2ecc71' : '#e74c3c';
}

//  Collecte des données 
async function collectData() {
  console.log('Collecte des données...');

  // 1. Connexions
  const connections = await Promise.all([
    ...PROVIDERS.map(p => checkProvider(p)),
    checkPinecone(),
  ]);
  console.log('  ✓ Connexions');

  // 2. Comparateur (5 prompts × 3 providers)
  const PROMPTS = [
    { type: 'traduction', text: 'Traduis en anglais : "Le chat dort sur le canapé."' },
    { type: 'résumé',    text: 'Résume en une phrase : "L\'IA permet aux machines de simuler l\'intelligence humaine."' },
    { type: 'code',      text: 'Fonction JS qui inverse une chaîne. Code uniquement.' },
    { type: 'créatif',   text: 'Métaphore courte pour expliquer un LLM.' },
    { type: 'factuel',   text: 'Qui a publié "Attention is All You Need" en 2017 ?' },
  ];

  const comparateur = await Promise.all(
    PROMPTS.flatMap(p =>
      PROVIDERS.map(provider =>
        callProvider(provider, p.text, 0.3, 100).then(r => ({ ...r, type: p.type }))
      )
    )
  );
  console.log('  ✓ Comparateur');

  // 3. Multi-langue
  const LANGS = [
    { lang: 'Français', text: 'Explique le machine learning en deux phrases.' },
    { lang: 'English',  text: 'Explain machine learning in two sentences.' },
    { lang: 'Español',  text: 'Explica el machine learning en dos frases.' },
  ];
  const multiLangue = await Promise.all(
    LANGS.map(q => callProvider(PROVIDERS[0], q.text, 0.3, 100).then(r => ({ ...r, lang: q.lang, inputText: q.text })))
  );
  console.log('  ✓ Multi-langue');

  // 4. Coûts
  const sampleText = 'Bonjour, je voudrais savoir comment fonctionne le machine learning.';
  const costs = estimateCostData(sampleText);

  return { connections, comparateur, multiLangue, costs, PROMPTS, sampleText };
}

// Génération HTML 
function generateHTML({ connections, comparateur, multiLangue, costs, PROMPTS, sampleText }) {
  const now = new Date().toLocaleString('fr-FR');

  const connRows = connections.map(r => `
    <tr>
      <td>${r.provider}</td>
      <td style="color:${statusColor(r.status)};font-weight:bold">${r.status}</td>
      <td style="color:${latencyColor(r.latency)}">${r.latency}ms</td>
      <td>${r.error ?? '—'}</td>
    </tr>`).join('');

  const compRows = PROMPTS.map(p => {
    const cells = PROVIDERS.map(prov => {
      const r = comparateur.find(x => x.type === p.type && x.provider === prov.name);
      const content = r?.content ? r.content.replace(/</g, '&lt;').slice(0, 80) : `<em style="color:#e74c3c">${r?.error ?? 'ERR'}</em>`;
      return `<td>${content}</td>`;
    }).join('');
    return `<tr><td><strong>${p.type}</strong></td>${cells}</tr>`;
  }).join('');

  const langRows = multiLangue.map(r => {
    const inputT = estimateTokens(r.inputText);
    const outputT = r.tokens || 0;
    const cost = ((inputT + outputT) / 1_000_000 * 0.20).toFixed(7) + '€';
    return `<tr>
      <td>${r.lang}</td>
      <td>${inputT}</td>
      <td>${outputT}</td>
      <td>${cost}</td>
      <td>${r.latency}ms</td>
    </tr>`;
  }).join('');

  const costRows = costs.map(c => `
    <tr>
      <td>${c.provider}</td>
      <td>${c.tokens}</td>
      <td>${c.estimatedCost}</td>
      <td>${c.per1000}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Dashboard API — ${now}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1100px; margin: 40px auto; padding: 0 20px; background: #f8f9fa; color: #333; }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { color: #2c3e50; margin-top: 40px; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    th { background: #3498db; color: white; padding: 10px 14px; text-align: left; }
    td { padding: 9px 14px; border-bottom: 1px solid #eee; vertical-align: top; font-size: 0.9em; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f0f7ff; }
    .footer { margin-top: 40px; color: #888; font-size: 0.85em; text-align: center; }
  </style>
</head>
<body>
  <h1>Dashboard API IA — ${now}</h1>

  <h2>Connexions</h2>
  <table>
    <thead><tr><th>Provider</th><th>Statut</th><th>Latence</th><th>Erreur</th></tr></thead>
    <tbody>${connRows}</tbody>
  </table>

  <h2>Comparateur de modèles (temperature 0.3)</h2>
  <table>
    <thead><tr><th>Type</th>${PROVIDERS.map(p => `<th>${p.name}</th>`).join('')}</tr></thead>
    <tbody>${compRows}</tbody>
  </table>

  <h2>Multi-langue (Mistral)</h2>
  <table>
    <thead><tr><th>Langue</th><th>Tokens input</th><th>Tokens output</th><th>Coût estimé</th><th>Latence</th></tr></thead>
    <tbody>${langRows}</tbody>
  </table>

  <h2>Coûts estimés — "${sampleText.slice(0, 50)}..."</h2>
  <table>
    <thead><tr><th>Provider</th><th>Tokens</th><th>Coût / requête</th><th>Pour 1000 requêtes</th></tr></thead>
    <tbody>${costRows}</tbody>
  </table>

  <div class="footer">Généré par dashboard.js — ${now}</div>
</body>
</html>`;
}

// Main 
async function main() {
  console.log('\n📊 Génération du dashboard...\n');
  const data = await collectData();
  const html = generateHTML(data);
  fs.writeFileSync('results.html', html, 'utf8');
  console.log('\n✅ results.html généré — ouvrez-le dans votre navigateur.');
}

main();
