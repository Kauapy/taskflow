# Manual do usuário — Taskflow

> Este manual descreve **todas** as funcionalidades do Taskflow do ponto de vista do usuário final. Inclua capturas de tela aqui antes da apresentação do TCC (sugestão: pasta `docs/screenshots/`).

## 1. Primeiro acesso (cadastro)

1. Abra a URL onde o app está hospedado.
2. Na tela de login, clique em **"Não tem conta? Cadastre-se"**.
3. Digite um **e-mail válido** e uma **senha** (mínimo 6 caracteres).
4. Clique em **"Criar Conta"**.
5. Você é levado direto ao Dashboard. Sua conta já tem um perfil de progresso (Nível 1, 0 XP).

> Capturar tela aqui → `docs/screenshots/01-cadastro.png`

## 2. Login

1. Insira seu e-mail e senha.
2. Clique em **"Entrar"**.
3. Em caso de erro, a mensagem **"Email ou senha incorretos"** aparece logo abaixo dos campos.

## 3. O Dashboard

O Dashboard tem três abas no topo:

| Aba | O que mostra |
| --- | --- |
| **Tarefas** | Suas missões + sua lista pessoal (ativas e concluídas) |
| **Compartilhadas** | Tarefas que outros usuários compartilharam com você (pendentes / aceitas) |
| **Análises** | Gráficos de produtividade semanal e mensal |

No canto superior direito ficam os controles de **acessibilidade** (tamanho de fonte), **tema** (claro/escuro) e **logout**.

> Capturar tela aqui → `docs/screenshots/02-dashboard.png`

## 4. Criar uma tarefa

1. Aba **Tarefas** → botão **"+ Nova Tarefa"** (canto direito do bloco Tarefas).
2. Preencha o **título** (obrigatório, até 200 caracteres).
3. Escolha a urgência: **Baixa**, **Média** ou **Alta**.
4. Opcionalmente:
   - **Localização** (até 100 caracteres) — ex.: Casa, Mercado, UFRJ.
   - **Categoria** — escolha entre Trabalho, Pessoal, Estudos, Saúde, Casa, Financeiro, Outros.
   - **Data de vencimento** — não pode ser no passado.
   - **Anexos** — cole URLs **http(s)** e pressione Enter. URLs `javascript:`, `file:`, `data:` são bloqueadas por segurança.
5. Clique em **"Adicionar"**.
6. A tarefa aparece em **"Ativas"**. Você ganha **+10 XP**.

> Capturar tela aqui → `docs/screenshots/03-criar-tarefa.png`

## 5. Concluir uma tarefa

1. Clique no **círculo à esquerda** do card.
2. Animação de check, opacidade reduz, tarefa migra para **"Concluídas"**.
3. Você ganha **+50 XP**.
4. Sua **sequência (streak)** atualiza:
   - Primeira conclusão do dia em ≥24h: streak começa ou continua.
   - Segunda conclusão no mesmo dia: streak não muda.
   - Mais de 1 dia sem completar: streak reinicia em 1 (mas seu *best_streak* fica registrado).

## 6. Editar uma tarefa

1. Clique no **ícone de lápis** no card.
2. O título vira input editável; campos extras aparecem inline.
3. Use **Enter** para salvar ou **Esc** para cancelar.
4. Botão **✓** salva, botão **✗** descarta.

## 7. Excluir uma tarefa

1. Clique no **ícone de lixeira**.
2. Um **modal de confirmação** abre.
3. **"Cancelar"** ou pressione **Esc** para desistir.
4. **"Excluir"** apaga definitivamente.

> A versão antiga era "clica de novo em 3s para confirmar" — substituída por modal real para evitar exclusões acidentais em mobile.

## 8. Buscar e filtrar

- A barra **"Pesquisar tarefas..."** filtra ativas e concluídas em tempo real, por título **ou** localização.
- A busca é case-insensitive.

## 9. Compartilhar uma tarefa

Há **dois modos** de compartilhar, oferecidos no mesmo modal em abas distintas:

### 9.1 Por e-mail (usuário registrado)

