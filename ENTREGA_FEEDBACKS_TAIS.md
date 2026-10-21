# Entrega de demonstração · feedbacks da Taís · Syncrypta 4.7.1

Este arquivo acompanha o código da entrega. Abra `COMO_ABRIR_E_ATUALIZAR.md` para instalar sem perder seus dados.

| Solicitação | Entrega verificável | Condição |
| --- | --- | --- |
| Navegação bonita e funcional mantendo as cores | Layout reorganizado, tema no topo, menu do perfil, sino com avisos calculados, três planos demonstrativos; conta master mostra “Acesso completo” sem opção de trocar plano | Incluído |
| Funcionar em web e mobile sem cortar seções | Regras responsivas, tabelas roláveis, formulários e calendário em colunas flexíveis | CSS implementado; conferir visualmente em aparelho real |
| Filtro por classificação e categoria em gráficos com detalhes | Dois filtros nos gráficos, abertura de mês e categoria com lançamentos do recorte | Incluído |
| Valores favoráveis e desfavoráveis com contraste | Verde/vermelho nos valores, calendários e resultados | Incluído |
| Perfis financeiros só para Taís; PF/PJ isolados | Master cria perfis e acessos; API força o perfil autorizado e bloqueia escrita de cliente | Incluído; identidade real precisa ser configurada |
| Seleção de dias reais e previsão no calendário | Arrastar/teclado em realizado; escolha de mês futuro em previsão | Incluído; datas futuras distribuídas como estimativa mensal |
| Filtros em movimentações do relatório | Tipo, início, fim, descrição, categoria e classificação; exportações usam recorte | Incluído |
| Converter dólar para real em PF/PJ | Cadastro USD com taxa, histórico original USD e total BRL; consulta opcional PTAX | Incluído; fonte externa depende da disponibilidade do BCB |
| Google: conta master, clientes próprios, salvar alterações | Login Firebase de usuário comum; OAuth separado e configurável para vincular a conta master e salvar cópias privadas no Drive; clientes vinculados a um só perfil | Login Firebase foi confirmado pelo usuário em ambiente local; Drive e vínculo da titular ainda exigem credenciais, consentimento e teste real. Backup não é sincronização bidirecional. |
| Reclassificação em lote | Modal e operação no backend com verificação de propriedade | Incluído |
| Login Google em um clique para usuários comuns | Firebase abre seletor Google no computador; primeiro acesso cria conta Básica vazia; próximos preservam o perfil | Usuário confirmou login Google em ambiente local; cada implantação exige configurar Firebase |
| Duas formas de acesso da Taís | Login local com senha privada e Google vinculado à mesma identidade master | Exige confirmação do e-mail real e vínculo depois de entrar com senha |

A demonstração é pública e apenas de leitura, com dados fictícios. O login da conta master presente no ZIP é de **exemplo**; não representa a identidade da Taís e não deve ser usado em produção. O backup do Google salva cópias, mas não restaura dados automaticamente.

## Verificação executada

- `node --check` nos scripts de frontend, backend e integração Google.
- `tests/smoke.js`: três planos, isolamento de dois clientes, rotas master, filtros, USD→BRL e reclassificação.
- `tests/google-smoke.js`: provedor simulado com ID token assinado, vínculo master, backup e login.
- `tests/firebase-smoke.js`: token Firebase assinado simulado, cadastro Básico, continuidade da conta e bloqueios de acesso master.
- Conferência de IDs únicos nas páginas HTML.

**O usuário confirmou login Google real em seu computador.** Não houve teste visual desta entrega em aparelho físico. O Drive, a conta Google real da Taís e a publicação ao público permanecem sem validação real.

## Atualização a partir da pasta anterior

O ZIP de entrega omite intencionalmente `backend/.env`, `backend/node_modules` e dados pessoais adicionados durante os testes. Copie o `backend/.env` e, se quiser conservar as contas e lançamentos, os sete arquivos JSON de dados da sua pasta atual com o backend parado. Não execute `npm run seed` sobre seus dados existentes. Rode `npm.cmd install` na pasta `backend` da nova versão.
