# Syncrypta: feedbacks da Taís + cadastro com Google

## Abrir uma instalação nova no Windows

1. Extraia o ZIP **em uma pasta nova**.
2. Na pasta `Syncrypta-TCC-Criacao-Site-main`, dê dois cliques em `INSTALAR_E_INICIAR.bat`. Esse arquivo instala as dependências com `npm.cmd install --no-audit --no-fund` e inicia a API, sem recriar seus dados.
3. Mantenha o terminal aberto. Abra `login.html` com Live Server (ou o `index.html` e clique em **Entrar**).
4. Na área **Explore do seu jeito**, escolha Básico, Profissional ou Empresarial. É um acesso público fictício, só de leitura. O plano fica no token da visita; uma pessoa não altera a escolha de outra.
5. No canto superior direito, toque no avatar. Contas comuns e demonstração podem ver planos; o master da Taís mostra **Acesso completo** e apenas **Sair da conta**. O botão de tema fica fora do perfil, à esquerda do sino.

Se preferir PowerShell, entre na pasta `backend` e rode `npm.cmd install --no-audit --no-fund` seguido de `npm.cmd start`.

**Erro `Cannot find module 'express'`?** Falta instalar as dependências na pasta do backend. No PowerShell execute:

```powershell
cd backend
npm.cmd install --no-audit --no-fund
npm.cmd start
```

Não inclua `node_modules` no ZIP; o instalador prepara as dependências em cada computador.

## Atualizar sua instalação anterior sem perder dados

1. Extraia o ZIP novo em **outra pasta**. Faça uma cópia de segurança da pasta antiga `backend` antes de mexer.
2. Com o backend antigo parado, copie da pasta `backend` antiga para a nova apenas seus dados: `usuarios.json`, `clientes.json`, `movimentacoes.json`, `pagamentos.json`, `auditoria.json`, `regras.json` e `saldos.json`. Assim, a conta Google criada na versão anterior e seus lançamentos permanecem acessíveis. Não copie `package.json`, `package-lock.json` ou `demo-sample.json`.
3. Copie também o arquivo `backend/.env` da instalação antiga para a nova, sem divulgar suas credenciais. Copie o `firebase-config.js` configurado da pasta antiga se quiser manter o login Google ativo. Se vinculou o Drive, copie `backend/.google-private.json` para preservar a conexão privada. Não inclua `.env` nem `.google-private.json` em ZIPs compartilhados.
4. No PowerShell dentro da pasta `backend` nova, rode `node atualizar-demo.js`. O script acrescenta apenas a conta e os lançamentos fictícios da visita; executá-lo de novo não duplica registros.
5. Execute `npm.cmd install --no-audit --no-fund` e `npm.cmd start` na pasta `backend` nova.

**Não use `npm run seed` para atualizar.** Ele substitui os dados locais por dados fictícios. O acesso por Facebook foi retirado; uma conta criada exclusivamente por Facebook precisa de outra forma de autenticação antes de migrar. A conta master de exemplo do ZIP não é uma identidade real da Taís; antes de publicar, siga `MELHORIAS_E_PROXIMOS_PASSOS.md` para configurar as credenciais privadas dela.

## O que foi alterado

- Cores originais preservadas em `style.css`. `interface-upgrade.css` reorganiza cabeçalho, menu do perfil, notificações e telas pequenas; os gráficos do painel ganharam apresentação escura azul/ciano, sem trocar as cores do restante do site.
- Indicadores e gráficos do painel usam lançamentos do contexto selecionado. Clique em um mês para ver movimentos, ou em uma categoria para abrir os detalhes. Removemos números e insights fixos.
- Avisos vêm de `/api/notificacoes`, calculados no servidor com os filtros e permissões de cada conta; não há aviso promocional simulando evento financeiro. O sino conta avisos novos neste navegador.
- Entrada demonstrativa com três escolhas na tela de login e amostras separadas de pessoa física e loja fictícia.
- API restringe a visita a consultas. Perfis master, movimentações da conta antiga e os dados de clientes continuam separados por ID de usuário.
- `INSTALAR_E_INICIAR.bat` instala as dependências antes de iniciar. `atualizar-demo.js` permite incorporar os novos exemplos a uma instalação anterior.

