# A Nossa Restaurante

Sistema de cardápio digital com carrinho, checkout via WhatsApp e área administrativa protegida.

## Funcionalidades

- Cardápio online por categorias
- Carrinho com quantidade, remoção e total
- Montagem de prato personalizado
- Login administrativo com JWT em cookie
- CRUD de produtos via Netlify Functions
- Modo noturno
- Modo alto contraste amarelo e preto
- Deploy pronto para Netlify

## Tecnologias

- HTML5
- CSS3
- JavaScript modular
- Node.js
- Netlify Functions
- MongoDB Atlas
- JWT
- bcryptjs

## Como conectar o MongoDB Atlas

1. Crie uma conta em https://www.mongodb.com/atlas
2. Crie um cluster gratuito ou pago.
3. Crie um usuário de banco de dados.
4. Em `Network Access`, libere o IP que vai acessar o banco.
5. Copie a connection string em `Connect > Drivers`.
6. No projeto, configure a variável `MONGODB_URI` com essa string.

Exemplo:

```env
MONGODB_URI=mongodb+srv://USUARIO:SENHA@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

No Netlify, essa variável deve ser cadastrada em:

- `Site settings`
- `Environment variables`

## Variáveis de ambiente

Crie um arquivo `.env` com base em `.env.example`.

### Variáveis obrigatórias

- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### Variáveis opcionais

- `PORT`

## Exemplo de `.env`

```env
PORT=3000
JWT_SECRET=coloque-uma-chave-longa-e-segura-aqui
ADMIN_NAME=Administrador
ADMIN_EMAIL=admin@anossa.com
ADMIN_PASSWORD=coloque-uma-senha-forte-aqui
MONGODB_URI=mongodb+srv://USUARIO:SENHA@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## Como rodar localmente

1. Instale as dependências:

```bash
npm install
```

2. Crie o `.env`:

```powershell
Copy-Item .env.example .env
```

3. Preencha o `.env` com sua string do MongoDB Atlas e suas credenciais.

4. Inicie o servidor:

```bash
npm run dev
```

5. Abra:

```text
http://localhost:3000
```

## Como publicar no Netlify

1. Conecte o repositório no Netlify.
2. Configure as variáveis de ambiente no painel do Netlify.
3. Confirme:

- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

4. O arquivo [`netlify.toml`](./netlify.toml) já está configurado para:

- publicar a raiz do projeto
- redirecionar rotas SPA para `index.html`
- expor a Function em `/api/*`

## Estrutura da API

### Autenticação

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Produtos

- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

## Observações sobre segurança

- Senhas e segredo JWT devem ficar somente no `.env`
- Nunca commite `.env` no repositório
- Use uma `JWT_SECRET` longa e aleatória
- Use um usuário de banco com permissões limitadas, se possível

## Acesso administrativo

As credenciais administrativas são definidas nas variáveis:

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

O login usa essas credenciais e cria um cookie `httpOnly` com JWT.

## Recuperação de produtos antigos

Se você já tinha produtos em `data/products.json`, pode migrá-los para o MongoDB Atlas inserindo os documentos na collection `products`.

Cada documento deve manter a estrutura:

```json
{
  "id": 1,
  "name": "Prato Executivo Frango",
  "desc": "Arroz, feijao, fritas e salada.",
  "price": 30,
  "category": "promocao",
  "image": "Logo.PNG",
  "available": true
}
```

## Suporte ao frontend

O frontend continua esperando a propriedade `id` numérica. O backend já devolve e grava os produtos nesse formato para manter compatibilidade.

