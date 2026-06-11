# Polar Soluções — PRD (Mobile + ERP Web)

## Visão geral
Sistema completo de gestão para empresas de **refrigeração, climatização e serviços técnicos**, com:
- **App mobile** (Expo + React Native) — offline-first
- **ERP Web** (React + Vite + Tailwind) — painel administrativo estilo SaaS
- **Backend FastAPI + MongoDB** — fonte única de dados
- **Sincronização em tempo real** entre mobile e web

## URLs
- **Mobile preview**: `https://<host>.preview.emergentagent.com`
- **ERP Web**: `https://<host>.preview.emergentagent.com/api/admin/`
- **API**: `https://<host>.preview.emergentagent.com/api/*`

## Backend (`/app/backend/server.py`)
FastAPI com endpoints CRUD para todas as entidades:
- `/api/clientes`, `/api/equipamentos`, `/api/ordens`, `/api/orcamentos`
- `/api/cobrancas`, `/api/saidas`, `/api/entradas`, `/api/eventos`, `/api/recibos`
- `/api/empresa` (config singleton)
- `/api/sync/pull`, `/api/sync/push` (sync offline-first)
- `/api/dashboard` (métricas consolidadas)
- Modelos Pydantic completos; persistência em MongoDB (motor); UUIDs como id
- Serve o SPA web em `/api/admin/*`

## Mobile (`/app/frontend`)
- Continua local-first em AsyncStorage
- `lib/api-client.ts` + `lib/sync.ts` plugados em `saveCliente/saveOrdem/saveOrcamento/saveCobranca/saveSaidaManual/saveEvento/saveRecibo/saveEquipamento/saveEntradaAutomatica/saveEmpresa`
- `_layout.tsx` dispara `fullSync()` ao iniciar + a cada 60s
- Toda alteração no mobile vai pro backend; backend → web; web → mobile

## ERP Web (`/app/web`)
React + Vite + Tailwind 3 + Recharts + lucide-react + @tanstack/react-query

### Estrutura
- `src/App.tsx` — Sidebar grafite + Topbar com pesquisa global, sino e perfil
- `src/pages/Dashboard.tsx` — Notificações, Resumo Operacional, Financeiro Hoje, Atalhos, Gráfico 30d, Ranking donut, Meta, Últimas OS
- `src/pages/Clientes.tsx` — CRUD em cards
- `src/pages/Ordens.tsx`, `Orcamentos.tsx`, `Cobrancas.tsx`, `Agenda.tsx`, `Produtos.tsx`, `Recibos.tsx` — CRUDs com modais ricos
- **Orçamentos e OS** com itens detalhados (Serviços + Materiais/Peças, qtd, unit, total automático)
- **Recibos** — página dedicada com listagem, busca, PDF e exclusão
- `src/pages/Financeiro.tsx` — 3 abas (Resumo/Entradas/Saídas) com cards
- `src/pages/Relatorios.tsx` — **Aba IA** (Claude Sonnet 4.5 via EMERGENT_LLM_KEY) com análise executiva + Q&A livre + sugestões prontas; aba CSV mantida
- `src/pages/Configuracoes.tsx` — **Upload de logo** (base64), Dados da empresa, Registro profissional, Meta mensal, Termo de Garantia com IA
- `src/lib/pdf-export.ts` — Geração de PDFs profissionais (orçamento, OS, recibo, análise IA) usando jsPDF + jspdf-autotable
- `src/components/CrudPage.tsx` — componente genérico CRUD (tabela + modal de edição)

### Endpoint de IA (backend)
- `POST /api/ia/analise` — recebe `{ pergunta?: str }`, retorna `{ analise: markdown, resumo: json, modelo, ts }`
- Usa Claude Sonnet 4.5 (claude-sonnet-4-5-20250929) com EMERGENT_LLM_KEY
- Faz pré-resumo dos dados (KPIs, top clientes, inadimplentes, categorias) antes de enviar ao LLM
- **Usado por mobile (`/app/frontend/app/analise-ia.tsx`) E web** (`/app/web/src/pages/Relatorios.tsx`)

