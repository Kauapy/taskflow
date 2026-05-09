# Taskflow

Gerenciador de tarefas pessoais com **gamificação** (XP, níveis, sequências/streaks e missões) e **dashboard analítico**, construído como projeto de Trabalho de Conclusão de Curso (TCC).

> Status: protótipo funcional / MVP em refinamento.

## Sumário

- [Visão geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Como rodar localmente](#como-rodar-localmente)
- [Configuração do Supabase](#configuração-do-supabase)
- [Scripts disponíveis](#scripts-disponíveis)
- [Banco de dados](#banco-de-dados)
- [Funcionalidades](#funcionalidades)
- [Limitações conhecidas](#limitações-conhecidas)
- [Roadmap](#roadmap)

## Visão geral

O Taskflow propõe transformar a gestão de tarefas em uma experiência mais engajadora, aplicando elementos de gamificação (XP por ação, níveis, sequências diárias e missões) sobre um CRUD tradicional de tarefas. O objetivo é incentivar a regularidade e a sensação de progresso ao longo do tempo.

**Público-alvo:** estudantes e jovens profissionais que querem manter rotinas e visualizar a evolução pessoal.

## Tecnologias

- **Frontend:** React 18, TypeScript 5, Vite 5
- **Estilização:** styled-components 6 + tema claro/escuro próprio
- **Ícones:** lucide-react
- **Gráficos:** recharts
- **Backend (BaaS):** Supabase (Auth, PostgreSQL com RLS, Realtime)
- **Lint/Type:** ESLint 9, typescript-eslint 8

## Estrutura do projeto

```
src/
  components/      # Login, Dashboard, AddTask, TaskList, Missions, Analytics
  contexts/        # AuthContext, ThemeContext (tema + zoom A11y)
  hooks/           # useTasks, useProgress, useAnalytics
  lib/             # Cliente Supabase + tipos compartilhados
  styles/          # theme + GlobalStyles
supabase/
  migrations/      # Schemas + RLS + triggers
```

## Pré-requisitos

- Node.js 18+
- npm 9+
- Conta gratuita no [Supabase](https://supabase.com/) com um projeto criado

## Como rodar localmente

1. Clone e instale dependências:

   ```bash
   git clone https://github.com/Kauapy/taskflow.git
   cd taskflow
   npm install
   ```

2. Crie o arquivo `.env` baseado no template:

   ```bash
   cp .env.example .env
   ```

   Preencha com a URL e a `anon key` do seu projeto Supabase.

3. Execute as migrations no painel do Supabase (ver [Configuração do Supabase](#configuração-do-supabase)).

4. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   O app abre em `http://localhost:5173`.

## Configuração do Supabase

1. Crie um projeto em https://supabase.com/dashboard.
2. Em **Project Settings → API**, copie `Project URL` e `anon public key` para o `.env`.
3. Em **SQL Editor**, execute, na ordem, os arquivos:
   - `supabase/migrations/20260308191517_create_taskflow_schema.sql` — cria as tabelas `tasks` e `user_progress`, ativa RLS, cria políticas e o trigger que cria automaticamente o registro de progresso quando um usuário se cadastra.
   - `supabase/migrations/20260411100000_add_advanced_task_features.sql` — adiciona colunas `category`, `due_date`, `attachments`, `shared_with` e cria a tabela `task_shares`.
   - `supabase/migrations/20260509120000_add_profiles_and_sharing.sql` — cria a tabela `profiles` (espelho público de e-mails para lookup), trigger de backfill, RPCs `find_user_id_by_email` e `get_incoming_shares` (ambas SECURITY DEFINER), e novas políticas RLS para compartilhamento.
4. (Opcional, durante desenvolvimento) Em **Authentication → Configuration**, desative “Confirm email” se quiser criar contas de teste sem confirmar e-mail.

## Scripts disponíveis

| Comando             | O que faz                              |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Sobe o Vite em modo dev (HMR)          |
| `npm run build`     | Gera o bundle de produção              |
| `npm run preview`   | Pré-visualiza o build                  |
| `npm run lint`      | Roda o ESLint                          |
| `npm run typecheck` | Verifica tipos com `tsc --noEmit`      |

## Banco de dados

**Tabela `tasks`**
- `id`, `user_id`, `title`, `urgency` (`baixa`/`media`/`alta`)
- `location`, `category`, `completed`, `completed_at`, `created_at`
- `due_date`, `attachments` (URLs), `shared_with` (ids)

**Tabela `user_progress`**
- Estatísticas agregadas por usuário: total criadas/completadas, locais únicos, streak atual e melhor, nível, XP, última atividade.

**Tabela `task_shares`**
- Convites de compartilhamento entre usuários (status `pending` / `accepted` / `declined`).

**Tabela `profiles`**
- Espelho público de `auth.users` apenas com `id` + `email`. Permite lookup por e-mail via RPC sem expor o resto do `auth`.

Todas as tabelas usam **Row Level Security**. Cada usuário só lê e escreve seus próprios dados; tarefas com `task_share` aceito ficam visíveis para o destinatário (somente leitura). Lookups por e-mail e listagem de compartilhamentos recebidos passam por RPCs `SECURITY DEFINER`.

## Funcionalidades

- 🔐 Cadastro e login com e-mail/senha (Supabase Auth)
- ✅ CRUD completo de tarefas com urgência, localização, categoria, data de vencimento e anexos (URLs)
- 🎮 Sistema de gamificação: XP por ação, nível calculado a partir de XP, missões com progresso visual
- 🔥 Sequência (streak) de dias consecutivos completando tarefas
- 📊 Dashboard analítico: progresso semanal e mensal (charts), taxa de produtividade, tempo médio de conclusão
- 🤝 Compartilhamento de tarefas por e-mail, com fluxo aceitar/recusar
- 🌗 Tema claro/escuro com persistência em `localStorage`
- 🔍 Busca em tempo real por título e localização
- ⏱️ Contagem regressiva ao vivo para tarefas com data de vencimento

## Limitações conhecidas

- Não há testes automatizados ainda (Fase 4 do roadmap).
- Tarefas compartilhadas são read-only para o destinatário (não há merge de progresso entre os dois usuários).
- 6 vulnerabilidades em dev-deps do Vite que exigiriam upgrade major (avaliar em PR separado).

## Roadmap

- [x] Modal de confirmação de exclusão
- [x] Lazy-load do dashboard analítico
- [x] UI completa de compartilhamento de tarefas
- [ ] Testes unitários, de integração e E2E
- [ ] Documentação acadêmica (problema, justificativa, ERD, diagramas)

## Licença

Projeto acadêmico — uso educacional.
