# Publicar a Syncrypta online, de graça (Render)

Resultado: um endereço público, por exemplo **https://syncrypta.onrender.com**, que abre o site e a API juntos.
Qualquer pessoa com o link (a Thaís, a banca) usa pelo navegador, sem instalar nada.

## Como fica a demonstração online

- **Endereço grátis:** `https://<nome-do-serviço>.onrender.com`. Se o nome `syncrypta` já estiver em uso, o Render acrescenta letras no final.
- **Dados sempre fictícios e "limpos":** a cada vez que o serviço liga, ele recria os dados de demonstração (`npm run start:demo`), com datas do mês atual.
  O que alguém cadastrar online **some** quando o serviço reinicia. Isso é bom para demonstração, mas não sirva dados reais por aqui.
- **Ele "dorme":** no plano grátis, depois de 15 minutos sem visitas o servidor desliga e leva cerca de 1 minuto para acordar no próximo acesso.
  **Antes de uma apresentação, abra o link uns 2 minutos antes.**
- **Limite:** 750 horas grátis por mês na conta, o que dá para um serviço ligado o mês inteiro.

## Passo a passo (uma vez só)

1. **Suba o código atualizado no GitHub** (repositório `TalesCampos23/Syncrypta-TCC-Criacao-Site`, branch `main`),
   com o arquivo `render.yaml` na raiz, junto do `index.html`.
   Confira que o `.env` **não** foi enviado (o `.gitignore` já impede).
2. Entre em **https://render.com** e clique em **Get Started**. Faça login com a conta do GitHub dona do repositório.
3. No painel, clique em **New → Blueprint** e escolha o repositório `Syncrypta-TCC-Criacao-Site`.
4. O Render lê o `render.yaml` e mostra o serviço **syncrypta** (plano Free). Clique em **Apply** / **Deploy Blueprint**.
5. Espere o primeiro deploy (3 a 5 minutos). Quando aparecer **Live**, clique no endereço `...onrender.com` no topo.
6. Teste: entre com `thais.demo@syncrypta.local` / `Syncrypta@2026`.

Depois disso, **todo `git push` na branch `main` publica sozinho** a nova versão.

### Se preferir configurar à mão (sem Blueprint)

New → **Web Service** → escolha o repositório e preencha:

| Campo | Valor |
|---|---|
| Runtime / Language | Node |
| Build Command | `cd backend && npm install --no-audit --no-fund` |
| Start Command | `cd backend && npm run start:demo` |
| Instance Type | Free |
| Environment Variables | `DEMO_PUBLICO` = `true` · `JWT_SECRET` = uma sequência aleatória com 40+ caracteres · `FIREBASE_PROJECT_ID` = `syncrypta-firebase` |

## Login com Google no site publicado (opcional)

O botão "Continuar com Google" usa o Firebase do projeto (`syncrypta-firebase`). Para funcionar no novo endereço:
Console do Firebase → **Authentication → Settings → Authorized domains → Add domain** → cole `syncrypta.onrender.com` (o seu endereço, sem `https://`).
O login por e-mail e senha funciona sem isso.

## Domínio próprio (.com.br)

O endereço `.onrender.com` é grátis e suficiente para o TCC. Um domínio próprio como `syncrypta.com.br` **não é gratuito**:
precisa ser registrado no Registro.br, com anuidade paga. Se um dia comprarem, o Render aceita domínio próprio no plano grátis
(Settings → Custom Domains).

## O que foi mudado no código para funcionar online

- `backend/server.js`: o mesmo servidor entrega as páginas e a API. Só os arquivos do site são públicos:
  a pasta `backend` (dados e `.env`), os testes e os `.md` **não** podem ser baixados.
- `backend/server.js`: `trust proxy` (o Render fica na frente do servidor; sem isso o limite de login trataria todo mundo como uma pessoa só)
  e uma política de segurança de conteúdo (CSP) que só aceita scripts do próprio site e do Firebase.
- `backend/server.js`: com `DEMO_PUBLICO=true`, o servidor não liga sem uma chave `JWT_SECRET` própria.
- `script.js`: a API é procurada no mesmo endereço do site. No computador, com o Live Server, continua usando a porta 3000.
- `index.html`: o pequeno script do menu de celular foi para o `script.js` (exigência da CSP).
- `backend/package.json`: novo comando `npm run start:demo`. **Não use no seu computador se tiver dados que queira manter**:
  ele apaga e recria os dados de demonstração.

## No computador, continua igual

`cd backend` → `npm.cmd start` → abra o site pelo Live Server. Agora também dá para abrir direto em **http://localhost:3000**.
