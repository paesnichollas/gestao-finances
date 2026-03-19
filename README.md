# FinanceS — Sistema de Controle Financeiro Societário

Sistema web para controle financeiro de projetos/eventos com múltiplos sócios.

## Stack

- **Next.js 16** (App Router) · **TypeScript** · **Prisma 7** · **PostgreSQL** (Neon) · **Tailwind CSS 4** · **Recharts**

## Setup

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

Crie um `.env` na raiz (veja `.env.example`).

## Deploy na Vercel

1. **Projeto**: conecte o repositório na [Vercel](https://vercel.com) (framework Next.js detectado automaticamente).
2. **Variáveis de ambiente** (Production e, se quiser, Preview):

   | Variável | Obrigatório | Descrição |
   |----------|-------------|-----------|
   | `DATABASE_URL` | Sim | PostgreSQL com SSL. Prefira connection string do **pooler** (Neon/Supabase) para serverless. |
   | `BETTER_AUTH_SECRET` | Sim | Segredo forte (≥ 32 caracteres). |
   | `BETTER_AUTH_URL` | Recomendado | `https://seu-dominio.com`. Se vazio, previews usam `https://$VERCEL_URL`. |
   | `UPSTASH_REDIS_REST_URL` | Não | Cache remoto entre réplicas. |
   | `UPSTASH_REDIS_REST_TOKEN` | Não | Token do Upstash. |

3. **Build**: o `vercel.json` roda `prisma migrate deploy` antes do `next build`. Garanta que o banco já exista e que `DATABASE_URL` esteja definida no ambiente de build.
4. **Seed** (dados iniciais): não roda no deploy. Execute manualmente se precisar:  
   `DATABASE_URL="..." pnpm exec tsx prisma/seed.ts` (ou use Prisma Data Platform / job local apontando para o mesmo banco).
5. **Índices extras** (opcional): `pnpm prisma:indexes` contra o banco de produção, se usar o SQL em `prisma/sql/`.

**Raiz do projeto**: na Vercel, defina o *Root Directory* como a pasta deste app se o repositório for um monorepo.

## Funcionalidades

- **Dashboard**: resumo geral, cards por sócio, gráficos
- **Sócios**: CRUD com percentual de participação
- **Receitas**: CRUD com categorias e datas
- **Despesas**: CRUD com múltiplos pagadores por despesa
- **Fechamento**: apuração automática (lucro proporcional + reembolso)
- **Relatórios**: extrato geral, por sócio/categoria, apuração final

## Regra de Cálculo

```text
Valor Final = (Lucro Líquido × % do Sócio) + Despesas Antecipadas pelo Sócio
```

## Cenário Seed

| Sócio   | %   | Lucro     | Reembolso  | Final       |
|---------|-----|-----------|------------|-------------|
| Pedro   | 30% | R$ 411,60 | R$ 878,00  | R$ 1.289,60 |
| Miguel  | 30% | R$ 411,60 | R$ 750,00  | R$ 1.161,60 |
| Marcelo | 20% | R$ 274,40 | R$ 0,00    | R$ 274,40   |
| Josy    | 20% | R$ 274,40 | R$ 0,00    | R$ 274,40   |
