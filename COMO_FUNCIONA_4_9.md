# Como funcionam as novidades da 4.9 até a 4.14

Explicação de cada parte nova, arquivo por arquivo, para conseguir explicar o código na banca.

## Onde está cada coisa

| Novidade | Arquivos | O que mudou nos arquivos antigos |
|---|---|---|
| Consulta de CNPJ | `cnpj.js` (tela) e `backend/server.js` (rota `/api/cnpj/:cnpj`) | Botão em `clientes.html` e em `movimentacoes.html` |
| Central de Ajuda | `ajuda.html` e `ajuda-conteudo.js` | Link "Ajuda" no menu lateral e no topo da página inicial |
| Tour de primeiro acesso | `tour.js` | `script.js` chama o tour depois de carregar a Visão geral |
| Seção da campanha | trecho `id="campanha"` no `index.html` e `campanha.js` | Pasta `videos/` liberada no `server.js` |
| Assistente (helperbot) | `helperbot.js` | Incluído em todas as páginas |
| Assistente com IA (4.10) | `backend/assistente.js` e `backend/.env.exemplo` | `server.js` carrega o módulo; `render.yaml` ganhou `GEMINI_API_KEY` |
| Visual de tudo | `novidades-4-9.css` | Carregado depois do `ajustes-finais.css` |

## 1. Consulta de CNPJ (a API)

**O que faz:** a pessoa digita só o CNPJ e a Syncrypta preenche o nome da empresa, a atividade e outros dados.

**Caminho da informação:**

1. Na tela, `cnpj.js` abre o modal e coloca a máscara `00.000.000/0000-00` enquanto a pessoa digita.
2. Ao clicar em Buscar, o navegador chama o **nosso** backend: `GET /api/cnpj/11222333000181`, com o token de login.
3. O backend (`server.js` + `backend/cnpj.js`):
   - confere os **dois dígitos verificadores** do CNPJ (função `cnpjValido`). Se estiver errado, responde 400 e nem chama a API de fora;
   - consulta a **BrasilAPI** (`https://brasilapi.com.br/api/cnpj/v1/{cnpj}`), que usa os dados públicos da Receita Federal;
   - **(4.11) serviço reserva:** se a BrasilAPI der erro, demorar mais de 7 segundos ou bloquear, tenta a **Minha Receita** (mesmo formato) e depois o **CNPJ.ws** (formato diferente, convertido pela função `lerFormatoCnpjWs`). Só responde "não encontrado" se todos os que responderam disserem que o CNPJ não existe;
   - devolve **só** nome, atividade, cidade, situação, abertura e porte.
4. A tela mostra o cartão da empresa. O botão "Usar no perfil" preenche o formulário.

**Escolhas para explicar na banca:**

- **Por que o backend consulta, e não o navegador?** Assim o navegador só conversa com a Syncrypta. Também dá para filtrar os dados, guardar em cache e limitar o número de consultas. É o mesmo jeito da cotação do dólar (PTAX), que já existia.
- **LGPD:** a resposta da BrasilAPI traz sócios, e-mail e telefone. O backend joga isso fora. O CNPJ também não é salvo, porque a versão 4.0 tinha tirado CPF e CNPJ dos perfis de propósito.
- **Cache de 24 horas:** consultar o mesmo CNPJ de novo não gasta outra chamada.
- **Limite de 30 consultas a cada 15 minutos:** feito com `express-rate-limit`, que já era usado no login.
- **Se todos os serviços falharem:** aparece "Os serviços de consulta de CNPJ não responderam agora… preencha à mão". O terminal do servidor mostra o que cada um respondeu.
- **Diagnóstico:** na pasta `backend`, rode `node testar-cnpj.js 19131243000197`. Ele testa cada serviço direto do computador e mostra se respondeu, o tempo e o erro. Se nenhum responder, o problema é a internet ou a rede (redes de escola às vezes bloqueiam).

**Teste:** `node tests/cnpj-smoke.js`. Ele sobe uma BrasilAPI falsa no computador, então funciona sem internet. Confere:
- que a consulta exige login;
- os dígitos do CNPJ;
- que sócios, e-mail e telefone não saem do backend;
- o cache;
- a resposta para CNPJ não encontrado.

