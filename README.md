# check-connections

Vérifie la connectivité aux APIs IA (Mistral, Groq, HuggingFace, Pinecone) et explore les providers en profondeur.

## Installation

```bash
npm install
```

## Configuration

Copie `.env.example` en `.env` et remplis tes clés API :

```bash
cp .env.example .env
```

```
MISTRAL_API_KEY=...
GROQ_API_KEY=...
HF_API_KEY=...
PINECONE_API_KEY=...
```

## Scripts

| Commande | Phase | Description |
|---|---|---|
| `npm start` | 1-5 | Vérification des 4 connexions |
| `npm run verbose` | 5 | Idem + réponses des modèles + liste modèles Mistral |
| `npm run cost` | 6 | Calculatrice de coûts comparatifs |
| `npm run lab` | 7 | 3 providers × 3 températures, 9 réponses en parallèle |
| `npm run compare` | 8 | 5 tâches × 3 providers, tableau markdown |
| `npm run server` | 9 | Serveur Express sur port 3000 |
| `npm run same-model` | 10 | Llama 3.1 8B : Groq (LPU) vs HuggingFace (GPU) |
| `npm run stress` | 11 | Stress test 5/10 requêtes parallèles, mesure p95 |
| `npm run sensitivity` | 12 | 5 formulations du même prompt, compare les réponses |
| `npm run multilang` | 13 | FR / EN / ES — compare tokens et coûts |
| `npm run dashboard` | 14 | Génère `results.html` avec tous les résultats |

## Serveur Express (Phase 9)

```bash
npm run server

# Tester avec curl :
curl http://localhost:3000/check
curl "http://localhost:3000/ask?q=Bonjour&provider=mistral"
curl "http://localhost:3000/ask?q=Bonjour&provider=groq"
curl "http://localhost:3000/cost?text=Bonjour%20monde"
```

## Exemple de sortie (npm start)

```
✅ Mistral       406ms
✅ Groq          165ms
✅ HuggingFace   354ms
✅ Pinecone      237ms

4/4 connexions actives
Tout est vert. Vous êtes prêts pour la suite !
```

## Providers

| Provider    | Endpoint                                              | Modèle                        |
|-------------|-------------------------------------------------------|-------------------------------|
| Mistral     | api.mistral.ai/v1/chat/completions                    | mistral-small-latest          |
| Groq        | api.groq.com/openai/v1/chat/completions               | llama-3.1-8b-instant          |
| HuggingFace | router.huggingface.co/v1/chat/completions             | meta-llama/Llama-3.1-8B-Instruct |
| Pinecone    | api.pinecone.io/indexes                               | —                             |
