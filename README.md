# check-connections

Vérifie la connectivité aux APIs IA (Mistral, Groq, HuggingFace, Pinecone) et estime les coûts par provider.

## Installation

```bash
npm install
```

## Configuration

Remplis le fichier `.env` avec tes clés API :

```
MISTRAL_API_KEY=...
GROQ_API_KEY=...
HF_API_KEY=...
PINECONE_API_KEY=...
```

## Utilisation

```bash
# Vérifier les connexions
node check-connections.js

# Mode verbose (affiche les réponses + liste des modèles Mistral)
node check-connections.js --verbose

# Calculatrice de coûts
node cost-calculator.js
```

## Exemple de sortie

```
✅ Mistral      406ms
✅ Groq         165ms
✅ HuggingFace  354ms
✅ Pinecone     237ms

4/4 connexions actives
Tout est vert. Vous êtes prêts pour la suite !
```

## Providers

| Provider     | Endpoint                                         | Format   |
|--------------|--------------------------------------------------|----------|
| Mistral      | api.mistral.ai/v1/chat/completions               | OpenAI   |
| Groq         | api.groq.com/openai/v1/chat/completions          | OpenAI   |
| HuggingFace  | router.huggingface.co/v1/chat/completions        | OpenAI   |
| Pinecone     | api.pinecone.io/indexes                          | REST GET |