## 2. Central de Ajuda

- **Uma lista só de perguntas:** todas as perguntas e respostas ficam em `AJUDA_PERGUNTAS`, em `ajuda-conteudo.js`. Cada uma tem `id`, `grupo`, `pergunta`, `resposta`, `palavras` e `links`. As perguntas que vieram da caixinha dos Stories têm `stories: true`.
- **Dois usos para a mesma lista:** `ajuda.html` mostra todas as perguntas, e o assistente procura nelas. Mudou uma resposta, muda nos dois lugares.
- **Busca:** esconde as perguntas que não têm a palavra digitada. Ela ignora acentos, então "dolar" acha "dólar".
- **Link direto para uma pergunta:** `ajuda.html#pix-pessoal` abre a pergunta e destaca a resposta. Esse é o link para colocar no Stories.

## 3. Tour de primeiro acesso

- **Quando aparece:** só para conta nova (`perfil: 'usuario'`), sem movimentações, que ainda não viu o tour. Quem decide é a função `talvezIniciarTour`.
- **Como lembra que já foi visto:** "Pular" ou "Concluir" grava `syncrypta_tour_visto_<id da conta>` no `localStorage`.
- **Os passos:** ficam na lista `PASSOS_TOUR`. Cada passo tem `alvo`, um seletor CSS de onde a luz aparece, além de título e texto.
- **Como a luz funciona:** uma caixa transparente fica em cima do alvo, com uma sombra gigante (`box-shadow: 0 0 0 9999px`) que escurece o resto da tela. O cartão é posicionado ao lado sem sair da tela.
- **No celular:** o menu lateral fica escondido, então o passo aparece sem destaque, com o cartão embaixo.
- **Teclado:** Esc fecha, e as setas avançam e voltam.

## 4. Seção da campanha

- **O player:** um `<video>` com `preload="none"`, então o vídeo só baixa quando a pessoa clica no play. Isso deixa a página leve.
- **Os botões embaixo:** em `campanha.js`, trocam o vídeo e a imagem de capa.
- **Os arquivos:** os vídeos ficam em `videos/`, e o `server.js` passou a entregar essa pasta.
- **Para a banca:** os dois vídeos foram feitos com IA (animação e trilha geradas por código). Os valores que aparecem na tela são ilustrativos.

## 5. Assistente (helperbot): as regras

O assistente tem duas camadas. A primeira são **regras**, que sempre funcionam, com ou sem IA. A função `responderHelperbot` testa, nesta ordem:

1. **Tem 14 números?** Então é um CNPJ e ele consulta a API (só para quem está logado).
2. **Falou "sobrou", "saldo" ou "meu mês"?** Logado, ele chama `/api/dashboard` do mês atual e mostra entrou, saiu e sobrou.
3. **Falou "tour" ou "passo a passo"?** Ele oferece abrir o tour.
4. **Oi, obrigado ou atendente:** respostas curtas.
5. **Nenhum dos casos acima:** se a IA está ligada, a pergunta vai para ela (parte 6). Se não está, ou se ela falhar, ele dá pontos para cada pergunta da Central de Ajuda e devolve a que mais combina. Uma palavra-chave vale 2 pontos (3 se tiver mais de uma palavra), e uma palavra da própria pergunta vale 1 ponto.

A conversa fica no `sessionStorage`, então continua ao trocar de página e some quando a aba fecha.

## 6. Assistente com IA (4.10)

**O que faz:** as perguntas abertas, como "como organizo meu caixa sendo autônomo?", são respondidas por uma IA de forma natural.

**Caminho da pergunta:**

1. Ao abrir, o balão chama `GET /api/assistente/status`. Se a IA estiver ligada, o subtítulo vira "Com IA · pode errar, confira na Ajuda".
2. A pergunta vai para o **nosso** backend: `POST /api/assistente`, com a mensagem e as últimas mensagens da conversa.
3. O backend (`backend/assistente.js`):
   - apaga números longos da pergunta, como CPF e cartão (`[número removido]`);
   - confere os limites: 20 perguntas a cada 15 minutos por pessoa e 300 por dia no site todo;
   - monta as **instruções** da IA: as regras (responder curto, em português, só sobre a Syncrypta e finanças, sem orientação de imposto, sem pedir senha) + **todas as perguntas e respostas da Central de Ajuda**, lidas do mesmo `ajuda-conteudo.js` que o site usa;
   - manda tudo para o provedor (Gemini ou Claude) e devolve só o texto da resposta.