1. Em qualquer tarefa sua, clique no **ícone de compartilhar** (Share2).
2. Aba **"Por e-mail"** (padrão).
3. Digite o **e-mail** de outro usuário **já cadastrado** no Taskflow.
4. Clique em **"Compartilhar"**.
5. Mensagens possíveis:
   - ✅ **"Convite enviado!"** — sucesso. O destinatário vê em **Compartilhadas → Pendentes** e pode aceitar/recusar.
   - ❌ "Nenhum usuário cadastrado com esse e-mail."
   - ❌ "Você não pode compartilhar com você mesmo."
   - ❌ "Esta tarefa já foi compartilhada com esse usuário."

### 9.2 Por link público (qualquer pessoa)

Use quando o destinatário **não tem conta** no Taskflow, ou quando quiser distribuir em massa (WhatsApp, e-mail externo, redes sociais).

1. No mesmo modal, clique na aba **"Por link público"**.
2. Escolha a **validade** do link:
   - *Sem expiração* (padrão) — vale até você revogar.
   - *1, 7 ou 30 dias* — expira automaticamente.
3. Clique em **"Gerar link"**.
4. Um link tipo `https://app.taskflow.com/shared/<token>` aparece na lista.
5. Clique em **Copiar** e envie por onde quiser.
6. Cada link mostra:
   - **Status**: Ativo / Expirado / Revogado.
   - **Contador de visualizações** (atualiza a cada acesso).
   - **Data de expiração** (se houver).
7. Pode **revogar** a qualquer momento (botão lixeira) — o link para de funcionar imediatamente.

> Quem abre o link vê uma página pública somente-leitura, sem precisar de login. Aparece um CTA "Criar minha conta no Taskflow" caso o visitante queira usar o app também.

> Capturar telas aqui → `docs/screenshots/04a-compartilhar-email.png`, `docs/screenshots/04b-compartilhar-link.png`, `docs/screenshots/04c-pagina-publica.png`

## 10. Receber uma tarefa compartilhada

1. Aba **Compartilhadas → Pendentes**.
2. Você vê o **título da tarefa**, urgência, localização (se houver), e o **e-mail do remetente**.
3. **"Aceitar"** move o convite para a lista de **Aceitas** e libera leitura da tarefa.
4. **"Recusar"** apaga o convite.

Em **Aceitas**, você pode visualizar a tarefa e **"Remover"** o compartilhamento se mudar de ideia.

> Tarefas aceitas são **read-only**. Você as vê, mas não pode editar nem completar (apenas o dono pode).

## 11. Missões

A seção **"Missões"** no topo da aba Tarefas mostra 14 desafios:

- 4 missões de **completar X tarefas** (5, 25, 100, 500).
- 3 missões de **localizações únicas** (3, 10, 25).
- 3 missões de **criar X tarefas** (10, 50, 200).
- 4 missões de **streak diário** (3, 7, 30, 100).

Cada missão tem barra de progresso, recompensa em XP e um **✓** quando concluída.

## 12. Análises

A aba **Análises** abre o dashboard analítico (carregado sob demanda — primeira abertura demora um pouco mais por causa do code-splitting).

Mostra:

- **4 cards** no topo: total criadas, total completadas, taxa de produtividade, tempo médio.
- **Gráfico de barras** — progresso semanal (últimas 8 semanas).
- **Gráfico de linha** — progresso mensal (últimos 6 meses).
- **2 cards** de sequência: atual e melhor (recorde).

> Capturar tela aqui → `docs/screenshots/05-analises.png`

## 13. Tema escuro/claro

Botão **sol/lua** no canto superior direito. A escolha persiste em `localStorage` para o próximo acesso.

## 14. Aumentar a fonte (acessibilidade)

Botão **"T"** no canto superior direito alterna entre:

- **Normal** (sem badge)
- **Médio** (+10%, badge `+`)
- **Grande** (+25%, badge `++`)

A configuração é aplicada via CSS `zoom` no elemento raiz e persiste em `localStorage`.

## 15. Sair

Botão **vermelho com ícone de logout** no canto superior direito → encerra a sessão e volta para a tela de login.

## Atalhos de teclado

| Tecla | Ação |
| --- | --- |
| **Enter** dentro do título da tarefa | Salvar (no modo edição) ou submit |
| **Esc** | Fechar modais (delete, share) ou cancelar edição inline |
| **Tab** / **Shift+Tab** | Navegação por foco entre elementos interativos |

Todos os botões só com ícone têm `aria-label`, então leitores de tela funcionam corretamente.
