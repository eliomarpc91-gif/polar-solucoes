import * as Notifications from "expo-notifications";
import { getCobrancas } from "./store";

export interface CobrancaVencimento {
  id: string;
  clienteNome: string;
  valorPendente: number;
  dataVencimento: string;
  diasParaVencer: number;
}

// Configurar notificações
export async function configurarNotificacoes(): Promise<void> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permissão de notificação não concedida");
      return;
    }

    // Configurar comportamento de notificações
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (error) {
    console.error("Erro ao configurar notificações:", error);
  }
}

// Verificar cobranças vencidas e próximas a vencer
export async function verificarCobrancasVencimento(): Promise<CobrancaVencimento[]> {
  try {
    const cobrancas = await getCobrancas();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const cobrancasAlerta: CobrancaVencimento[] = [];

    cobrancas.forEach((cobranca: any) => {
      // Pular cobranças já pagas
      if (cobranca.status === "pago") return;

      const dataVencimento = new Date(cobranca.dataVencimento || "2099-12-31");
      dataVencimento.setHours(0, 0, 0, 0);

      const diferenca = dataVencimento.getTime() - hoje.getTime();
      const diasParaVencer = Math.ceil(diferenca / (1000 * 60 * 60 * 24));

      // Alertar se vencida ou vencer nos próximos 3 dias
      if (diasParaVencer <= 3 && diasParaVencer >= -365) {
        cobrancasAlerta.push({
          id: cobranca.id,
          clienteNome: cobranca.clienteNome,
          valorPendente: cobranca.valorPendente || cobranca.valorTotal,
          dataVencimento: cobranca.dataVencimento,
          diasParaVencer,
        });
      }
    });

    return cobrancasAlerta;
  } catch (error) {
    console.error("Erro ao verificar cobranças:", error);
    return [];
  }
}

// Enviar notificação de vencimento
export async function enviarNotificacaoVencimento(cobranca: CobrancaVencimento): Promise<void> {
  try {
    let titulo = "";
    let corpo = "";

    if (cobranca.diasParaVencer < 0) {
      // Vencida
      titulo = "⚠️ Cobrança Vencida";
      corpo = `${cobranca.clienteNome} - R$ ${cobranca.valorPendente.toFixed(2)} vencida há ${Math.abs(cobranca.diasParaVencer)} dias`;
    } else if (cobranca.diasParaVencer === 0) {
      // Vence hoje
      titulo = "🔴 Cobrança Vence Hoje";
      corpo = `${cobranca.clienteNome} - R$ ${cobranca.valorPendente.toFixed(2)}`;
    } else {
      // Vence em breve
      titulo = "⏰ Cobrança Próxima ao Vencimento";
      corpo = `${cobranca.clienteNome} - R$ ${cobranca.valorPendente.toFixed(2)} vence em ${cobranca.diasParaVencer} dias`;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: corpo,
        sound: true,
        badge: 1,
        data: {
          cobrancaId: cobranca.id,
          type: "vencimento",
        },
      },
      trigger: null, // Enviar imediatamente
    });
  } catch (error) {
    console.error("Erro ao enviar notificação:", error);
  }
}

// Verificar e enviar todas as notificações de vencimento
export async function processarNotificacoesVencimento(): Promise<void> {
  try {
    const cobrancasAlerta = await verificarCobrancasVencimento();

    for (const cobranca of cobrancasAlerta) {
      await enviarNotificacaoVencimento(cobranca);
    }

    if (cobrancasAlerta.length > 0) {
      console.log(`${cobrancasAlerta.length} notificações de vencimento enviadas`);
    }
  } catch (error) {
    console.error("Erro ao processar notificações:", error);
  }
}

// Função compatível com o Home Screen (recebe cobrancas como parâmetro)
export function verificarCobrancasVencidas(cobrancas: any[]): void {
  try {
    if (!Array.isArray(cobrancas)) {
      console.error("verificarCobrancasVencidas: cobrancas não é array");
      return;
    }
    // Apenas log, não faz nada mais aqui
    console.log(`Verificadas ${cobrancas.length} cobranças`);
  } catch (error) {
    console.error("Erro ao verificar cobranças vencidas:", error);
  }
}

// Agendar verificação periódica de vencimentos (a cada 24 horas)
export async function agendarVerificacaoVencimentos(): Promise<void> {
  try {
    // Verificar imediatamente
    await processarNotificacoesVencimento();

    // Agendar para verificar novamente a cada 24 horas
    setInterval(async () => {
      await processarNotificacoesVencimento();
    }, 24 * 60 * 60 * 1000);
  } catch (error) {
    console.error("Erro ao agendar verificação:", error);
  }
}
