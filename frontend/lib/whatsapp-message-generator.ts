import { Orcamento, ServicoItem, MaterialItem, EmpresaConfig } from "./store";

interface WhatsAppMessageData {
  orcamento: Orcamento;
  cliente: { nome: string; telefone?: string };
  servicos?: ServicoItem[];
  materiais?: MaterialItem[];
  empresa?: EmpresaConfig | null;
  tecnico?: string;
}

/**
 * Formata um valor em BRL
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Gera uma mensagem WhatsApp formatada com serviços, materiais e valores
 */
export function generateWhatsAppMessage(data: WhatsAppMessageData): string {
  const empresaNome = data.empresa?.nome || 'Polar Soluções';
  const clienteNome = data.cliente.nome;
  const numeroOrcamento = data.orcamento.numero;
  const dataOrcamento = new Date(data.orcamento.criadoEm).toLocaleDateString('pt-BR');

  let mensagem = '';

  // Cabeçalho
  mensagem += `🔧 *${empresaNome}*\n`;
  mensagem += `📋 *Orçamento #${numeroOrcamento}*\n\n`;

  // Cliente e Data
  mensagem += `👤 *Cliente:* ${clienteNome}\n`;
  mensagem += `📅 *Data:* ${dataOrcamento}\n\n`;

  // Equipamentos (se houver)
  const equipamentos = (data.orcamento as any).equipamentos as any[] | undefined;
  if (equipamentos && equipamentos.length > 0) {
    mensagem += `🛠 *Equipamento${equipamentos.length > 1 ? 's' : ''}:*\n`;
    equipamentos.forEach((eq, idx) => {
      const numero = String(idx + 1).padStart(2, '0');
      const titulo = eq.tipo || [eq.marca, eq.modelo].filter(Boolean).join(' ') || `Equipamento ${numero}`;
      mensagem += `${numero}. *${titulo}*\n`;
      const linhaTec = [
        eq.marca ? `Marca: ${eq.marca}` : null,
        eq.modelo ? `Modelo: ${eq.modelo}` : null,
        eq.serie ? `Série: ${eq.serie}` : null,
      ].filter(Boolean).join(' • ');
      if (linhaTec) mensagem += `   ${linhaTec}\n`;
      if (eq.problema) mensagem += `   _Problema:_ ${eq.problema}\n`;
      if (eq.diagnostico) mensagem += `   _Diagnóstico:_ ${eq.diagnostico}\n`;
    });
    mensagem += '\n';
  }

  // Serviços (com gastos operacionais diluídos)
  if (data.orcamento.itens && data.orcamento.itens.length > 0) {
    const totalServicos = data.orcamento.itens.reduce(
      (s: number, i: any) => s + (i.valor || 0) * (i.quantidade || 0),
      0,
    );
    const g = (data.orcamento as any).gastosOperacionais || {};
    const totalGastos =
      (g.transporte || 0) + (g.alimentacao || 0) + (g.hospedagem || 0) + (g.outros || 0);

    mensagem += `💼 *Serviços:*\n`;
    data.orcamento.itens.forEach((item, index) => {
      const valorBase = item.valor * item.quantidade;
      const proporcao = totalServicos > 0 ? valorBase / totalServicos : 0;
      const gastoAlocado = totalGastos * proporcao;
      const valorFinal = valorBase + gastoAlocado;
      const desc = 'descricao' in item ? item.descricao : 'Serviço';
      mensagem += `${index + 1}. ${desc} - ${formatCurrency(valorFinal)}\n`;
    });
    mensagem += '\n';
  }

  // Materiais
  if (data.orcamento.materiais && data.orcamento.materiais.length > 0) {
    mensagem += `🔩 *Materiais:*\n`;
    data.orcamento.materiais.forEach((material, index) => {
      const base = material.valorUnitario * material.quantidade;
      const lucro = base * ((material.lucroPercent || 0) / 100);
      const valorComLucro = base + lucro + (material.frete || 0);
      const desc = 'descricao' in material ? material.descricao : 'Material';
      mensagem += `${index + 1}. ${desc} - ${formatCurrency(valorComLucro)}\n`;
    });
    mensagem += '\n';
  }

  // Subtotal + Desconto destacado + Total
  const orc = data.orcamento as any;
  const valorSubtotal: number = orc.valorSubtotal ?? data.orcamento.valorTotal;
  const valorDesconto: number = orc.valorDesconto ?? 0;
  const desconto = orc.desconto as { tipo: 'percentual' | 'fixo'; valor: number } | undefined;

  if (valorDesconto > 0 && desconto) {
    mensagem += `🧾 *Subtotal:* ${formatCurrency(valorSubtotal)}\n`;
    const labelDesc = desconto.tipo === 'percentual'
      ? `Desconto especial (${desconto.valor}%)`
      : `Desconto especial`;
    mensagem += `🎁 *${labelDesc}:* -${formatCurrency(valorDesconto)}\n`;
    const economia = ((valorDesconto / valorSubtotal) * 100).toFixed(0);
    mensagem += `💰 *VALOR FINAL:* ${formatCurrency(data.orcamento.valorTotal)}\n`;
    mensagem += `✨ _Você economiza ${economia}% aprovando este orçamento!_\n\n`;
  } else {
    mensagem += `💰 *Total: ${formatCurrency(data.orcamento.valorTotal)}*\n\n`;
  }

  // Resumo de Pagamento (sobre o valor final com desconto)
  const entrada = data.orcamento.valorTotal / 2;
  const saldo = data.orcamento.valorTotal - entrada;
  mensagem += `💳 *Resumo do Pagamento:*\n`;
  mensagem += `• Entrada (50%): ${formatCurrency(entrada)}\n`;
  mensagem += `• Saldo (50%): ${formatCurrency(saldo)}\n`;
  mensagem += `• Formas: PIX, Transferência ou Cartão\n\n`;

  // Rodapé
  mensagem += `Aguardamos sua aprovação! ✅\n\n`;
  mensagem += `📞 Contato: ${data.empresa?.telefone || '(11) 98707-1234'}\n`;
  mensagem += `📧 Email: ${data.empresa?.email || 'contato@polarsolucoes.com.br'}`;

  return mensagem;
}

/**
 * Abre o WhatsApp com a mensagem pré-preenchida
 */
export function openWhatsAppWithMessage(
  phoneNumber: string,
  message: string,
  onWeb?: boolean
): void {
  // Remove caracteres não numéricos do telefone
  const cleanPhone = phoneNumber.replace(/\D/g, '');

  // Formata para o padrão internacional (55 para Brasil)
  let formattedPhone = cleanPhone;
  if (!formattedPhone.startsWith('55')) {
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '55' + formattedPhone.substring(1);
    } else {
      formattedPhone = '55' + formattedPhone;
    }
  }

  // Codifica a mensagem para URL
  const encodedMessage = encodeURIComponent(message);

  // Cria o link do WhatsApp
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

  // Abre o link
  if (onWeb && typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank');
  } else if (!onWeb) {
    // No React Native, usar Linking (importado dinamicamente para compatibilidade com testes)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Linking } = require('react-native');
      Linking.openURL(whatsappUrl);
    } catch (e) {
      console.error('Erro ao abrir WhatsApp:', e);
    }
  }
}