## Feedbacks incorporados nesta edição

| Pedido | Onde experimentar |
| --- | --- |
| Filtros por classificação e categoria nos gráficos, com abertura detalhada | Dashboard, filtros acima dos gráficos; clique na barra ou no mês |
| Receitas verdes, despesas vermelhas e contraste melhor | Dashboard, relatórios, calendário e movimentações |
| Perfis financeiros só no master e cliente isolado ao seu PF/PJ | Área de perfis da conta master; acesso individual criado em cada perfil |
| Calendário selecionável: realizado e previsão | Dashboard: arraste pelos dias, ou use teclado; em previsão escolha o mês futuro |
| Filtros de tipo, datas, descrição, categoria e classificação | Relatórios → Movimentações do período; CSV e Excel usam a mesma seleção |
| Dólar para real no PF/PJ | Novo lançamento → escolha USD e cotação; os totais permanecem em BRL, com USD original visível nos detalhes |
| Google para login e cópia das alterações no Drive | Configuração abaixo; após vincular o master, use o painel Conta Google |
| Google para usuário comum | Um clique em Continuar com Google cria a conta Básica vazia na primeira visita; nas demais mantém os próprios dados |
| Layout mobile | Tabelas roláveis, calendário, menus, formulários e gráficos adaptados a larguras pequenas |
| Três planos demonstrativos | Login → Básico, Profissional, Empresarial (dados fictícios em modo de leitura) |

Os dados da demonstração são fictícios. A previsão distribui uma estimativa mensal por dia, sem supor datas futuras de vencimento. O botão PTAX busca uma cotação histórica do Banco Central quando a API está disponível; você pode informar uma cotação manual. Confirme sempre a taxa antes de salvar.

## Entrar com Google em um clique

1. Configure o aplicativo Google **uma vez para o Syncrypta**. Para a janela de escolha de conta como no exemplo enviado, siga `CONFIGURAR_FIREBASE_GOOGLE.md`. O login OAuth anterior continua como alternativa. Cada pessoa usa a própria conta Google, sem criar credenciais de desenvolvedor nem informar a senha Google ao Syncrypta. Sem nenhuma das integrações configurada, o botão permanece desabilitado.
2. Abra `login.html` e clique em **Continuar com Google**. Escolha uma conta na página do Google. Na primeira visita, o Syncrypta cria automaticamente um usuário comum com plano Básico, sem lançamentos nem saldos; nas visitas seguintes, a mesma conta abre o mesmo perfil.
3. Se já existir uma conta Syncrypta com aquele e-mail e ainda sem vínculo Google, entre primeiro com a senha Syncrypta e vincule o Google no painel. Coincidência de e-mail não libera a conta master nem os dados de outro cliente.

