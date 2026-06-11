import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  EntradaFinanceira,
  SaidaFinanceira,
  ConfiguracaoEntradaAutomatica,
} from "./financeiro-automatico-types";
import { schedulePush, pushDelete } from "./sync";

// Types
export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  cpfCnpj: string;
  endereco: string;
  numero: string; // Número do endereço
  cidade: string;
  estado: string;
  bairro: string;
  cep: string;
  observacoes: string;
  criadoEm: string;
}

export type EquipamentoStatusOperacional = "ativo" | "manutencao" | "inativo";

export interface InfoTecnicaEquipamento {
  tipoGas?: string;
  qtdGas?: string;
  tensao?: string;
  corrente?: string;
  potencia?: string;
  compressor?: string;
  obsTecnicas?: string;
}

export interface Equipamento {
  id: string;
  codigoInterno?: string;
  nome?: string;
  clienteId: string;
  tipo: string;
  marca: string;
  modelo: string;
  serie: string;
  localInstalacao?: string;
  statusOperacional?: EquipamentoStatusOperacional;
  infoTecnica?: InfoTecnicaEquipamento;
  fotos?: string[];
  observacoes: string;
  qrData?: string;
  criadoEm?: string;
}

export type OSStatus = "aberto" | "em_andamento" | "concluido" | "pendente";

export interface ServicoItem {
  id: string;
  descricao: string; // Nome do serviço
  detalhes?: string; // Descrição técnica detalhada (opcional, multilinha)
  valor: number;
  quantidade: number;
}

export interface MaterialItem {
  id: string;
  descricao: string; // Nome do material
  detalhes?: string; // Descrição detalhada (opcional, multilinha)
  quantidade: number;
  unidade?: string; // un, kg, g, m, cm, m2, m3, L, cx, pç, etc
  valorUnitario: number;
  // Campos internos (não aparecem no PDF do cliente)
  lucroPercent: number; // % de lucro sobre o material (pode ser 0)
  frete: number; // valor do frete do material
  // Campos opcionais para rastreamento de estoque
  produtoId?: string; // ID do produto no estoque
  custoReal?: number; // Custo real do produto para cálculo de lucro
}

export interface GastosOperacionais {
  transporte: number;
  alimentacao: number;
  hospedagem: number;
  outros: number;
  descricaoOutros: string;
}

export type EquipamentoStatus =
  | "aguardando_diagnostico"
  | "orcamento_enviado"
  | "aprovado"
  | "em_execucao"
  | "concluido"
  | "sem_reparo";

export interface EquipamentoOS {
  id: string;
  equipamentoCadastradoId?: string; // referência ao Equipamento global (para histórico)
  tipo?: string; // tipo do equipamento (ex: Ar Condicionado, Geladeira)
  marca: string;
  modelo: string;
  serie?: string;
  patrimonio?: string; // identificação interna do cliente
  localizacao?: string; // sala/setor onde está instalado
  problema: string;
  diagnostico: string;
  status: EquipamentoStatus;
}

export interface OrdemServico {
  id: string;
  numero: number;
  clienteId: string;
  clienteNome: string;
  equipamentoId?: string;
  equipamentoDesc?: string;
  // NOVO formato: cada equipamento tem problema + diagnostico + status
  equipamentos?: EquipamentoOS[];
  // Campos legacy (mantidos por compatibilidade — usados como fallback no PDF)
  equipamento?: string;
  marca?: string;
  modelo?: string;
  serie?: string;
  local?: string;
  problema: string;
  defeitosEncontrados?: string;
  diagnostico: string;
  observacaoTecnica?: string;
  // Custos para análise de rentabilidade
  custoDeslocamento?: number;
  horasTrabalhadas?: number;
  custoMaoDeObra?: number;
  servicos: ServicoItem[];
  materiais: MaterialItem[];
  observacoes: string;
  observacoesInternas: string;
  status: OSStatus;
  valorTotal: number;
  valorDesconto: number;
  formaPagamento: string;
  tecnicoResponsavel: string; // Nome do técnico responsável
  criadoEm: string;
  atualizadoEm: string;
  concluidoEm?: string;
  dataCriacao?: string;
  dataConclusao?: string;
  dataAgendada?: string;
  dataAtualizacao?: string;
  // Campos de pagamento
  statusPagamento: "pendente" | "pago" | "parcial";
  dataPagamento?: string;
  valorPago?: number;
  // Cobrança de mão de obra
  cobrancaMaoDeObra?: any; // CobrancaConfig
  // Compat campos extras
  itens?: ServicoItem[];
  valorSubtotal?: number;
}

