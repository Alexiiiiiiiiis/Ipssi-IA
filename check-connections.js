require('dotenv').config();

// ─── Phase 1 : Vérification des clés ───────────────────────────────────────

const keys = {
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  HF_API_KEY: process.env.HF_API_KEY,
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
};

for (const [name, value] of Object.entries(keys)) {
  console.log(`${name}: ${value ? 'présente' : 'MANQUANTE'}`);
}

// ─── Phase 3 : Fonction générique checkProvider (DRY) ──────────────────────

/**
 * @typedef {{ name: string, url: string, key: string, model: string, format: 'openai'|'huggingface' }} ProviderConfig
 * @returns {Promise<{ provider: string, status: 'OK'|'ERROR', latency: number, error?: string, response?: string }>}
 */
async function checkProvider(config, verbose = false) {
  const { name, url, key, model, format } = config;

  if (!key) {
    return { provider: name, status: 'ERROR', latency: 0, error: 'Clé API manquante' };
  }

  const prompt = verbose
    ? 'Donne-moi la capitale de la France en un mot.'
    : 'Dis juste ok';

  let body;
  if (format === 'huggingface') {
    body = JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 5 } });
  } else {
    body = JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: verbose ? 20 : 5,
    });
  }

  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body,
    });
    const latency = Date.now() - start;

    if (!res.ok) {
      return { provider: name, status: 'ERROR', latency, error: `HTTP ${res.status}` };
    }

    const data = await res.json();

    let responseText;
    if (format === 'huggingface') {
      responseText = Array.isArray(data) ? data[0]?.generated_text?.trim() : undefined;
    } else {
      responseText = data.choices?.[0]?.message?.content?.trim();
    }

    return { provider: name, status: 'OK', latency, response: responseText };
  } catch (err) {
    const latency = Date.now() - start;
    return { provider: name, status: 'ERROR', latency, error: err.message };
  }
}

// ─── Phase 5 : checkPinecone ───────────────────────────────────────────────

async function checkPinecone() {
  const key = process.env.PINECONE_API_KEY;

  if (!key) {
    return { provider: 'Pinecone', status: 'ERROR', latency: 0, error: 'Clé API manquante' };
  }

  const start = Date.now();
  try {
    const res = await fetch('https://api.pinecone.io/indexes', {
      method: 'GET',
      headers: {
        'Api-Key': key,
        'X-Pinecone-API-Version': '2024-07',
      },
    });
    const latency = Date.now() - start;

    if (!res.ok) {
      return { provider: 'Pinecone', status: 'ERROR', latency, error: `HTTP ${res.status}` };
    }

    return { provider: 'Pinecone', status: 'OK', latency };
  } catch (err) {
    const latency = Date.now() - start;
    return { provider: 'Pinecone', status: 'ERROR', latency, error: err.message };
  }
}

// ─── Phase 5 : listMistralModels ──────────────────────────────────────────

async function listMistralModels() {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) {
    console.log('MISTRAL_API_KEY manquante, impossible de lister les modèles.');
    return;
  }
  try {
    const res = await fetch('https://api.mistral.ai/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      console.log(`Erreur liste modèles Mistral : HTTP ${res.status}`);
      return;
    }
    const data = await res.json();
    console.log('\n📋 Modèles Mistral disponibles :');
    for (const model of data.data ?? []) {
      console.log(`  - ${model.id}`);
    }
  } catch (err) {
    console.log(`Erreur liste modèles Mistral : ${err.message}`);
  }
}

// ─── Phase 4 : displayResult ──────────────────────────────────────────────

function displayResult(result, verbose = false) {
  const icon = result.status === 'OK' ? '✅' : '❌';
  const name = result.provider.padEnd(12);
  const latency = `${result.latency}ms`.padStart(6);
  let line = `${icon} ${name} ${latency}`;

  if (result.status === 'ERROR' && result.error) {
    line += `  (${result.error})`;
  }

  if (verbose && result.response) {
    line += `  → "${result.response}"`;
  }

  console.log(line);
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const verbose = process.argv.includes('--verbose');

  console.log('\n🔍 Vérification des connexions API...\n');

  // Phase 3 : les 3 providers en parallèle (DRY)
  const [mistral, groq, hf, pinecone] = await Promise.all([
    checkProvider(
      {
        name: 'Mistral',
        url: 'https://api.mistral.ai/v1/chat/completions',
        key: process.env.MISTRAL_API_KEY,
        model: 'mistral-small-latest',
        format: 'openai',
      },
      verbose
    ),
    checkProvider(
      {
        name: 'Groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        key: process.env.GROQ_API_KEY,
        model: 'llama-3.1-8b-instant',
        format: 'openai',
      },
      verbose
    ),
    checkProvider(
      {
        name: 'HuggingFace',
        url: 'https://router.huggingface.co/v1/chat/completions',
        key: process.env.HF_API_KEY,
        model: 'meta-llama/Llama-3.1-8B-Instruct',
        format: 'openai',
      },
      verbose
    ),
    checkPinecone(),
  ]);

  const results = [mistral, groq, hf, pinecone];

  // Phase 4 : affichage formaté
  for (const result of results) {
    displayResult(result, verbose);
  }

  const okCount = results.filter((r) => r.status === 'OK').length;
  console.log(`\n${okCount}/${results.length} connexions actives`);

  if (okCount === results.length) {
    console.log('\nTout est vert. Vous êtes prêts pour la suite !');
  } else {
    console.log('\nCertaines connexions ont échoué. Vérifiez vos clés API.');
  }

  // Phase 5 : liste des modèles Mistral
  if (verbose) {
    await listMistralModels();
  }
}

main();
