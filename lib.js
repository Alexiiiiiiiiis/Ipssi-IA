require('dotenv').config();

// Config providers 

const PROVIDERS = [
  {
    name: 'Mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: process.env.MISTRAL_API_KEY,
    model: 'mistral-small-latest',
  },
  {
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
  },
  {
    name: 'HuggingFace',
    url: 'https://router.huggingface.co/v1/chat/completions',
    key: process.env.HF_API_KEY,
    model: 'meta-llama/Llama-3.1-8B-Instruct',
  },
];

// checkProvider (ping rapide) 

async function checkProvider(config, verbose = false) {
  const { name, url, key, model } = config;

  if (!key) {
    return { provider: name, status: 'ERROR', latency: 0, error: 'Clé API manquante' };
  }

  const prompt = verbose
    ? 'Donne-moi la capitale de la France en un mot.'
    : 'Dis juste ok';

  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: verbose ? 20 : 5,
      }),
    });
    const latency = Date.now() - start;

    if (!res.ok) {
      return { provider: name, status: 'ERROR', latency, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const response = data.choices?.[0]?.message?.content?.trim();
    return { provider: name, status: 'OK', latency, response };
  } catch (err) {
    return { provider: name, status: 'ERROR', latency: Date.now() - start, error: err.message };
  }
}

//  callProvider (appel complet avec prompt libre) 

async function callProvider(config, prompt, temperature = 0.7, maxTokens = 500) {
  const { name, url, key, model } = config;

  if (!key) {
    return { provider: name, content: null, latency: 0, tokens: 0, error: 'Clé API manquante' };
  }

  // HuggingFace n'accepte pas temperature: 0 exactement
  const effectiveTemp =
    name === 'HuggingFace' && temperature === 0 ? 0.01 : temperature;

  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: effectiveTemp,
        max_tokens: maxTokens,
      }),
    });
    const latency = Date.now() - start;

    if (!res.ok) {
      return { provider: name, content: null, latency, tokens: 0, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() ?? null;
    const tokens = data.usage?.total_tokens ?? 0;

    return { provider: name, content, latency, tokens };
  } catch (err) {
    return { provider: name, content: null, latency: Date.now() - start, tokens: 0, error: err.message };
  }
}

//  checkPinecone 

async function checkPinecone() {
  const key = process.env.PINECONE_API_KEY;
  if (!key) {
    return { provider: 'Pinecone', status: 'ERROR', latency: 0, error: 'Clé API manquante' };
  }
  const start = Date.now();
  try {
    const res = await fetch('https://api.pinecone.io/indexes', {
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
    return { provider: 'Pinecone', status: 'ERROR', latency: Date.now() - start, error: err.message };
  }
}

// ─── Coûts ─────────────────────────────────────────────────────────────────

const PRICING = [
  { label: 'Mistral Small', pricePerMillion: 0.20 },
  { label: 'Groq Llama 3',  pricePerMillion: 0.05 },
  { label: 'GPT-4o',        pricePerMillion: 2.50 },
];

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function estimateCostData(text) {
  const tokens = estimateTokens(text);
  return PRICING.map(p => ({
    provider: p.label,
    tokens,
    estimatedCost: ((tokens / 1_000_000) * p.pricePerMillion).toFixed(11) + '€',
    per1000: ((tokens / 1_000_000) * p.pricePerMillion * 1000).toFixed(5) + '€',
  }));
}

module.exports = {
  PROVIDERS,
  checkProvider,
  callProvider,
  checkPinecone,
  estimateTokens,
  estimateCostData,
};