## Bugs corrigidos nesta sessão (mobile)
- ✅ APK crash em Configurações: faltavam imports `TouchableOpacity` e `TextInput` em `/app/frontend/app/configuracoes.tsx`
- ✅ Metro bundling falhava por `react-native-css-interop/.cache/web.css` ausente — arquivo recriado e cache limpo
- ✅ Página Equipamentos não abria: faltava `/app/frontend/app/equipamento/index.tsx` (listagem com busca, scanner QR e ações)
- ✅ Análise IA mobile usava cálculos locais — agora consome o endpoint backend Claude Sonnet 4.5
- ✅ Bug do teclado fechando em `equipamento/novo.tsx`, `reserva-automatica.tsx`, `simulador-expansao-novo.tsx` — componentes inline aninhados (`InputField`, `CampoPercentual`, `CampoInput`) extraídos para escopo externo
- ✅ Função `deleteEquipamento` adicionada em `lib/store.ts` (offline-first + sync)

## Módulo de Estoque integrado (mobile + backend)
- ✅ Backend: Pydantic `Produto` e `MovimentacaoEstoque` + `make_crud("produtos")` + `make_crud("movimentacoes_estoque")`
- ✅ Backend: `/api/sync/push` e `/api/sync/pull` aceitam coleções `produtos` e `movimentacoes_estoque`
- ✅ Mobile: `estoque-store.saveProduto` agora sincroniza com backend via `remote.upsert("produtos")`
- ✅ Mobile: ao concluir OS, **decremento automático de estoque** para cada material com `produtoId` (via `darBaixaEstoque`), com alertas amigáveis:
  - "Estoque atualizado 📦" quando OK
  - "Estoque insuficiente ⚠️" listando produtos com problema
- ✅ Mobile: ao reabrir OS concluída, **restaura estoque** automaticamente (via `adicionarEstoque`)
- ✅ Cobrança automática só cria em transição nova para "concluído" (não recria em reabertura)

### Visual
- Identidade Polar (Azul #0A6EFF, Grafite #1F2937, Branco)
- Cards arredondados 16-20px com sombras suaves
- Layout responsivo (mobile-friendly)
- Marca d'água "P" gigante no canto da home

## Como funciona a sincronização
1. App mobile salva no AsyncStorage e dispara `schedulePush()` com debounce 1.5s
2. `schedulePush` chama `POST /api/<collection>` para upsert por id
3. Web já estava lendo do mesmo backend via `@tanstack/react-query` (auto-refetch a cada 30s no Dashboard)
4. App mobile chama `fullSync()` na inicialização e a cada 60s para puxar mudanças vindas do web
5. Resolução de conflito: vence o lado com `atualizadoEm`/`atualizado_em` mais recente

## Pendências / Próximos passos
- Autenticação (atualmente sem login)
- Migração de dados antigos do AsyncStorage para o backend (botão "Forçar sync" em Configurações)
- Editor de OS detalhado no web (com itens, materiais, fotos, assinatura)
- Editor de Orçamentos no web com itens dinâmicos
- Envio por WhatsApp/Email direto do web
- Geração de PDF no web (atualmente só mobile)
- Dark mode
- WebSocket para sync instantâneo (atualmente polling)


## Atualização — Orçamentos / Serviços / Materiais / PDF (Junho 2026)

### Bug fix crítico
- **Desconto não aparecia no PDF** após editar um orçamento salvo: `app/orcamento/[id].tsx` agora usa `useFocusEffect` (em vez de `useEffect`) para recarregar o orçamento ao retornar da tela de edição. PDF passa a refletir o desconto atualizado.

### Novas funcionalidades
- **Equipamentos no orçamento**: campo novo `equipamentos?: EquipamentoOS[]` em `Orcamento` (com `tipo, marca, modelo, serie, patrimonio, localizacao, problema, diagnostico`). UI no `OrcamentoForm` com seção colapsável e botão "Adicionar Equipamento" (múltiplos suportados).
- **PDF de orçamento agora renderiza os equipamentos** (cards com tipo, marca/modelo/série, patrimônio/localização, problema e diagnóstico) via `equipamentosLista` em `generateOrcamentoPDF`.
- **Edição de itens durante o orçamento**: Modais para editar Serviço (nome, descrição, valor, quantidade) e Material (nome, descrição, quantidade, unidade, valor unitário, lucro %, frete). Mudanças NÃO mexem no catálogo (Serviços Cadastrados / Estoque).
- **Detalhes (descrição técnica)** em serviços e materiais já existiam — passam a aparecer na tela de detalhe E no PDF (texto cinza embaixo do nome do item).
- **Resumo no PDF e na tela de detalhe**: Subtotal, Desconto (valor + % quando percentual), Total final.

### CRUD catálogo
- `app/servicos-cadastrados/index.tsx` já suporta editar/excluir serviços cadastrados.
- `app/estoque/produto/[id].tsx` já suporta editar/excluir produtos (materiais cadastrados).