export type OrcamentoStatus = "enviado" | "aprovado" | "rejeitado";

export interface Orcamento {
  id: string;
  numero: number;
  clienteId: string;
  clienteNome: string;
  itens: ServicoItem[];
  materiais: MaterialItem[];
  equipamentos?: EquipamentoOS[]; // Equipamentos do orçamento (com problema/diagnóstico)
  gastosOperacionais: GastosOperacionais;
  // Desconto
  desconto?: {
    tipo: "percentual" | "fixo"; // percentual (%) ou fixo (R$)
    valor: number; // valor do desconto (percentual ou reais)
  };
  valorSubtotal: number; // Subtotal antes do desconto
  valorDesconto: number; // Valor do desconto em reais
  valorTotal: number; // Total após desconto
  status: OrcamentoStatus;
  observacoes: string;
  tecnicoResponsavel: string; // Nome do técnico responsável
  criadoEm: string;
  // Campos de pagamento
  statusPagamento: "pendente" | "pago" | "parcial";
  dataPagamento?: string;
  valorPago?: number;
  // Cobrança de mão de obra
  cobrancaMaoDeObra?: any; // CobrancaConfig
  // Opções de PDF
  incluirServicosNoPDF: boolean; // Se deve incluir serviços no PDF
  incluirMateriaisNoPDF: boolean; // Se deve incluir materiais no PDF
}

export interface FinanceiroEntry {
  id: string;
  tipo: "receita" | "despesa";
  descricao: string;
  valor: number;
  data: string;
  osId?: string;
}

export type EventoTipo = "compromisso" | "visita" | "manutencao" | "reuniao" | "outro";

export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  tipo: EventoTipo;
  data: string; // ISO format: YYYY-MM-DD
  hora: string; // HH:mm format
  clienteId?: string;
  clienteNome?: string;
  local?: string;
  notificacaoEnviada: boolean;
  criadoEm: string;
}

// ───── CARTEIRAS FINANCEIRAS ─────────────────────────────────────────
export interface Carteira {
  id: string;
  nome: string;
  percentual: number; // 0-100, soma de TODAS as ativas deve ser 100
  saldo: number; // saldo atual em R$ (atualizado em cada movimentação)
  cor: string; // hex
  ativa: boolean;
  saldoMinimo?: number; // alerta de saldo baixo (opcional)
  criadoEm: string;
  atualizadoEm: string;
}

export type TipoMovCarteira = "entrada" | "saida" | "transferencia_entrada" | "transferencia_saida" | "ajuste";

export interface MovimentacaoCarteira {
  id: string;
  carteiraId: string;
  tipo: TipoMovCarteira;
  valor: number; // sempre positivo (o tipo define se é + ou -)
  data: string; // ISO datetime
  descricao: string;
  origemId?: string; // ID da entrada/cobrança que originou
  contraparteCarteiraId?: string; // ID da outra carteira (transferências)
  saldoApos: number; // snapshot do saldo da carteira após a movimentação
}

// Storage keys
const KEYS = {
  CLIENTES: "@polar/clientes",
  OS: "@polar/os",
  ORCAMENTOS: "@polar/orcamentos",
  FINANCEIRO: "@polar/financeiro",
  ENTRADAS_AUTOMATICAS: "@polar/entradas_automaticas",
  SAIDAS_MANUAIS: "@polar/saidas_manuais",
  CONFIG_ENTRADA_AUTOMATICA: "@polar/config_entrada_automatica",
  EQUIPAMENTOS: "@polar/equipamentos",
  CONFIG: "@polar/config",
  NEXT_OS_NUM: "@polar/next_os_num",
  NEXT_ORC_NUM: "@polar/next_orc_num",
  EVENTOS: "@polar/eventos",
  COBRANCAS: "@polar/cobrancas",
  RECIBOS: "@polar/recibos",
  CARTEIRAS: "@polar/carteiras",
  MOV_CARTEIRAS: "@polar/mov_carteiras",
  SERVICOS_CADASTRADOS: "@polar/servicos_cadastrados",
};

