# Problema, justificativa e objetivos

## Contextualização

A gestão de tarefas pessoais é uma habilidade fundamental para qualquer pessoa que precise equilibrar múltiplas responsabilidades — estudantes, profissionais em início de carreira, freelancers, etc. Embora existam vários gerenciadores no mercado (Trello, Todoist, Microsoft To-Do, Notion), a maioria dessas ferramentas falha em manter o usuário engajado a longo prazo: ou a curva de aprendizagem é alta, ou a abordagem é tão genérica que as listas se transformam em um "cemitério de pendências" que perde sentido.

## Problema

> **Como manter um usuário engajado em um sistema de gerenciamento de tarefas, gerando hábito sustentável a partir de feedback visual, recompensa e métricas que demonstram progresso?**

## Justificativa

- Estudos sobre formação de hábitos (BJ Fogg, *Tiny Habits*, 2019; James Clear, *Atomic Habits*, 2018) apontam que **feedback imediato** e **visualização de progresso** são essenciais para a consolidação de comportamentos.
- A gamificação (Karl Kapp, *The Gamification of Learning and Instruction*, 2012) aplicada a contextos não-jogos aumenta engajamento, motivação intrínseca e retenção.
- Plataformas como Duolingo e Habitica demonstram empiricamente que XP, níveis, sequências e missões são mecânicas eficazes mesmo fora dos jogos clássicos.
- Faltam soluções **abertas, gratuitas e leves** que combinem CRUD tradicional + gamificação + análise estatística pessoal em um único produto.

## Público-alvo

- **Primário:** estudantes de graduação (18–25 anos), tecnologicamente alfabetizados, que precisam organizar trabalhos, provas e atividades pessoais.
- **Secundário:** profissionais em início de carreira que querem visibilidade da própria produtividade.

## Objetivo geral

Desenvolver uma aplicação web responsiva de gerenciamento de tarefas pessoais que combine **CRUD tradicional**, **mecânicas de gamificação** e **análise estatística de produtividade**, com persistência segura de dados.

## Objetivos específicos

1. **Implementar autenticação** segura por e-mail/senha usando um BaaS (Supabase Auth).
2. **Modelar a base de dados** com Row Level Security para garantir isolamento de dados entre usuários.
3. **Desenvolver CRUD completo** de tarefas com atributos avançados (urgência, localização, categoria, data de vencimento, anexos).
4. **Implementar sistema de gamificação** com XP, níveis, sequências de dias consecutivos e 14 missões com progresso visual.
5. **Construir dashboard analítico** com gráficos de produtividade semanal e mensal, taxa de conclusão e tempo médio de execução.
6. **Permitir compartilhamento** colaborativo de tarefas entre usuários, com fluxo de aceitar/recusar.
7. **Garantir acessibilidade** básica (WCAG 2.1, nível AA): `aria-label`, navegação por teclado, opção de aumento de fonte, tema escuro.
8. **Validar com testes automatizados** (Vitest + Testing Library) e CI (GitHub Actions).
9. **Documentar a arquitetura** com diagramas, ERD e manual do usuário.

## Diferenciais do projeto

| Diferencial | Por que importa |
|---|---|
| **Gamificação real** (XP, nível, streak diário, 14 missões) | Engajamento de longo prazo, não só checklist |
| **Dashboard analítico** com séries temporais | Visualização objetiva da própria produtividade |
| **Compartilhamento entre usuários** com aceite/recusa | Valor colaborativo sem comprometer privacidade |
| **Acessibilidade nativa** (tema escuro + zoom de fonte + teclado) | Inclusão sem depender de extensões |
| **Segurança defense-in-depth** (RLS no banco + validação no app) | Mesmo bug no frontend não vaza dados |

## Limitações de escopo

- Sem app mobile nativo (apenas web responsiva).
- Sem sincronização offline (PWA é roadmap futuro).
- Tarefas compartilhadas são **read-only** para o destinatário (sem co-edição).
- Sem notificações push ou e-mail.
- Anexos são apenas **links** (sem upload de arquivos).
- Reset de senha não implementado (botão pode ser adicionado em iteração futura).
