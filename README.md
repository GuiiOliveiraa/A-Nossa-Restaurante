# A Nossa Restaurante

Sistema de cardapio digital com carrinho, checkout via WhatsApp e area administrativa protegida.

## Funcionalidades

- Cardapio online por categorias
- Carrinho com quantidade, remocao e total
- Montagem de prato personalizado
- Login administrativo com JWT em cookie
- CRUD de produtos
- Modo noturno
- Modo alto contraste amarelo e preto
- Deploy pronto para Netlify

## Tecnologias

- HTML5
- CSS3
- JavaScript modular
- Node.js
- Express
- Netlify Functions
- MongoDB Atlas
- JWT
- bcryptjs

## O que mudou

O projeto agora usa o mesmo banco MongoDB Atlas nos dois ambientes:

- `server.js` usa MongoDB no desenvolvimento local
- `netlify/functions/api.js` usa MongoDB no deploy do Netlify
- os dois compartilham a mesma configuracao de conexao

Isso elimina a divergencia antiga entre `data/products.json` no local e MongoDB em producao.

## Variaveis de ambiente

Crie um arquivo `.env` com base em `.env.example`.

### Obrigatorias

- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### Opcionais

- `PORT`
- `ADMIN_NAME`
- `MONGODB_DB_NAME`

Se `ADMIN_NAME` nao for definida, o sistema usa `Administrador`.
Se `MONGODB_DB_NAME` nao for definida, o sistema usa `anossa_db`.

## Exemplo de `.env`

```env
PORT=3000
JWT_SECRET=coloque-uma-chave-longa-e-segura-aqui
ADMIN_NAME=Administrador
ADMIN_EMAIL=admin@anossa.com
ADMIN_PASSWORD=coloque-uma-senha-forte-aqui
MONGODB_URI=mongodb+srv://USUARIO:SENHA@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=anossa_db
```

## Como conectar o MongoDB Atlas

1. Crie uma conta em https://www.mongodb.com/atlas
2. Crie um cluster.
3. Crie um usuario de banco.
4. Em `Network Access`, libere o IP do seu computador para testes locais.
5. Para o Netlify, libere `0.0.0.0/0`, porque os IPs das Functions sao dinamicos.
6. Copie a string em `Connect > Drivers > Node.js`.
7. Se a senha tiver caracteres especiais como `@`, `#` ou `/`, use URL encode ou gere uma senha sem esses caracteres.
8. Configure `MONGODB_URI` no `.env` local e no painel do Netlify.

## Desenvolvimento local

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo `.env`:

```powershell
Copy-Item .env.example .env
```

3. Preencha o `.env` com a conexao do Atlas e as credenciais administrativas.

4. Inicie o projeto:

```bash
npm run dev
```

5. Abra:

```text
http://localhost:3000
```

## Deploy no Netlify

1. Faça push do repositorio.
2. Conecte o projeto no Netlify.
3. Em `Site settings > Environment variables`, configure:

- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME` se quiser personalizar
- `MONGODB_DB_NAME` se quiser usar outro banco

4. Dispare o deploy.

## Diagnostico

O projeto possui health check nos dois ambientes:

- `GET /api/health` no `server.js`
- `GET /api/health` no Netlify Function

Resposta esperada:

```json
{
  "ok": true,
  "mongodb": true,
  "databaseName": "anossa_db",
  "env": {
    "MONGODB_URI": true,
    "MONGODB_DB_NAME": true,
    "JWT_SECRET": true,
    "ADMIN_EMAIL": true,
    "ADMIN_PASSWORD": true
  }
}
```

Se `mongodb` vier `false`, verifique:

- `MONGODB_URI`
- senha do usuario do Atlas
- `Network Access`
- nome do banco configurado

## Estrutura da API

### Autenticacao

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/health`

### Produtos

- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

## Seguranca

- Nunca commite `.env`
- Guarde `JWT_SECRET` somente no ambiente local e no painel do Netlify
- Use senha forte no MongoDB Atlas
- Prefira usuario de banco com permissao limitada

## Compatibilidade do frontend

O frontend continua esperando a propriedade `id` numerica. O backend local e o backend do Netlify mantem esse formato.