// ───── CATÁLOGO DE SERVIÇOS (cadastrados para reuso em orçamentos/OS) ─────
export interface ServicoCadastrado {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  tempoEstimado?: string; // ex: "2h", "1 dia"
  valorBase: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

// Helper functions
async function getItems<T>(key: string): Promise<T[]> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function setItems<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

// Clientes
export async function getClientes(): Promise<Cliente[]> {
  return getItems<Cliente>(KEYS.CLIENTES);
}

export async function getClienteById(id: string): Promise<Cliente | null> {
  if (!id) return null;
  const clientes = await getClientes();
  return clientes.find((c) => c.id === id) || null;
}

export async function saveCliente(cliente: Cliente): Promise<void> {
  const clientes = await getClientes();
  const index = clientes.findIndex((c) => c.id === cliente.id);
  if (index >= 0) {
    clientes[index] = cliente;
  } else {
    clientes.push(cliente);
  }
  await setItems(KEYS.CLIENTES, clientes);
  schedulePush("clientes", cliente);
}

export async function deleteCliente(id: string): Promise<void> {
  const clientes = await getClientes();
  await setItems(KEYS.CLIENTES, clientes.filter((c) => c.id !== id));
  pushDelete("clientes", id);
}

// Ordens de Serviço
export async function getOrdens(): Promise<OrdemServico[]> {
  return getItems<OrdemServico>(KEYS.OS);
}

export async function saveOrdem(os: OrdemServico): Promise<void> {
  const ordens = await getOrdens();
  const index = ordens.findIndex((o) => o.id === os.id);
  if (index >= 0) {
    ordens[index] = os;
  } else {
    ordens.push(os);
  }
  await setItems(KEYS.OS, ordens);
  schedulePush("ordens", os);
}

export async function updateOrdem(os: OrdemServico): Promise<void> {
  await saveOrdem(os);
}

export async function deleteOrdem(id: string): Promise<void> {
  const ordens = await getOrdens();
  await setItems(KEYS.OS, ordens.filter((o) => o.id !== id));
  pushDelete("ordens", id);
}

export async function getNextOSNumber(): Promise<number> {
  const num = await AsyncStorage.getItem(KEYS.NEXT_OS_NUM);
  const next = num ? parseInt(num) : 1;
  await AsyncStorage.setItem(KEYS.NEXT_OS_NUM, String(next + 1));
  return next;
}

// Orçamentos
export async function getOrcamentos(): Promise<Orcamento[]> {
  return getItems<Orcamento>(KEYS.ORCAMENTOS);
}

export async function saveOrcamento(orc: Orcamento): Promise<void> {
  const orcamentos = await getOrcamentos();
  const index = orcamentos.findIndex((o) => o.id === orc.id);
  if (index >= 0) {
    orcamentos[index] = orc;
  } else {
    orcamentos.push(orc);
  }
  await setItems(KEYS.ORCAMENTOS, orcamentos);
  schedulePush("orcamentos", orc);
}

export async function updateOrcamento(orc: Orcamento): Promise<void> {
  await saveOrcamento(orc);
}

export async function deleteOrcamento(id: string): Promise<void> {
  const orcamentos = await getOrcamentos();
  await setItems(KEYS.ORCAMENTOS, orcamentos.filter((o) => o.id !== id));
  pushDelete("orcamentos", id);
}

export async function getNextOrcNumber(): Promise<number> {
  const num = await AsyncStorage.getItem(KEYS.NEXT_ORC_NUM);
  const next = num ? parseInt(num) : 1;
  await AsyncStorage.setItem(KEYS.NEXT_ORC_NUM, String(next + 1));
  return next;
}

// Financeiro
export async function getFinanceiro(): Promise<FinanceiroEntry[]> {
  return getItems<FinanceiroEntry>(KEYS.FINANCEIRO);
}

export async function saveFinanceiroEntry(entry: FinanceiroEntry): Promise<void> {
  const entries = await getFinanceiro();
  const index = entries.findIndex((e) => e.id === entry.id);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }
  await setItems(KEYS.FINANCEIRO, entries);
}

