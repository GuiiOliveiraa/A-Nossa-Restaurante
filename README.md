# A Nossa Restaurante - Cardapio Digital

## Sobre o Projeto

O **A Nossa Restaurante - Cardapio Digital** foi desenvolvido para modernizar o atendimento do restaurante, oferecendo uma experiencia pratica e intuitiva para os clientes por meio de um sistema de pedidos online.

A plataforma foi pensada com foco em dispositivos moveis, permitindo visualizar o cardapio, adicionar produtos ao carrinho e finalizar pedidos diretamente pelo WhatsApp.

Tambem existe uma area administrativa para gerenciamento dos produtos exibidos no cardapio.

---

## Funcionalidades

- Cardapio online com pratos, bebidas e sobremesas
- Exibicao de precos e descricoes dos produtos
- Sistema de carrinho com adicao, remocao e controle de quantidade
- Finalizacao do pedido via WhatsApp
- Coleta de nome, endereco, forma de pagamento e observacoes do cliente
- Painel administrativo para cadastrar, editar, remover e ativar/desativar produtos
- Aba "Monte o seu prato" com combinacoes personalizadas
- Modo contraste e modo noturno com preferencia salva no navegador
- Fallback para funcionamento no Netlify com rotas SPA e armazenamento local dos produtos

---

## Tecnologias Utilizadas

### Frontend

- HTML5
- CSS3
- JavaScript modular

### Backend

- Node.js
- Express
- JWT
- Cookie Parser
- bcryptjs

---

## Equipe - Equipe 01

| Integrante | Funcao | Responsabilidades |
|---|---|---|
| Caio Nakahara | Lider | Planejamento e organizacao do projeto |
| Samuel Duarte | UI/UX Design | Identidade visual e experiencia do usuario |
| Joao Vitor | Marketing | Estrategias de divulgacao e publico-alvo |
| Davi Duarte | QA | Testes e correcao de erros |
| Guilherme Oliveira | Programacao | Desenvolvimento em HTML, CSS e JavaScript |

---

## Beneficios do Projeto

- Maior visibilidade digital para o restaurante
- Facilidade de acesso por dispositivos moveis
- Profissionalizacao do atendimento
- Melhor organizacao dos pedidos
- Otimizacao do sistema de delivery
- Integracao pratica com WhatsApp

---

## Informacoes Academicas

Projeto desenvolvido para a disciplina **BRADWEB**  
**1o Semestre - 2026**

Orientacao: **Professora Ana Paula Muller Giancoli**

---

## Preview do Projeto

Area destinada para imagens ou GIFs do sistema.

---

## Status do Projeto

Em desenvolvimento.

---

## Alteracoes Implementadas

- Alteracao de quantidade diretamente no carrinho
- Finalizacao com forma de pagamento e observacoes do cliente
- Categorias: Promocao do dia, Cardapio normal, Bebidas e Sobremesas
- AdminPage para cadastrar, editar, remover e ativar/desativar produtos
- Aba "Monte o seu prato" com combinacoes personalizadas

---

## Autenticacao da Area Administrativa

### Como funciona

O projeto agora depende de um backend em **Node.js + Express** para proteger a area administrativa com autenticacao real.

Com isso:

- a pagina publica continua acessivel normalmente
- a rota `/admin` fica protegida
- usuarios nao autenticados sao redirecionados para `/login`
- o login cria uma sessao com **JWT em cookie httpOnly**
- criar, editar e excluir produtos so funciona com sessao valida

### Importante sobre o Live Server

O **Live Server nao funciona sozinho** para esse projeto depois da autenticacao.

Isso acontece porque ele serve apenas arquivos estaticos e nao executa o backend. Sem o backend, o frontend nao consegue acessar as rotas:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

Por isso aparece o erro de inicializacao.

### Como executar corretamente

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo `.env` com base no modelo:

```powershell
Copy-Item .env.example .env
```

3. Inicie o servidor:

```bash
npm run dev
```

4. Abra no navegador:

```text
http://localhost:3000
```

### Versao no Netlify

O projeto agora inclui configuracao para deploy estatico no Netlify:

- `netlify.toml` faz o build publicar a raiz do projeto
- todas as rotas sao redirecionadas para `index.html`
- as telas `/`, `/login` e `/admin` continuam funcionando como SPA
- quando a API local nao esta disponivel, o frontend usa `localStorage` para produtos e sessao administrativa

Isso permite publicar o cardapio no Netlify sem depender do `server.js`.

### Login padrao

Credenciais padrao do arquivo `.env.example`:

- Usuario/E-mail: `admin@anossa.com`
- Senha: `admin123`

Voce pode alterar no `.env`:

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `JWT_SECRET`
- `PORT`

### Fluxo de acesso

1. O usuario clica no botao `Admin`
2. Se nao estiver autenticado, vai para `/login`
3. Ao informar credenciais validas, e redirecionado para `/admin`
4. O backend grava o token em cookie `httpOnly`
5. Ao atualizar a pagina, o frontend consulta `/api/auth/me`
6. Se a sessao ainda for valida, o acesso continua liberado
7. Ao clicar em `Sair`, a sessao e encerrada

### Rotas principais

- `GET /` -> cardapio publico
- `GET /login` -> tela de login
- `GET /admin` -> painel administrativo protegido
- `POST /api/auth/login` -> autenticacao
- `POST /api/auth/logout` -> logout
- `GET /api/auth/me` -> valida a sessao atual
- `GET /api/products` -> lista os produtos
- `POST /api/products` -> cria produto autenticado
- `PUT /api/products/:id` -> edita produto autenticado
- `DELETE /api/products/:id` -> remove produto autenticado

### Seguranca aplicada

- protecao real da rota `/admin`
- token fora do `localStorage`
- cookie `httpOnly`
- sessao persistida entre recarregamentos
- mensagens de erro para credenciais invalidas
- bloqueio do CRUD administrativo sem autenticacao

### Observacao

Essas credenciais sao apenas de exemplo para desenvolvimento.
Em producao, o ideal e trocar a senha, alterar o `JWT_SECRET`, usar HTTPS e armazenar usuarios em banco de dados.
