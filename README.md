# Syncrypta 4.0 Premium Final

**Contabilidade inteligente. Segurança real.**

A Syncrypta é uma plataforma acadêmica de controle inteligente de fluxo de caixa criada para o TCC da FIAP School a partir do desafio apresentado pela contadora **Thais Calca**.

O objetivo não é substituir um ERP ou o Power BI. A proposta é resolver uma etapa anterior e essencial: **receber extratos, faturas e planilhas; organizar recebimentos e pagamentos; classificar os lançamentos; permitir correções; aprender regras e gerar uma visão mensal simples e visual**.

> Projeto demonstrativo. Nenhuma cobrança real é realizada e nenhuma integração bancária real é executada.

---

## Fluxo principal

```text
Extrato bancário, fatura ou planilha
↓
Leitura e validação
↓
Separação entre recebimentos e pagamentos
↓
Classificação por categoria e subcategoria
↓
Central de revisão do usuário
↓
Aprendizado de regras personalizadas
↓
Dashboard e relatório mensal
```

---

## Funcionalidades principais

- Landing page premium;
- Login e cadastro redesenhados;
- Tema claro e escuro;
- Sidebar moderna e responsiva;
- Dashboard com:
  - saldo inicial;
  - recebimentos;
  - pagamentos;
  - saldo final;
  - saúde financeira;
  - descasamento de caixa;
  - comparação com o mês anterior;
  - projeção dos próximos três meses;
  - despesas recorrentes;
  - gastos fora do padrão;
  - gráficos em barras, linhas, pizza ou rosca;
- Filtro por perfil financeiro, mês e origem;
- Movimentações com:
  - pessoa física e pessoa jurídica;
  - categoria e subcategoria;
  - conta ou cartão;
  - contraparte;
  - centro de custo;
  - natureza do gasto;
  - busca, filtros, ordenação, edição e exclusão;
- Importação de:
  - CSV;
  - Excel `.xlsx`;
  - OFX;
- Central de revisão antes da importação;
- Alteração do tipo, categoria e subcategoria antes de salvar;
- Regras automáticas aprendidas a partir das correções;
- Perfis financeiros sem cadastro de CPF, número de cartão ou outros dados sensíveis;
- Relatório mensal visual;
- Exportação CSV e Excel;
- Impressão e geração de PDF pelo navegador;
- Auditoria de ações;
- Notificações diferentes para pessoa física e pessoa jurídica;
- Planos Básico, Profissional e Empresarial;
- Checkout demonstrativo por PIX ou cartão;
- Conta especial da cliente TCC para alternar livremente os planos;
- JWT, bcrypt, Helmet e limite de tentativas de login;
- Chart.js incluído localmente;
- Dados fictícios preparados para apresentação.

---

## Formatos de entrada

| Formato | Situação |
|---|---|
| CSV | Funcional |
| Excel `.xlsx` | Funcional pela primeira aba |
| OFX | Funcional para lançamentos bancários básicos |
| PDF | Planejado para etapa futura |

A pasta `arquivos_teste` possui exemplos prontos.

---

## Contas demonstrativas

### Cliente TCC

```text
E-mail: thais.demo@syncrypta.local
Senha: Syncrypta@2026
```

Essa conta:

- começa no plano Empresarial;
- possui dados fictícios;
- possui perfis de pessoa física e jurídica;
- possui regras, saldos iniciais e auditoria;
- pode alternar os planos sem pagamento;
- muda a interface conforme o plano.

### Usuário comum

```text
E-mail: demo@syncrypta.local
Senha: Demo@2026
```

Essa conta começa no plano Básico e permite testar o checkout demonstrativo.

**O telefone pessoal informado não foi incluído no código, nos dados de teste ou nas credenciais.**

---

## Como executar

### 1. Abrir o terminal na pasta do backend

```bash
cd backend
```

### 2. Instalar as dependências

```bash
npm install --no-audit --no-fund
```

### 3. Criar os dados demonstrativos

```bash
npm run seed
```

### 4. Iniciar o backend

```bash
npm start
```

O terminal deverá mostrar:

```text
Syncrypta 4.0 disponível em http://localhost:3000
```

### 5. Abrir o site

No VS Code, clique com o botão direito em `index.html` e escolha **Open with Live Server**.

---

## Arquivos de teste

```text
arquivos_teste/
├── extrato_teste.csv
├── extrato_teste.xlsx
├── extrato_teste.ofx
└── LEIA-ME.txt
```

---

## Estrutura

```text
Syncrypta-TCC-Versao-4.0-Premium-Final/
├── backend/
│   ├── config/planos.js
│   ├── auditoria.json
│   ├── clientes.json
│   ├── movimentacoes.json
│   ├── pagamentos.json
│   ├── regras.json
│   ├── saldos.json
│   ├── usuarios.json
│   ├── package.json
│   ├── seed-demo.js
│   └── server.js
├── arquivos_teste/
├── vendor/chart.umd.js
├── index.html
├── login.html
├── cadastro.html
├── dashboard.html
├── movimentacoes.html
├── importacao.html
├── regras.html
├── clientes.html
├── relatorios.html
├── auditoria.html
├── checkout.html
├── script.js
├── style.css
└── README.md
```

---

## Privacidade e segurança

A versão 4.0 evita cadastrar CPF, CNPJ, número de cartão, CVV, senha bancária e outros dados sensíveis nos perfis financeiros.

O projeto demonstra:

- senha protegida com bcrypt;
- autenticação JWT;
- rotas protegidas;
- rate limit no login;
- Helmet;
- separação por usuário;
- controle de recursos por plano;
- auditoria;
- `.env.example` sem segredo real.

Para produção ainda seriam necessários banco gerenciado, HTTPS, backups, consentimento, políticas LGPD, provedor de pagamento e testes de segurança.

---

## Limitações conhecidas

- PDF ainda não é lido automaticamente;
- o leitor XLSX é simplificado e trabalha com a primeira aba;
- o parser OFX cobre os campos mais comuns;
- pagamentos são simulados;
- projeções são demonstrativas e baseadas em médias e recorrência, não em um modelo de IA treinado externamente;
- armazenamento em JSON é adequado para demonstração, não para produção.

---

## Integrantes

- Tales Oliveira Campos — RM 13222
- Kenny Koixun Navarrete Yang — RM 14356
- Pedro Henrique Tourino Marconni — RM 16082
- Lucas Rezende Rino — RM 16444
- Vinicius Ettore Almeida Souza — RM 16320
- Henrique de Paula Corredor — RM 16365

---

## Status

**Versão 4.0 Premium Final — pronta para testes, demonstração e refinamentos finais até outubro de 2026.**
