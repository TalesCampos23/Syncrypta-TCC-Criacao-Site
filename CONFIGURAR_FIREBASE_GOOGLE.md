# Login Google por Firebase no Syncrypta

Esta opção mostra a janela de escolha de conta Google no computador. No celular, o Firebase pode redirecionar à página Google e voltar. Cada pessoa escolhe sua própria conta; o aplicativo Syncrypta é configurado **uma vez**.

## 1. Configurar o projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/), crie um projeto (ou adicione Firebase ao projeto Google Cloud existente) e registre um **aplicativo Web**.
2. Em **Authentication → Método de login**, habilite **Google** e escolha o e-mail de suporte.
3. Em **Authentication → Configurações → Domínios autorizados**, inclua o hostname exato usado para abrir o site no navegador, por exemplo `localhost` e, se usar Live Server com outro hostname, `127.0.0.1`. Para publicar, autorize também o domínio público do site.

## 2. Preencher os dois arquivos locais

No arquivo `firebase-config.js`, copie do console o objeto de configuração do **aplicativo Web**: `apiKey`, `authDomain`, `projectId` e `appId`. São identificadores públicos do projeto; **não cole senha, chave de conta de serviço, Google Client Secret nem JWT_SECRET nesse arquivo**.

No arquivo privado `backend/.env`, coloque o mesmo `projectId` do arquivo anterior:

```text
FIREBASE_PROJECT_ID=seu-project-id
```

Se você já usa e-mail/senha, Google OAuth antigo ou cópia do Drive, preserve as outras linhas do seu `.env`. O Firebase configura o **login Google dos usuários**; o backup no Drive continua usando a integração OAuth anterior.

## 3. Abrir e conferir

1. Reinicie o backend: na pasta `backend`, execute `npm.cmd install` e `npm.cmd start`. Acesse `http://localhost:3000/api/firebase/config`: deverá mostrar `"habilitado":true` e o `projectId` esperado.
2. No Live Server abra `http://localhost:5500/login.html` e clique em **Continuar com Google**. Escolha uma conta na janela do Google. O primeiro acesso cria um usuário Básico vazio; os próximos abrem a mesma conta.
3. Ao copiar uma instalação anterior, siga `COMO_ABRIR_E_ATUALIZAR.md` para preservar `backend/.env` e os arquivos JSON de dados; mantenha `FIREBASE_PROJECT_ID` no novo `.env`.

Se o botão ficar desabilitado, confira se os quatro campos de `firebase-config.js` foram preenchidos e se o `projectId` é idêntico no `.env`. Se aparecer erro de domínio não autorizado, volte às configurações do Firebase e adicione o hostname da página.

**Contas existentes:** uma conta local criada com e-mail e senha não ganha acesso pelo Google apenas porque o endereço coincide. Contas já vinculadas ao OAuth Google anterior podem ser reconhecidas pela identidade Google confirmada. A conta master da Taís exige vínculo prévio à identidade dela; novos logins Firebase nunca recebem privilégios master.

**Para abrir ao público:** hospede o frontend e o backend em HTTPS, configure o domínio no Firebase e adapte a URL da API no início de `script.js`. Não compartilhe o `.env` nem use a senha master de demonstração como senha real.

Referências: [Login Google no Firebase](https://firebase.google.com/docs/auth/web/google-signin), [validar tokens no backend](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [configuração pública do projeto](https://firebase.google.com/docs/projects/api-keys).
