# Parecer Técnico — Projeto "A Nossa Restaurante"

## Contexto para análise por outra IA

---

## Visão geral do projeto

Repositório: https://github.com/GuiiOliveiraa/A-Nossa-Restaurante/tree/main

Sistema de cardápio digital com carrinho, checkout via WhatsApp e painel administrativo protegido por JWT.
Stack: Node.js, Express, MongoDB Atlas, bcryptjs, jsonwebtoken, Netlify Functions.

---

## Problema principal

O projeto possui **dois arquivos de backend com responsabilidades diferentes e incompatíveis**:

### `server.js` (backend local)

- Usado com `npm run dev` ou `npm start`
- **NÃO usa MongoDB** — persiste dados em `data/products.json` via `fs.readFileSync` / `fs.writeFileSync`
- A variável `MONGODB_URI` está listada no README mas é completamente ignorada neste arquivo
- Qualquer alteração feita localmente (adicionar/remover produtos) não reflete no MongoDB e vice-versa

### `netlify/functions/api.js` (backend de produção)

- Usado pelo Netlify Functions em produção
- **USA MongoDB** via `MongoClient` do pacote `mongodb@7.3.0`
- Conecta ao banco `anossa_db`, collection `products`
- Exige as 5 variáveis de ambiente para funcionar

---

## Falhas identificadas

### 1. MONGODB_URI ausente ou mal configurada

**Onde:** `netlify/functions/api.js`, função `getClient()`

```js
if (MONGODB_URI) {
  client = new MongoClient(MONGODB_URI);
}
```

Se `MONGODB_URI` não estiver definida, `client` fica `undefined` e qualquer chamada à API retorna:

```json
{
  "message": "Variáveis de ambiente ausentes. Configure MONGODB_URI, JWT_SECRET, ADMIN_EMAIL e ADMIN_PASSWORD."
}
```

**Solução:** Criar `.env` com base no `.env.example` e preencher `MONGODB_URI` com a connection string do Atlas.

---

### 2. IP não liberado no MongoDB Atlas

**Sintoma:** Conexão recusada mesmo com `MONGODB_URI` correta.

O Atlas bloqueia conexões por IP por padrão. Em _Network Access_ é necessário adicionar:

- O IP do desenvolvedor (local)
- `0.0.0.0/0` para Netlify Functions (IPs dinâmicos)

---

### 3. Caracteres especiais na senha da connection string

**Exemplo problemático:**

```
mongodb+srv://user:minha@senha#123@cluster...
```

O `@` na senha quebra o parsing da URI.

**Solução:** Fazer URL-encode da senha ou criar usuário com senha sem caracteres especiais.

---

### 4. Nome do banco hardcoded sem fallback

**Onde:** `netlify/functions/api.js`, função `getDb()`

```js
async function getDb() {
  const connectedClient = await getClient();
  return connectedClient.db("anossa_db");
}
```

O banco é sempre `anossa_db`. Se o cluster Atlas não tiver esse banco (ele é criado automaticamente no primeiro `insertOne`), a collection `products` começa vazia e os produtos não aparecem.

**Melhoria sugerida:** Expor como variável de ambiente `MONGODB_DB_NAME` com fallback para `"anossa_db"`.

---

### 5. Gerenciamento de conexão inadequado para serverless

**Onde:** variáveis globais `client` e `clientPromise` no topo do módulo

```js
let client;
let clientPromise;

if (MONGODB_URI) {
  client = new MongoClient(MONGODB_URI);
}

function getClient() {
  if (!clientPromise) {
    clientPromise = client.connect();
  }
  return clientPromise;
}
```

Em Netlify Functions (ambiente serverless), cada invocação pode ser um cold start — o módulo é reinicializado. O padrão de `clientPromise` global é correto para serverless **somente se** o ambiente reutilizar a instância (warm start). Em cold starts, a promessa é recriada corretamente, mas se a conexão for encerrada pelo Atlas por inatividade (timeout padrão: 30s), `clientPromise` ainda aponta para uma promessa resolvida com uma conexão morta.

**Melhoria sugerida:** Usar `serverApi` e `connectTimeoutMS` na criação do client, ou verificar a conexão antes de usar.

---

### 6. Variáveis de ambiente não configuradas no painel do Netlify

O arquivo `.env` local **não é enviado ao Netlify** (está no `.gitignore`). As variáveis precisam ser cadastradas manualmente em:

> Netlify → Site settings → Environment variables

Variáveis obrigatórias:
| Variável | Valor esperado |
|---|---|
| `MONGODB_URI` | `mongodb+srv://usuario:senha@cluster.mongodb.net/?retryWrites=true&w=majority` |
| `JWT_SECRET` | String longa e aleatória (min. 32 chars) |
| `ADMIN_NAME` | Nome do administrador |
| `ADMIN_EMAIL` | E-mail do administrador |
| `ADMIN_PASSWORD` | Senha forte |

---

## Endpoint de diagnóstico disponível

O projeto já possui um endpoint de health check:

```
GET /api/health
```

Retorna:

```json
{
  "ok": true,
  "mongodb": true,
  "env": {
    "MONGODB_URI": true,
    "JWT_SECRET": true,
    "ADMIN_EMAIL": true,
    "ADMIN_PASSWORD": true
  }
}
```

Se `mongodb: false`, o campo `mongodbError` mostra a mensagem de erro da conexão.

---

## Passos para fazer funcionar (ordem recomendada)

1. Criar conta no MongoDB Atlas (https://www.mongodb.com/atlas)
2. Criar cluster gratuito (M0)
3. Criar usuário de banco com senha **sem caracteres especiais**
4. Em _Network Access_, liberar `0.0.0.0/0`
5. Copiar a connection string em _Connect → Drivers → Node.js_
6. Criar `.env` local:

```env
PORT=3000
JWT_SECRET=coloque-uma-chave-longa-e-segura-aqui-minimo-32-chars
ADMIN_NAME=Administrador
ADMIN_EMAIL=admin@anossa.com
ADMIN_PASSWORD=SenhaForte123!
MONGODB_URI=mongodb+srv://usuario:senha@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

7. Testar localmente com `npm run dev` — mas atenção: localmente o `server.js` não usa o MongoDB. Para testar o `netlify/functions/api.js` localmente, instalar o Netlify CLI:

```bash
npm install -g netlify-cli
netlify dev
```

8. No Netlify, cadastrar as mesmas variáveis em _Site settings → Environment variables_
9. Acessar `/api/health` para confirmar conexão

---

## Resumo do que pedir para outra IA

> "Tenho um projeto Node.js com dois backends: `server.js` (local, usa JSON file) e `netlify/functions/api.js` (produção, usa MongoDB Atlas). O MongoDB só é usado na Netlify Function. Preciso de ajuda para: (1) configurar corretamente as variáveis de ambiente para o MongoDB Atlas funcionar; (2) corrigir o gerenciamento de conexão MongoClient para ambiente serverless; (3) opcionalmente unificar os dois backends para que o MongoDB também seja usado localmente."
