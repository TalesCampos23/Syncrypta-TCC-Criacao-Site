# Guia de instalação e apresentação — Syncrypta 4.0

## Preparação inicial

1. Extraia o ZIP.
2. Abra a pasta principal no VS Code.
3. Não abra somente a pasta `backend`; abra o projeto inteiro.
4. Abra um terminal novo.

## Instalação

```bash
cd backend
npm install --no-audit --no-fund
```

Se parecer travado:

1. aguarde alguns minutos;
2. pressione `Ctrl + C`;
3. execute:

```bash
npm ping
npm cache verify
npm install --no-audit --no-fund --verbose
```

Em redes escolares restritas, teste um hotspot de celular.

## Criar os dados da apresentação

```bash
npm run seed
```

Esse comando apaga os dados de teste anteriores e recria o ambiente demonstrativo.

## Iniciar

```bash
npm start
```

Deixe esse terminal aberto.

Depois abra `index.html` com o Live Server.

## Roteiro de apresentação recomendado

### 1. Landing page

Explique que a Syncrypta não substitui um ERP ou Power BI. Ela organiza o dado financeiro antes da análise.

### 2. Login da cliente TCC

```text
thais.demo@syncrypta.local
Syncrypta@2026
```

### 3. Dashboard

Mostre:

- filtro por perfil;
- pessoa física e pessoa jurídica;
- mês e origem;
- saldo inicial;
- recebimentos;
- pagamentos;
- saldo final;
- saúde financeira;
- projeção;
- alteração do tipo do gráfico.

### 4. Importação

Use um arquivo da pasta `arquivos_teste`.

Mostre:

- leitura do arquivo;
- classificação sugerida;
- linha não identificada;
- mudança de tipo, categoria e subcategoria;
- opção de aprender a regra;
- confirmação da importação.

### 5. Regras inteligentes

Mostre que “Shell” pode ser salvo como Transporte / Combustível e reutilizado nos próximos meses.

### 6. Relatório mensal

Mostre:

- saldo inicial e final;
- categoria e subcategoria;
- comparação com o mês anterior;
- projeção;
- gasto fora do padrão;
- exportação CSV e Excel;
- impressão em PDF.

### 7. Planos

Na conta da Thais, alterne entre Básico, Profissional e Empresarial. Explique que usuários comuns passam pelo checkout demonstrativo.

### 8. Auditoria

Mostre que ações importantes ficam registradas, sem armazenar senha ou dados bancários.

## Plano de contingência

Antes da banca:

- execute `npm run seed`;
- confirme o login;
- teste CSV, XLSX e OFX;
- mantenha uma cópia do ZIP;
- grave um vídeo curto da demonstração;
- leve os arquivos de teste;
- desative notificações do Windows;
- use zoom do navegador entre 80% e 100%;
- não use dados reais.
