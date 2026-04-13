require('dotenv').config();
const { callProvider } = require('./lib');

const GROQ_LLAMA = {
  name: 'Groq (Llama 3.1 8B / LPU)',
  url: 'https://api.groq.com/openai/v1/chat/completions',
  key: process.env.GROQ_API_KEY,
  model: 'llama-3.1-8b-instant',
};

const HF_LLAMA = {
  name: 'HuggingFace (Llama 3.1 8B / GPU)',
  url: 'https://router.huggingface.co/v1/chat/completions',
  key: process.env.HF_API_KEY,
  model: 'meta-llama/Llama-3.1-8B-Instruct',
};

async function compareSameModel(prompt) {
  console.log(`\nPrompt : "${prompt}"\n`);

  const [groq, hf] = await Promise.all([
    callProvider(GROQ_LLAMA, prompt, 0.7, 150),
    callProvider(HF_LLAMA, prompt, 0.7, 150),
  ]);

  console.log(`Groq        : ${groq.latency}ms — "${groq.content ?? groq.error}"`);
  console.log(`HuggingFace : ${hf.latency}ms — "${hf.content ?? hf.error}"`);

  if (groq.latency && hf.latency) {
    const ratio = (hf.latency / groq.latency).toFixed(1);
    console.log(`\nLatence : Groq ${ratio}x plus rapide`);
  }

  const same =
    groq.content && hf.content &&
    groq.content.toLowerCase().slice(0, 30) === hf.content.toLowerCase().slice(0, 30);
  console.log(`Réponses : similaires en substance, style ${same ? 'identique' : 'légèrement différent'}`);

  return { groq, hf };
}

async function main() {
  console.log('=== Phase 10 : Même modèle (Llama 3.1 8B), deux hébergeurs ===');
  await compareSameModel('Explique le machine learning en 2 phrases.');
  console.log('');
  await compareSameModel('Donne-moi 3 conseils pour écrire du bon code.');
}

main();