O seletor de contas é exibido pelo Google; Firebase usa uma janela no computador e pode redirecionar em celulares. O OAuth antigo redireciona na própria aba. Uma pessoa fora do seu computador precisa de frontend e backend hospedados em endereços públicos HTTPS. Se o projeto OAuth antigo estiver em **Testando** e usar escopos adicionais, como Drive, o acesso pode depender da lista de usuários de teste. [Estados do aplicativo OAuth](https://developers.google.com/identity/protocols/oauth2/production-readiness/overview).

**Senhas externas:** o aplicativo nunca recebe nem armazena a senha da conta Google. Ele confere uma resposta de autenticação do provedor e registra o ID da conta vinculada. No login local, a senha da Syncrypta é armazenada como hash bcrypt; ela é diferente da senha externa.

## Configurar a conta Google antiga e o backup no Drive

O ZIP **não contém credenciais Google ou o e-mail verdadeiro da Taís**. Para ligar o login Google e salvar cópias privadas no Drive:

1. Confirme com a Taís qual será o e-mail dela. No backend, configure a identidade master real (`MASTER_EMAIL`, `MASTER_PASSWORD_HASH`, `MASTER_USER_ID`, `JWT_SECRET`) antes de publicar. Nunca divulgue a senha nem use o login de exemplo como acesso real.
2. No Google Cloud Console, configure a tela de consentimento OAuth. Crie um cliente OAuth do tipo **Aplicativo da Web** e registre exatamente o URI de redirecionamento do backend, por exemplo `http://localhost:3000/api/google/callback` para desenvolvimento. Ative a API Google Drive; adicione os escopos `openid`, `email`, `profile` e `https://www.googleapis.com/auth/drive.appdata`. Para testes com app não publicado, adicione a conta master entre os usuários de teste.
3. Copie `backend/.env.example` para `backend/.env` e preencha `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` e `FRONTEND_URL` com os endereços reais. **Use no `FRONTEND_URL` exatamente o mesmo hostname do navegador:** `http://localhost:5500` e `http://127.0.0.1:5500` não compartilham sessão. Guarde `.env` somente no servidor. Ao publicar, use HTTPS para frontend e backend e ajuste `API_URL` no começo de `script.js` conforme a hospedagem.
4. Para a Taís, **primeiro confirme o e-mail real e configure uma senha privada da Syncrypta** na conta master. Entre com essa senha e, em **Conta Google**, clique em **Vincular Google e Drive**, aprovando o acesso pela mesma conta Google real. Depois, ela pode entrar por senha *ou* pelo Google vinculado, ambos na mesma conta master. Um e-mail igual sozinho não concede acesso master.
5. Para um cliente vinculado a PF/PJ, crie antes o acesso individual pela conta master. O cliente entra com a senha inicial e usa **Vincular meu Google** no próprio painel. Nas próximas visitas poderá usar o Google; continuará vendo apenas seu perfil, em modo de leitura.

O backup contém os clientes, lançamentos, saldos e regras da conta master; **não inclui senhas**. O refresh token fica no arquivo privado `backend/.google-private.json`, fora do ZIP e do Git. O backup é **unidirecional**: esta edição não restaura dados do Drive nem sincroniza alterações feitas fora da Syncrypta. Sem credenciais OAuth, o Drive fica desabilitado; o login dos usuários pode usar Firebase separadamente.

**Atenção para apresentação:** o login `thais.demo@syncrypta.local` e sua senha conhecida são só demonstração. Quando configurar o e-mail verdadeiro da Taís em produção, esse endereço de exemplo será substituído pela conta master real, que deverá usar uma senha privada. O Google dessa mesma conta precisa ser vinculado após o login local. Não vincule uma conta real à senha de demonstração publicada.

## Conferência antes de apresentar

1. Entre em cada plano demonstrativo e confira gráficos, filtros e troca de tema no topo.
2. Entre na conta master *real configurada* e crie dois perfis. Gere acessos individuais e verifique que cada cliente só vê o próprio histórico mesmo ao alterar o ID na URL da API.
3. Crie uma movimentação de USD 10 com cotação 5,00: o dashboard deve adicionar BRL 50,00 e mostrar USD 10,00 como original.
4. Em relatórios, escolha tipo/categoria/data; confira a tabela e exporte CSV. No calendário, selecione dias de realizado e um mês de previsão.
5. Se configurou Google, vincule, salve no Drive e confira a data da última cópia. Não apresente essa integração como já conectada à conta da Taís enquanto a autenticação real não for configurada.

Para abrir no celular na mesma rede Wi-Fi, inicie o backend no computador e o Live Server em um endereço acessível pela rede (por exemplo, `http://IP-DO-COMPUTADOR:5500/login.html`). O frontend usa automaticamente esse mesmo IP na porta 3000 para acessar a API; libere as portas na rede/firewall se necessário. Para publicar fora da rede local, hospede a API em HTTPS e configure sua URL no início de `script.js`.
