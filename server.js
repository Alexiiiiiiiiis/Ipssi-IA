
require('dotenv').config();
const express = require('express');
const { PROVIDERS, checkProvider, checkPinecone, callProvider, estimateCostData } = require('./lib');

const app = express();
const PORT = 3000;

// GET /check 
app.get('/check', async (req, res) => {
  const results = await Promise.all([
    ...PROVIDERS.map(p => checkProvider(p)),
    checkPinecone(),
  ]);
  res.json(results);
});

//  GET /ask?q=...&provider=mistral 
app.get('/ask', async (req, res) => {
  const { q, provider: providerName } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Paramètre "q" requis' });
  }

  const providerConfig = PROVIDERS.find(
    p => p.name.toLowerCase() === (providerName ?? 'mistral').toLowerCase()
  );

  if (!providerConfig) {
    return res.status(400).json({
      error: `Provider inconnu. Valeurs valides : ${PROVIDERS.map(p => p.name.toLowerCase()).join(', ')}`,
    });
  }

  const result = await callProvider(providerConfig, q, 0.7, 300);
  res.json({ provider: result.provider, response: result.content, latency: result.latency });
});

// GET /cost?text=... 
app.get('/cost', async (req, res) => {
  const { text } = req.query;

  if (!text) {
    return res.status(400).json({ error: 'Paramètre "text" requis' });
  }

  const data = estimateCostData(text);
  res.json(data);
});

//  Start server
app.listen(PORT, () => {
  console.log(`\nServeur démarré sur http://localhost:${PORT}`);
  console.log('\nRoutes disponibles :');
  console.log(`  GET http://localhost:${PORT}/check`);
  console.log(`  GET http://localhost:${PORT}/ask?q=Bonjour&provider=mistral`);
  console.log(`  GET http://localhost:${PORT}/cost?text=Bonjour%20monde\n`);
});