// Equipamentos
export async function getEquipamentos(): Promise<Equipamento[]> {
  return getItems<Equipamento>(KEYS.EQUIPAMENTOS);
}

export async function saveEquipamento(equip: Equipamento): Promise<void> {
  const equipamentos = await getEquipamentos();
  const index = equipamentos.findIndex((e) => e.id === equip.id);
  if (index >= 0) {
    equipamentos[index] = equip;
  } else {
    equipamentos.push(equip);
  }
  await setItems(KEYS.EQUIPAMENTOS, equipamentos);
  schedulePush("equipamentos", equip);
}

export async function updateEquipamento(equip: Equipamento): Promise<void> {
  // Alias semântico para saveEquipamento (que já trata update via findIndex)
  return saveEquipamento(equip);
}

export async function deleteEquipamento(id: string): Promise<void> {
  const equipamentos = await getEquipamentos();
  await setItems(KEYS.EQUIPAMENTOS, equipamentos.filter((e) => e.id !== id));
  try {
    const { remote } = await import("./api-client");
    await remote.delete("equipamentos", id);
  } catch {
    // ignora se offline
  }
}

// Empresa Config
export interface EmpresaConfig {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  estado: string;
  logo: string;
  tecnicoResponsavel?: string;
  assinatura?: string; // Base64 da assinatura
  metaMensal?: number; // Meta de faturamento mensal em R$
  registroProfissional?: string; // Ex: CREA-XX 12345, MTE 0001, etc
  termoGarantia?: string; // Termo personalizado que aparece no PDF
}

export async function getEmpresa(): Promise<EmpresaConfig | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CONFIG);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function saveEmpresa(config: EmpresaConfig): Promise<void> {
  await AsyncStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
  // Push empresa para o backend (não usa schedulePush porque tem endpoint próprio)
  try {
    const { remote } = await import("./api-client");
    setTimeout(() => {
      remote.empresa.update(config).catch(() => {});
    }, 500);
  } catch {}
}

// Eventos
export async function getEventos(): Promise<Evento[]> {
  return getItems<Evento>(KEYS.EVENTOS);
}

export async function getEventosPorData(data: string): Promise<Evento[]> {
  const eventos = await getEventos();
  return eventos.filter((e) => e.data === data).sort((a, b) => a.hora.localeCompare(b.hora));
}

export async function getEventosPorMes(ano: number, mes: number): Promise<Evento[]> {
  const eventos = await getEventos();
  const mesFormatado = String(mes).padStart(2, "0");
  const anoFormatado = String(ano);
  return eventos.filter((e) => e.data.startsWith(`${anoFormatado}-${mesFormatado}`));
}

export async function saveEvento(evento: Evento): Promise<void> {
  const eventos = await getEventos();
  const index = eventos.findIndex((e) => e.id === evento.id);
  if (index >= 0) {
    eventos[index] = evento;
  } else {
    eventos.push(evento);
  }
  await setItems(KEYS.EVENTOS, eventos);
  schedulePush("eventos", evento);
}

