

const PROVIDERS = [
  { label: 'Mistral Small', pricePerMillion: 0.20 },
  { label: 'Groq Llama 3',  pricePerMillion: 0.05 },
  { label: 'GPT-4o',        pricePerMillion: 2.50 },
];

/**
 * Estimation du nombre de tokens (approximation : longueur / 4)
 * @param {string} text
 * @returns {number}
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Affiche un tableau comparatif des coûts estimés pour un texte donné.
 * @param {string} text
 * @param {string} [label]
 */
function estimateCost(text, label) {
  const tokens = estimateTokens(text);
  const title = label ?? `${text.length} caractères`;

  console.log(`\nTexte : ${title} → ~${tokens} tokens\n`);

  const col1 = 'Provider';
  const col2 = 'Coût estimé (input)';
  const col3 = 'Pour 1000 requêtes';
  const w1 = 15, w2 = 21, w3 = 20;

  const separator = `${'-'.repeat(w1)} ${'-'.repeat(w2)} ${'-'.repeat(w3)}`;

  console.log(`${col1.padEnd(w1)} ${col2.padEnd(w2)} ${col3.padEnd(w3)}`);
  console.log(separator);

  for (const provider of PROVIDERS) {
    const costPerRequest = (tokens / 1_000_000) * provider.pricePerMillion;
    const costPer1000    = costPerRequest * 1000;

    const costStr     = `${costPerRequest.toFixed(11)}€`;
    const cost1000Str = `${costPer1000.toFixed(5)}€`;

    console.log(
      `${provider.label.padEnd(w1)} ${costStr.padEnd(w2)} ${cost1000Str.padEnd(w3)}`
    );
  }
  console.log('');
}

// Exemple d'utilisation 

const sampleText =
  'Bonjour, je suis un étudiant en IA et je veux tester les coûts des différentes APIs.';

estimateCost(sampleText, `${sampleText.length} caractères`);

// On peut aussi appeler avec n'importe quel texte :
// estimateCost("Votre texte ici", "Mon texte de test");