4. Na tela, a resposta aparece com o selo **"Resposta gerada por IA"** e, quando dá, o link "Saiba mais" para a pergunta da Ajuda mais parecida.
5. Se a IA falhar ou passar do limite, o assistente responde pela Central de Ajuda e avisa.

**Escolhas para explicar na banca:**

- **Por que a chave fica no backend?** Se ficasse no JavaScript do site, qualquer pessoa podia copiar e usar por nossa conta. O navegador só conversa com a Syncrypta, igual na consulta de CNPJ.
- **Por que mandar a Central de Ajuda junto?** É uma forma simples de "dar conhecimento" para a IA, chamada de *grounding*: ela responde com base no que o grupo escreveu, em vez de inventar funções do site. Mudou a Ajuda, muda a IA.
- **LGPD:**
  - o "quanto sobrou" e o CNPJ continuam sendo resolvidos pelas regras, então os números do caixa **não** vão para a IA. Na "memória" da conversa entra só um resumo como "[o site mostrou o resumo do mês]";
  - números longos são apagados antes do envio;
  - o próprio balão pede para não escrever senha, CPF ou cartão.
- **Resposta da IA é tratada como texto:** ela não pode colocar HTML ou script na página. Só o **negrito** e as quebras de linha viram formatação.
- **Custo:** o Gemini tem faixa gratuita, mas no gratuito o Google pode usar o conteúdo enviado para melhorar os produtos dele (mais um motivo para não mandar dados pessoais). O Claude é pago por uso. Os limites do `.env` evitam conta surpresa.
- **Sem chave, nada quebra:** o assistente volta a ser só de regras.

**(4.11) Conversa na página Ajuda:** a seção "Pergunte do seu jeito" usa o mesmo assistente, só que aberto dentro da página. Em `helperbot.js`, quando existe o lugar `#ajudaChat`, o painel é colocado lá e o balão flutuante some. Com a IA ligada, a conversa é livre sobre o site e sobre finanças de autônomos e pequenos negócios: organizar o caixa, precificar e explicar conceitos como MEI, DAS e pró-labore. Para o caso específico de imposto, continua indicando o contador.

**Como ligar:**

1. Copie `backend/.env.exemplo` para `backend/.env`.
2. Preencha **uma** chave:
   - `GEMINI_API_KEY`: gerada em aistudio.google.com, em "Get API key";
   - ou `ANTHROPIC_API_KEY`: gerada no Claude Console.
3. Reinicie o backend. No terminal deve aparecer "Assistente com IA ligado".

No Render, a variável `GEMINI_API_KEY` já está no `render.yaml`; o painel pede o valor.

**Teste:** `node tests/ia-smoke.js`. Ele usa um Gemini e um Claude falsos, sem gastar nada. Confere:
- que sem chave a IA fica desligada;
- que a chave não vai para o navegador;
- que a Central de Ajuda vai junto nas instruções;
- que o CPF é apagado;
- que a conversa alterna certinho entre pessoa e assistente;
- os erros e os dois limites.

## 7. Configurações e administração de usuários (4.13)

**Arquivos:**
- `configuracoes.html` + `configuracoes.js`: a tela;
- `backend/configuracoes.js`: as rotas;
- `script.js`: as funções `aplicarPreferencias` e `guardarPreferencias`;
- `novidades-4-9.css`: as classes `pref-...`.

**Como uma preferência funciona:**

1. A pessoa clica em "Grande", por exemplo.
2. A tela grava na conta (`PUT /api/configuracoes/preferencias`) e guarda uma cópia no navegador.
3. Cada preferência vira uma classe no `<html>`, como `pref-fonte-grande` ou `pref-destaque-roxo`, e o CSS faz o resto. Por isso a mudança aparece na hora.
4. O backend só aceita valores conhecidos, listados em `OPCOES`. Qualquer outro valor é ignorado.