export async function deleteEvento(id: string): Promise<void> {
  const eventos = await getEventos();
  await setItems(KEYS.EVENTOS, eventos.filter((e) => e.id !== id));
  pushDelete("eventos", id);
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ========== FINANCEIRO AUTOMÁTICO ==========

// Entradas Automáticas
export async function getEntradasAutomaticas(): Promise<EntradaFinanceira[]> {
  return getItems<EntradaFinanceira>(KEYS.ENTRADAS_AUTOMATICAS);
}

export async function saveEntradaAutomatica(entrada: EntradaFinanceira): Promise<void> {
  const entradas = await getEntradasAutomaticas();
  const index = entradas.findIndex((e) => e.id === entrada.id);
  if (index >= 0) {
    entradas[index] = entrada;
  } else {
    entradas.push(entrada);
  }
  await setItems(KEYS.ENTRADAS_AUTOMATICAS, entradas);
  schedulePush("entradas", entrada);
}

export async function deleteEntradaAutomatica(id: string): Promise<void> {
  const entradas = await getEntradasAutomaticas();
  await setItems(KEYS.ENTRADAS_AUTOMATICAS, entradas.filter((e) => e.id !== id));
  pushDelete("entradas", id);
}

// Saídas Manuais
export async function getSaidasManuais(): Promise<SaidaFinanceira[]> {
  return getItems<SaidaFinanceira>(KEYS.SAIDAS_MANUAIS);
}

export async function saveSaidaManual(saida: SaidaFinanceira): Promise<void> {
  const saidas = await getSaidasManuais();
  const index = saidas.findIndex((s) => s.id === saida.id);
  if (index >= 0) {
    saidas[index] = saida;
  } else {
    saidas.push(saida);
  }
  await setItems(KEYS.SAIDAS_MANUAIS, saidas);
  schedulePush("saidas", saida);
}

export async function deleteSaidaManual(id: string): Promise<void> {
  const saidas = await getSaidasManuais();
  await setItems(KEYS.SAIDAS_MANUAIS, saidas.filter((s) => s.id !== id));
  pushDelete("saidas", id);
}

// Configuração de Entrada Automática
export async function getConfigEntradaAutomatica(): Promise<ConfiguracaoEntradaAutomatica | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CONFIG_ENTRADA_AUTOMATICA);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function saveConfigEntradaAutomatica(config: ConfiguracaoEntradaAutomatica): Promise<void> {
  await AsyncStorage.setItem(KEYS.CONFIG_ENTRADA_AUTOMATICA, JSON.stringify(config));
}

