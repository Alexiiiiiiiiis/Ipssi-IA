# check-connections

Projet Node.js qui vérifie la connectivité aux APIs IA (Mistral, Groq, HuggingFace, Pinecone) et explore les providers en profondeur à travers 14 phases.

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

## Providers

| Provider    | Modèle                           | Type       |
|-------------|----------------------------------|------------|
| Mistral     | mistral-small-latest             | Propriétaire (FR) |
| Groq        | llama-3.3-70b-versatile          | Meta Llama sur LPU |
| HuggingFace | meta-llama/Llama-3.1-8B-Instruct | Open source sur GPU |
| Pinecone    | —                                | Vector database |

## Scripts

| Commande | Phase | Description |
|---|---|---|
| `node check-connections.js` | 1-5 | Vérifie les 4 connexions |
| `node check-connections.js --verbose` | 5 | Idem + réponses des modèles + liste modèles Mistral |
| `node cost-calculator.js` | 6 | Calculatrice de coûts comparatifs |
| `node prompt-lab.js` | 7 | 3 providers x 3 températures → 9 réponses en parallèle |
| `node comparateur.js` | 8 | 5 tâches x 3 providers, tableau markdown |
| `node server.js` | 9 | Serveur Express sur port 3000 |
| `node same-model.js` | 10 | Llama 3.1 8B : Groq (LPU) vs HuggingFace (GPU) |
| `node stress-test.js` | 11 | Stress test 5/10 requêtes parallèles, mesure p95 |
| `node prompt-sensitivity.js` | 12 | 5 formulations du même prompt, compare les réponses |
| `node multi-langue.js` | 13 | FR / EN / ES — compare tokens et coûts |
| `node dashboard.js` | 14 | Génère `results.html` avec tous les résultats |
| `node my-prompt.js` | — | Envoie ton propre prompt aux 3 providers |

## Serveur Express (Phase 9)

```bash
node server.js
```

Routes disponibles :

```
GET http://localhost:3000/check
GET http://localhost:3000/ask?q=Bonjour&provider=mistral
GET http://localhost:3000/ask?q=Bonjour&provider=groq
GET http://localhost:3000/cost?text=Bonjour%20monde
```

## Dashboard (Phase 14)

```bash
node dashboard.js
```

Génère un fichier `results.html` avec 4 tableaux :
- Statut et latence des 4 connexions
- Comparateur de réponses (5 types de tâches x 3 providers)
- Analyse multi-langue FR/EN/ES (tokens + coûts)
- Estimation des coûts par provider

Ouvre ensuite `results.html` directement dans ton navigateur.

## Prompt personnalisé

Modifie `my-prompt.js` pour tester ta propre question sur les 3 providers :

```js
const monPrompt = "Ta question ici";
```

```bash
node my-prompt.js
```

## Exemple de sortie (node check-connections.js)

```
✅ Mistral       404ms
✅ Groq          133ms
✅ HuggingFace   379ms
✅ Pinecone      859ms

4/4 connexions actives
```
