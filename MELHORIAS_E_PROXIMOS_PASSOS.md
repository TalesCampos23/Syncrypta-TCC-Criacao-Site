> Para a nova visita aos três planos e a atualização sem perda de dados, leia primeiro `COMO_ABRIR_E_ATUALIZAR.md`.

# Melhorias do feedback e instruções de uso

## O que foi implementado

- A tela de **Perfis financeiros** e suas operações de criação, alteração e exclusão exigem a conta master designada. Essa restrição é verificada na API, não apenas no menu.
- Na lista de perfis, o botão de cadeado cria uma conta de leitura para **um único perfil** usando e-mail e senha inicial de pelo menos 12 caracteres. O cliente vê apenas seu perfil no dashboard, nos relatórios e nas movimentações. Tentativas de usar o ID de outro cliente no endereço da API são ignoradas; escritas são recusadas. Excluir o perfil revoga os acessos vinculados.
- Os gráficos podem filtrar por classificação e categoria. O gráfico de categorias, os meses e as linhas da tabela do relatório abrem detalhes dos lançamentos do recorte selecionado.
- O relatório mensal filtra a tabela por tipo, intervalo de datas, descrição, categoria e classificação. Exportações CSV e Excel usam a seleção de linhas filtradas.
- A visão geral mostra calendário mensal em modos **Realizado** e **Previsão**. Pressione e arraste para escolher dias; toque em um dia para abrir detalhes. A previsão distribui a projeção mensal por igual: é uma estimativa ilustrativa, não uma agenda de vencimentos reais.
- Os saldos favoráveis e desfavoráveis recebem verde e vermelho de maior contraste; a interface foi ajustada para reduzir cortes em telas estreitas. Tabelas extensas têm rolagem horizontal dentro da própria tabela.
- Lançamentos em USD preservam o valor original e entram nos totais convertidos em BRL pela cotação registrada. A opção **Buscar PTAX** consulta o Banco Central para uma data disponível; a cotação também pode ser informada manualmente. Confira a taxa antes de salvar. O conversor isolado do dashboard continua sendo só uma simulação.
- A carteira do dashboard da conta master agora usa perfis e saldos reais da conta, substituindo os nomes e números fixos da seção.
- Login Google e cópia privada no Drive podem ser ativados com credenciais OAuth; só o master vinculado tem acesso integral, e contas de clientes ficam restritas ao perfil autorizado. Consulte a configuração em `COMO_ABRIR_E_ATUALIZAR.md`.
- Contas novas também podem ser criadas pelo Google quando o OAuth estiver configurado. Elas começam no plano Básico sem dados; nenhuma senha externa é recebida pela Syncrypta.

## Como abrir no computador

1. Faça uma cópia da pasta e mantenha `backend/*.json` se já houver dados importantes. O script `1_PREPARAR_DEMO.bat` executa `npm run seed` e **substitui os dados** por dados fictícios; use apenas em uma cópia de demonstração.
2. Instale Node.js, abra o terminal na pasta `backend` e execute `npm install` e `npm start`.
3. Abra `login.html` com Live Server. Na mesma rede, o frontend usa o hostname do computador na porta 3000. Para publicar, configure um endereço HTTPS para a API no início de `script.js` e hospede também os arquivos HTML/CSS/JS.
4. Para demonstrar, use os dados fictícios descritos em `README.md`. A conta master de demonstração **não identifica a Taís de verdade**; as credenciais do projeto original eram públicas.

## Para vincular a conta master à titular antes da publicação

1. Confirme diretamente com a Taís o e-mail a ser usado e defina com ela uma senha nova e privada; não reutilize as credenciais de demonstração.
2. Gere um hash bcrypt localmente na pasta `backend`, por exemplo: `node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" "SENHA_NOVA_PRIVADA"`. Evite deixar a senha no histórico do terminal em uma implantação real; um prompt seguro é preferível.
3. Configure `NODE_ENV=production`, `MASTER_USER_ID=900001`, `MASTER_EMAIL` com o endereço confirmado, `MASTER_PASSWORD_HASH` com esse hash e `JWT_SECRET` aleatório com pelo menos 32 caracteres. Não compartilhe `.env` nem credenciais. O servidor se recusa a iniciar em produção se faltarem essas variáveis ou se o e-mail master continuar usando o domínio `.local`.
4. Não execute novamente o seed em uma instalação com dados reais. Use HTTPS e um servidor de dados com backup antes de operar com informações financeiras reais. O backend atual persiste dados em arquivos JSON locais e é uma versão de TCC.

## Pendências que exigem infraestrutura/credenciais

- **Ativação do Google:** crie o projeto OAuth e registre as URLs, credenciais e consentimento da titular. O código da integração está pronto para configuração, mas não há conta real conectada nesta entrega. O Drive recebe cópias; os arquivos JSON continuam sendo a origem dos dados.
- **Cotação:** a consulta PTAX pode ficar indisponível; em tal caso informe uma cotação manual e verifique a fonte. O resultado depende do dia útil de referência.
- **Identidade da titular:** só o e-mail confirmado e a senha privada ativados em produção permitem afirmar que a conta master pertence a ela. O nome no cadastro não prova identidade.
- **Mobile em um dispositivo real:** a API local no `127.0.0.1` do computador não é acessível do celular; publique a API com HTTPS e atualize `API_URL` para uso fora do computador.
