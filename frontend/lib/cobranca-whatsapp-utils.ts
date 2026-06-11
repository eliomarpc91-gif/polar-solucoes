/**
 * Utilities para geração de mensagens WhatsApp
 */

import { Cobranca, ConfiguracaoCobranca } from "./cobranca-types";

/**
 * Formata a data para exibição
 */
export function formatarDataBR(data?: string | null): string {
  if (!data || typeof data !== "string") return "—";
  const partes = data.split("T")[0].split("-");
  if (partes.length !== 3) return data;
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata valor em moeda
 */
export function formatarMoedaBR(valor: number): string {
  return `R$ ${valor.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

/**
 * Gera mensagem de cobrança normal
 */
export function gerarMensagemCobrancaNormal(
  cobranca: Cobranca,
  config: ConfiguracaoCobranca
): string {
  const formaPagamentoLabel = {
    pix: "PIX",
    boleto: "Boleto",
    cartao_credito: "Cartão de Crédito",
    dinheiro: "Dinheiro",
    transferencia: "Transferência Bancária",
  }[cobranca.formaPagamento];

  let mensagem = `Olá, ${cobranca.clienteNome}! 👋\n\n`;
  mensagem += `Segue sua cobrança:\n\n`;
  mensagem += `💰 Valor: ${formatarMoedaBR(cobranca.valorTotal)}\n`;
  mensagem += `📅 Vencimento: ${formatarDataBR(cobranca.dataVencimento)}\n`;
  mensagem += `💳 Forma de pagamento: ${formaPagamentoLabel}\n\n`;

  if (cobranca.descricao) {
    mensagem += `📝 Descrição:\n${cobranca.descricao}\n\n`;
  }

  // Adicionar referências de orçamento ou OS
  if (cobranca.orcamentoNumero) {
    mensagem += `📄 Orçamento nº ${cobranca.orcamentoNumero}\n`;
  }
  if (cobranca.osNumero) {
    mensagem += `📋 OS nº ${cobranca.osNumero}\n`;
  }

  if (cobranca.orcamentoNumero || cobranca.osNumero) {
    mensagem += `\n`;
  }

  // Adicionar dados de pagamento
  if (cobranca.formaPagamento === "pix" && config.chavePix) {
    mensagem += `🔑 Chave PIX:\n${config.chavePix}\n\n`;
  } else if (cobranca.formaPagamento === "transferencia") {
    if (config.bancoNome) mensagem += `🏦 Banco: ${config.bancoNome}\n`;
    if (config.numeroAgencia) mensagem += `🏦 Agência: ${config.numeroAgencia}\n`;
    if (config.numeroConta) mensagem += `🏦 Conta: ${config.numeroConta}\n`;
    mensagem += `\n`;
  }

  mensagem += `Qualquer dúvida, estou à disposição! 😊\n`;

  if (config.telefonEmpresa) {
    mensagem += `\n📞 ${config.telefonEmpresa}`;
  }

  return mensagem;
}

/**
 * Gera mensagem de lembrete antes do vencimento
 */
export function gerarMensagemLembreteVencimento(
  cobranca: Cobranca,
  config: ConfiguracaoCobranca
): string {
  const diasRestantes = calcularDiasRestantes(cobranca.dataVencimento);

  let mensagem = `Olá, ${cobranca.clienteNome}! 👋\n\n`;
  mensagem += `⏰ Lembrete: Sua cobrança vence em ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}!\n\n`;
  mensagem += `💰 Valor: ${formatarMoedaBR(cobranca.valorTotal)}\n`;
  mensagem += `📅 Vencimento: ${formatarDataBR(cobranca.dataVencimento)}\n\n`;

  if (cobranca.formaPagamento === "pix" && config.chavePix) {
    mensagem += `🔑 Chave PIX:\n${config.chavePix}\n\n`;
  }

  mensagem += `Não deixe para a última hora! 😊\n`;

  if (config.telefonEmpresa) {
    mensagem += `\n📞 ${config.telefonEmpresa}`;
  }

  return mensagem;
}

/**
 * Gera mensagem de cobrança vencida
 */
export function gerarMensagemCobrancaVencida(
  cobranca: Cobranca,
  config: ConfiguracaoCobranca
): string {
  const diasVencidos = calcularDiasVencidos(cobranca.dataVencimento);
  let jurosAcumulado = 0;
  let multaAcumulada = 0;

  if (config.aplicarJurosAutomatico && cobranca.juros > 0) {
    jurosAcumulado = (cobranca.valorTotal * cobranca.juros * diasVencidos) / 100 / 30;
  }

  if (config.aplicarMultaAutomatico && cobranca.multa > 0) {
    multaAcumulada = cobranca.multa;
  }

  const valorAtualizado = cobranca.valorTotal + jurosAcumulado + multaAcumulada;

  let mensagem = `Olá, ${cobranca.clienteNome}! ⚠️\n\n`;
  mensagem += `Sua cobrança está VENCIDA há ${diasVencidos} ${diasVencidos === 1 ? "dia" : "dias"}!\n\n`;
  mensagem += `💰 Valor original: ${formatarMoedaBR(cobranca.valorTotal)}\n`;

  if (jurosAcumulado > 0) {
    mensagem += `📈 Juros acumulados: ${formatarMoedaBR(jurosAcumulado)}\n`;
  }

  if (multaAcumulada > 0) {
    mensagem += `⚠️ Multa: ${formatarMoedaBR(multaAcumulada)}\n`;
  }

  mensagem += `\n💳 Valor total atualizado: ${formatarMoedaBR(valorAtualizado)}\n`;
  mensagem += `📅 Vencimento: ${formatarDataBR(cobranca.dataVencimento)}\n\n`;

  if (cobranca.formaPagamento === "pix" && config.chavePix) {
    mensagem += `🔑 Chave PIX:\n${config.chavePix}\n\n`;
  }

  mensagem += `Por favor, regularize sua situação o quanto antes! 🙏\n`;

  if (config.telefonEmpresa) {
    mensagem += `\n📞 ${config.telefonEmpresa}`;
  }

  return mensagem;
}

/**
 * Gera mensagem de confirmação de pagamento
 */
export function gerarMensagemConfirmacaoPagamento(
  cobranca: Cobranca,
  valorPago: number,
  config: ConfiguracaoCobranca
): string {
  const isPagamentoTotal = valorPago >= cobranca.valorTotal;

  let mensagem = `Olá, ${cobranca.clienteNome}! ✅\n\n`;
  mensagem += `${isPagamentoTotal ? "Pagamento recebido com sucesso!" : "Pagamento parcial recebido!"}\n\n`;
  mensagem += `💰 Valor recebido: ${formatarMoedaBR(valorPago)}\n`;

  if (!isPagamentoTotal) {
    const saldoPendente = cobranca.valorTotal - valorPago;
    mensagem += `📌 Saldo pendente: ${formatarMoedaBR(saldoPendente)}\n`;
  }

  mensagem += `\n📅 Data: ${formatarDataBR(new Date().toISOString().split("T")[0])}\n`;
  mensagem += `\nObrigado! 🙏\n`;

  if (config.telefonEmpresa) {
    mensagem += `\n📞 ${config.telefonEmpresa}`;
  }

  return mensagem;
}

/**
 * Gera mensagem de cobrança parcial
 */
export function gerarMensagemCobrancaParcial(
  cobranca: Cobranca,
  config: ConfiguracaoCobranca
): string {
  let mensagem = `Olá, ${cobranca.clienteNome}! 👋\n\n`;
  mensagem += `Segue sua cobrança:\n\n`;
  mensagem += `💰 Valor total: ${formatarMoedaBR(cobranca.valorTotal)}\n`;
  mensagem += `✅ Já recebido: ${formatarMoedaBR(cobranca.valorRecebido)}\n`;
  mensagem += `⏳ Saldo pendente: ${formatarMoedaBR(cobranca.valorPendente)}\n`;
  mensagem += `📅 Vencimento: ${formatarDataBR(cobranca.dataVencimento)}\n\n`;

  if (cobranca.formaPagamento === "pix" && config.chavePix) {
    mensagem += `🔑 Chave PIX:\n${config.chavePix}\n\n`;
  }

  mensagem += `Falta pouco para quitar! 💪\n`;

  if (config.telefonEmpresa) {
    mensagem += `\n📞 ${config.telefonEmpresa}`;
  }

  return mensagem;
}

/**
 * Calcula dias restantes até o vencimento
 */
export function calcularDiasRestantes(dataVencimento: string): number {
  const hoje = new Date();
  const vencimento = new Date(dataVencimento);
  const diferenca = vencimento.getTime() - hoje.getTime();
  return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
}

/**
 * Calcula dias vencidos
 */
export function calcularDiasVencidos(dataVencimento: string): number {
  const hoje = new Date();
  const vencimento = new Date(dataVencimento);
  const diferenca = hoje.getTime() - vencimento.getTime();
  return Math.floor(diferenca / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se cobrança está vencida
 */
export function estaVencida(dataVencimento: string): boolean {
  return calcularDiasVencidos(dataVencimento) > 0;
}

/**
 * Gera URL para abrir WhatsApp com mensagem
 */
export function gerarURLWhatsApp(telefone: string, mensagem: string): string {
  // Remove caracteres especiais do telefone
  const telefoneLimpo = telefone.replace(/\D/g, "");

  // Codifica a mensagem
  const mensagemCodificada = encodeURIComponent(mensagem);

  // Retorna URL do WhatsApp Web
  return `https://wa.me/${telefoneLimpo}?text=${mensagemCodificada}`;
}

/**
 * Valida telefone
 */
export function validarTelefone(telefone: string): boolean {
  const telefoneLimpo = telefone.replace(/\D/g, "");
  // Deve ter pelo menos 10 dígitos (formato brasileiro)
  return telefoneLimpo.length >= 10;
}