// Cobranças
export async function getCobrancas(): Promise<any[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.COBRANCAS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveCobranca(cobranca: any): Promise<void> {
  console.log('[DEBUG STORE] saveCobranca chamado');
  const cobrancas = await getCobrancas();
  console.log('[DEBUG STORE] Cobranças atuais:', cobrancas.length);
  const novaCobranca = {
    ...cobranca,
    id: cobranca.id || `cobranca_${Date.now()}`,
    criadoEm: cobranca.criadoEm || new Date().toISOString(),
  };
  cobrancas.push(novaCobranca);
  console.log('[DEBUG STORE] Total de cobranças após push:', cobrancas.length);
  await AsyncStorage.setItem(KEYS.COBRANCAS, JSON.stringify(cobrancas));
  console.log('[DEBUG STORE] Cobrança salva no AsyncStorage');
  schedulePush("cobrancas", novaCobranca);
  
  // Registrar automaticamente no financeiro como "Contas a Receber"
  try {
    const valorRecebido = novaCobranca.valorRecebido || (novaCobranca.status === "pago" ? novaCobranca.valorTotal : 0);
    const valorPendente = novaCobranca.valorTotal - valorRecebido;
    
    const entradaFinanceira: EntradaFinanceira = {
      id: `entrada_cobranca_${novaCobranca.id}`,
      data: novaCobranca.dataCriacao || new Date().toISOString().split('T')[0],
      clienteId: novaCobranca.clienteId,
      clienteNome: novaCobranca.clienteNome,
      orcamentoId: novaCobranca.orcamentoId,
      osId: novaCobranca.osId,
      descricao: novaCobranca.descricao,
      categoria: "servico",
      valorTotal: novaCobranca.valorTotal,
      valorRecebido: valorRecebido,
      valorPendente: valorPendente,
      formaPagamento: novaCobranca.formaPagamento || "",
      status: novaCobranca.status === "pago" ? "pago" : (valorRecebido > 0 ? "parcial" : "pendente"),
      dataVencimento: novaCobranca.dataVencimento,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
      origem: "manual",
    };
    await saveEntradaAutomatica(entradaFinanceira);
  } catch (error) {
    console.error('[DEBUG] Erro ao registrar entrada financeira:', error);
  }
}

export async function updateCobranca(id: string, updates: any): Promise<void> {
  try {
    const cobrancas = await getCobrancas();
    const index = cobrancas.findIndex((c) => c.id === id);
    if (index !== -1) {
      const cobrancaAtualizada = { ...cobrancas[index], ...updates };
      cobrancas[index] = cobrancaAtualizada;
      await AsyncStorage.setItem(KEYS.COBRANCAS, JSON.stringify(cobrancas));
      schedulePush("cobrancas", cobrancaAtualizada);
      
      // Atualizar também no financeiro
      try {
        const entradaId = `entrada_cobranca_${id}`;
        const entradas = await getEntradasAutomaticas();
        if (entradas && Array.isArray(entradas)) {
          const indexEntrada = entradas.findIndex((e) => e.id === entradaId);
          if (indexEntrada !== -1) {
            entradas[indexEntrada] = {
              ...entradas[indexEntrada],
              valorRecebido: cobrancaAtualizada.valorRecebido || 0,
              valorPendente: cobrancaAtualizada.valorPendente || cobrancaAtualizada.valorTotal,
              status: cobrancaAtualizada.status === "pago" ? "pago" : "pendente",
              atualizado_em: new Date().toISOString(),
            };
            await setItems(KEYS.ENTRADAS_AUTOMATICAS, entradas);
          }
        }
      } catch (financError) {
        console.warn("Aviso: Erro ao atualizar financeiro automaticamente", financError);
        // Não falha a operação se o financeiro não atualizar
      }
    }
  } catch (error) {
    console.error("Erro ao atualizar cobrança:", error);
    throw error;
  }
}

export async function deleteCobranca(id: string): Promise<void> {
  const cobrancas = await getCobrancas();
  await AsyncStorage.setItem(KEYS.COBRANCAS, JSON.stringify(cobrancas.filter((c) => c.id !== id)));
  pushDelete("cobrancas", id);
  
  // Deletar também do financeiro
  const entradaId = `entrada_cobranca_${id}`;
  await deleteEntradaAutomatica(entradaId);
}


// ========== RECIBOS ==========

export interface Recibo {
  id: string;
  cobrancaId: string;
  clienteNome: string;
  clienteEmail?: string;
  clienteTelefone?: string;
  descricao: string;
  valorTotal: number;
  valorRecebido: number;
  dataPagamento: string;
  dataEmissao: string;
  metodoPagamento: string;
  observacoes?: string;
  empresaNome: string;
  empresaCNPJ?: string;
  empresaTelefone?: string;
  criadoEm: string;
  pdfUri?: string;
}

export async function getRecibos(): Promise<Recibo[]> {
  return getItems<Recibo>(KEYS.RECIBOS);
}

export async function saveRecibo(recibo: Recibo): Promise<void> {
  const recibos = await getRecibos();
  const index = recibos.findIndex((r) => r.id === recibo.id);
  if (index >= 0) {
    recibos[index] = recibo;
  } else {
    recibos.push(recibo);
  }
  await setItems(KEYS.RECIBOS, recibos);
  schedulePush("recibos", recibo);
}

export async function deleteRecibo(id: string): Promise<void> {
  const recibos = await getRecibos();
  await setItems(KEYS.RECIBOS, recibos.filter((r) => r.id !== id));
  pushDelete("recibos", id);
}

export async function getRecibosByCobranca(cobrancaId: string): Promise<Recibo[]> {
  const recibos = await getRecibos();
  return recibos.filter((r) => r.cobrancaId === cobrancaId);
}


// ═══════════════════════════════════════════════════════════════════
// CARTEIRAS FINANCEIRAS
// ═══════════════════════════════════════════════════════════════════
export async function getCarteiras(): Promise<Carteira[]> {
  return getItems<Carteira>(KEYS.CARTEIRAS);
}

export async function getCarteiraById(id: string): Promise<Carteira | null> {
  const lst = await getCarteiras();
  return lst.find((c) => c.id === id) || null;
}

export async function saveCarteira(c: Carteira): Promise<void> {
  const lst = await getCarteiras();
  const i = lst.findIndex((x) => x.id === c.id);
  if (i >= 0) lst[i] = c;
  else lst.push(c);
  await setItems(KEYS.CARTEIRAS, lst);
  schedulePush("carteiras", c);
}

export async function deleteCarteira(id: string): Promise<void> {
  const lst = await getCarteiras();
  await setItems(KEYS.CARTEIRAS, lst.filter((c) => c.id !== id));
  // Mantemos as movimentações para histórico
  pushDelete("carteiras", id);
}

export async function getMovimentacoesCarteira(carteiraId?: string): Promise<MovimentacaoCarteira[]> {
  const lst = await getItems<MovimentacaoCarteira>(KEYS.MOV_CARTEIRAS);
  return carteiraId ? lst.filter((m) => m.carteiraId === carteiraId) : lst;
}

export async function saveMovimentacaoCarteira(m: MovimentacaoCarteira): Promise<void> {
  const lst = await getItems<MovimentacaoCarteira>(KEYS.MOV_CARTEIRAS);
  lst.push(m);
  await setItems(KEYS.MOV_CARTEIRAS, lst);
  schedulePush("mov_carteiras", m);
}

export async function deleteMovimentacaoCarteira(id: string): Promise<void> {
  const lst = await getItems<MovimentacaoCarteira>(KEYS.MOV_CARTEIRAS);
  const mov = lst.find((m) => m.id === id);
  if (mov) {
    // Reverte saldo da carteira
    const c = await getCarteiraById(mov.carteiraId);
    if (c) {
      const sinal = mov.tipo === "entrada" || mov.tipo === "transferencia_entrada" ? -1 : 1;
      c.saldo += sinal * mov.valor;
      c.atualizadoEm = new Date().toISOString();
      await saveCarteira(c);
    }
  }
  await setItems(KEYS.MOV_CARTEIRAS, lst.filter((m) => m.id !== id));
  pushDelete("mov_carteiras", id);
}

/**
 * Distribui um valor de entrada entre todas as carteiras ATIVAS,
 * proporcionalmente aos seus percentuais. Atualiza saldos e gera movimentações.
 * Idempotente por origemId (se já tiver sido distribuída, retorna sem fazer nada).
 */
export async function distribuirEntrada(
  valor: number,
  descricao: string,
  origemId?: string,
): Promise<{ distribuido: number; carteirasAfetadas: number; jaDistribuido?: boolean }> {
  if (!valor || valor <= 0) return { distribuido: 0, carteirasAfetadas: 0 };

  // Idempotência: se já existe movimentação com este origemId, não distribui de novo
  if (origemId) {
    const movs = await getItems<MovimentacaoCarteira>(KEYS.MOV_CARTEIRAS);
    if (movs.some((m) => m.origemId === origemId && m.tipo === "entrada")) {
      return { distribuido: 0, carteirasAfetadas: 0, jaDistribuido: true };
    }
  }

  const carteiras = (await getCarteiras()).filter((c) => c.ativa);
  if (carteiras.length === 0) return { distribuido: 0, carteirasAfetadas: 0 };

  // Normaliza percentuais (se soma != 100 redistribui proporcionalmente)
  const somaPct = carteiras.reduce((s, c) => s + (c.percentual || 0), 0);
  if (somaPct <= 0) return { distribuido: 0, carteirasAfetadas: 0 };

  let distribuidoTotal = 0;
  const movs: MovimentacaoCarteira[] = [];

  carteiras.forEach((c, idx) => {
    const parte = (valor * (c.percentual || 0)) / somaPct;
    // Última carteira pega o resíduo (evita perda de centavos)
    const valorFinal = idx === carteiras.length - 1 ? valor - distribuidoTotal : Math.round(parte * 100) / 100;
    distribuidoTotal += valorFinal;
    c.saldo = Math.round((c.saldo + valorFinal) * 100) / 100;
    c.atualizadoEm = new Date().toISOString();
    movs.push({
      id: `mov_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
      carteiraId: c.id,
      tipo: "entrada",
      valor: valorFinal,
      data: new Date().toISOString(),
      descricao,
      origemId,
      saldoApos: c.saldo,
    });
  });

  // Persiste tudo
  await setItems(KEYS.CARTEIRAS, await mergeCarteiras(carteiras));
  const todasMovs = await getItems<MovimentacaoCarteira>(KEYS.MOV_CARTEIRAS);
  await setItems(KEYS.MOV_CARTEIRAS, [...todasMovs, ...movs]);
  for (const m of movs) schedulePush("mov_carteiras", m);
  for (const c of carteiras) schedulePush("carteiras", c);

  return { distribuido: distribuidoTotal, carteirasAfetadas: carteiras.length };
}

async function mergeCarteiras(atualizadas: Carteira[]): Promise<Carteira[]> {
  const todas = await getCarteiras();
  const map = new Map(todas.map((c) => [c.id, c]));
  for (const c of atualizadas) map.set(c.id, c);
  return Array.from(map.values());
}

/**
 * Transfere valor de uma carteira para outra. Cria 2 movimentações.
 */
export async function transferirEntreCarteiras(
  origemId: string,
  destinoId: string,
  valor: number,
  descricao: string,
): Promise<{ ok: boolean; mensagem?: string }> {
  if (!valor || valor <= 0) return { ok: false, mensagem: "Valor inválido" };
  if (origemId === destinoId) return { ok: false, mensagem: "Carteira origem e destino devem ser diferentes" };

  const origem = await getCarteiraById(origemId);
  const destino = await getCarteiraById(destinoId);
  if (!origem || !destino) return { ok: false, mensagem: "Carteira não encontrada" };
  if (origem.saldo < valor) return { ok: false, mensagem: `Saldo insuficiente em ${origem.nome}` };

  origem.saldo = Math.round((origem.saldo - valor) * 100) / 100;
  destino.saldo = Math.round((destino.saldo + valor) * 100) / 100;
  origem.atualizadoEm = destino.atualizadoEm = new Date().toISOString();
  await saveCarteira(origem);
  await saveCarteira(destino);

  const dataIso = new Date().toISOString();
  const base = Date.now();
  await saveMovimentacaoCarteira({
    id: `mov_${base}_o`,
    carteiraId: origemId,
    tipo: "transferencia_saida",
    valor,
    data: dataIso,
    descricao: descricao || `Transferência → ${destino.nome}`,
    contraparteCarteiraId: destinoId,
    saldoApos: origem.saldo,
  });
  await saveMovimentacaoCarteira({
    id: `mov_${base}_d`,
    carteiraId: destinoId,
    tipo: "transferencia_entrada",
    valor,
    data: dataIso,
    descricao: descricao || `Transferência ← ${origem.nome}`,
    contraparteCarteiraId: origemId,
    saldoApos: destino.saldo,
  });

  return { ok: true };
}

/**
 * Cria movimentação de saída/ajuste manual em uma carteira específica.
 */
export async function lancarMovimentacaoCarteira(
  carteiraId: string,
  tipo: "saida" | "entrada" | "ajuste",
  valor: number,
  descricao: string,
): Promise<{ ok: boolean; mensagem?: string }> {
  if (!valor || valor <= 0) return { ok: false, mensagem: "Valor inválido" };
  const c = await getCarteiraById(carteiraId);
  if (!c) return { ok: false, mensagem: "Carteira não encontrada" };

  const sinal = tipo === "saida" ? -1 : 1;
  if (tipo === "saida" && c.saldo < valor) {
    return { ok: false, mensagem: "Saldo insuficiente" };
  }
  c.saldo = Math.round((c.saldo + sinal * valor) * 100) / 100;
  c.atualizadoEm = new Date().toISOString();
  await saveCarteira(c);
  await saveMovimentacaoCarteira({
    id: `mov_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    carteiraId,
    tipo,
    valor,
    data: new Date().toISOString(),
    descricao,
    saldoApos: c.saldo,
  });

  return { ok: true };
}