**Administração de usuários:**
- **Só a conta master acessa:** as rotas `/api/admin/usuarios` usam `exigirMaster`.
- **O que dá para fazer:** trocar plano, sem cobrança, e suspender ou reativar contas.
- **Conta suspensa:** o servidor marca `ativo: false`. O login passa a responder "conta suspensa" e o `verificarToken` recusa até o acesso que estava aberto.
- **Contas protegidas:** a master, a visita e, no site publicado, as contas de exemplo. Assim nenhum visitante tranca a banca para fora.
- **Auditoria:** toda mudança fica registrada (`ADMIN_ALTEROU_PLANO`, `ADMIN_SUSPENDEU_CONTA`...).
- **Tabela "quem pode fazer o quê":** é montada a partir de `backend/config/planos.js`, ou seja, mostra as mesmas regras que o servidor usa.

**Senha:**
- Para trocar, precisa da senha atual. A nova precisa ter 8 ou mais caracteres, com letras e números.
- A senha da master não muda por aqui, porque ela é definida no `.env` do servidor.

## 8. Regras inteligentes: o que foi corrigido (4.13)

Em `classificarMovimentacao` (`backend/server.js`):
- **Palavra inteira:** o termo precisa aparecer como palavra inteira. Antes, "posto" classificava "composto agrícola" como combustível.
- **Regra desativada:** é ignorada.
- **Tipo:** quando o tipo vem informado, só vale regra do mesmo tipo. Uma receita não cai mais em "Alimentação / Padaria".
- **Prioridade:** as regras da pessoa vêm antes das padrão e, dentro de cada grupo, ganha a palavra mais longa ("mercado livre" antes de "mercado").

O quadro **"Testar as regras"** usa a mesma classificação da importação, com uma linha só e sem salvar nada. É bom para mostrar na banca.

## 9. Importação inteligente (o que é e o que mudou na 4.14)

**O caminho de um extrato:**
1. **Leitura (no navegador):** o `script.js` lê CSV, Excel ou OFX e acha as colunas (descrição, valor, data...).
2. **Classificação (no servidor):** `POST /api/classificar-lote` passa cada linha pelas regras, primeiro as da pessoa e depois as padrão. Cada linha recebe tipo, categoria, confiança e um status: confirmada, sugerida, revisar ou não identificada.
3. **Revisão:** a Central de revisão deixa editar tudo, confirmar e marcar "Aprender".
4. **Importação:** `POST /api/importar-lote` grava as linhas, cria regras das linhas marcadas em "Aprender" e registra na auditoria.

**Mudanças da 4.14:**
- **Duplicadas:** cada lançamento tem uma "impressão digital" (função `chaveMovimento`): conta, perfil, data, valor e descrição sem acento. Na classificação, o que já existe volta com `duplicada: true`; na importação, isso é pulado, a não ser que venha `importarDuplicada: true`.
- **Fim dos dados falsos ao abrir a página:** o botão "Usar extrato de exemplo" busca `arquivos_teste/extrato_teste.csv` e chama a mesma função de um arquivo escolhido (`processarArquivoFinanceiro`).
- **Conta de exemplo:** `backend/conta-exemplo.js` reaproveita a função `montarDadosDemo` do `seed-demo.js` e acrescenta só os itens da Thaís que faltam.

## Limites, com honestidade

- **A BrasilAPI de verdade não foi testada:** a consulta foi testada com uma BrasilAPI falsa, porque o ambiente de desenvolvimento não acessava a internet. Os nomes dos campos foram conferidos na documentação oficial da BrasilAPI. Antes da apresentação, teste uma vez com o site rodando no computador e internet ligada.
- **O tour lembra só no navegador:** quem abrir em outro navegador vê o tour de novo.
- **A IA não foi testada de verdade:** sem internet aqui, o teste usou um Gemini e um Claude falsos. O formato das chamadas segue a documentação oficial. Antes da banca, coloque a chave, reinicie e faça 3 ou 4 perguntas. IA também pode errar, por isso o selo e o link para a Ajuda.
- **O "sobrou" do assistente inclui o saldo inicial:** é a mesma conta da Visão geral (saldo inicial + entradas − saídas).
