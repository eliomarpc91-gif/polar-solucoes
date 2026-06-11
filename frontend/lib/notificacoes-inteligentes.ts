/**
 * Agenda notificações locais para cobranças vencendo,
 * orçamentos em aberto e agendamentos do dia.
 *
 * Roda na inicialização do app e a cada vez que o app entra em foreground.
 */
import * as Notifications from "expo-notifications";
import {
  getCobrancas,
  getOrcamentos,
  getEventos,
  getOrdens,
} from "./store";

async function ensurePermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const res = await Notifications.requestPermissionsAsync();
  return res.status === "granted";
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}
function tomorrowIso(): string {
  return new Date(Date.now() + 86400000).toISOString().split("T")[0];
}

export async function checkAndScheduleSmartNotifications() {
  try {
    const ok = await ensurePermission();
    if (!ok) return;

    const [cobs, orcs, evs, oss] = await Promise.all([
      getCobrancas(),
      getOrcamentos(),
      getEventos(),
      getOrdens(),
    ]);

    const hoje = todayIso();
    const amanha = tomorrowIso();

    // ===== Cobranças vencendo hoje ou já vencidas =====
    const cobrancasUrgentes = (cobs || []).filter(
      (c: any) =>
        (c.status === "pendente" || c.status === "parcial") &&
        c.dataVencimento &&
        c.dataVencimento <= hoje,
    );
    if (cobrancasUrgentes.length > 0) {
      const total = cobrancasUrgentes.reduce(
        (s: number, c: any) =>
          s + (c.valorPendente ?? (c.valorTotal || 0) - (c.valorRecebido || 0)),
        0,
      );
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `💰 ${cobrancasUrgentes.length} cobranças a receber`,
          body: `Você tem R$ ${total.toFixed(2)} em cobranças vencidas ou vencendo hoje.`,
          data: { route: "/cobrancas" },
        },
        trigger: null, // disparar agora
      });
    }

    // ===== Orçamentos em aberto há mais de 3 dias =====
    const tresDiasAtras = new Date(Date.now() - 3 * 86400000).toISOString();
    const orcamentosParados = (orcs || []).filter(
      (o: any) =>
        (o.status === "enviado" || o.status === "rascunho") &&
        (o.criadoEm || o.dataCriacao || "") <= tresDiasAtras,
    );
    if (orcamentosParados.length > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `📄 ${orcamentosParados.length} orçamento(s) aguardando`,
          body: `Há orçamentos enviados há mais de 3 dias sem resposta do cliente.`,
          data: { route: "/orcamentos-lista" },
        },
        trigger: null,
      });
    }

    // ===== Agendamentos amanhã (eventos + OS agendadas) =====
    const eventosAmanha = (evs || []).filter((e: any) => e.data === amanha);
    const ossAmanha = (oss || []).filter((o: any) => o.dataAgendada?.startsWith(amanha));
    const totalAmanha = eventosAmanha.length + ossAmanha.length;
    if (totalAmanha > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `📅 ${totalAmanha} agendamento(s) amanhã`,
          body: `Você tem ${totalAmanha} compromisso(s) programado(s) para amanhã. Confira a agenda.`,
          data: { route: "/agenda" },
        },
        trigger: null,
      });
    }

    // ===== Agendamentos de HOJE =====
    const eventosHoje = (evs || []).filter((e: any) => e.data === hoje);
    const ossHoje = (oss || []).filter((o: any) => o.dataAgendada?.startsWith(hoje));
    const totalHoje = eventosHoje.length + ossHoje.length;
    if (totalHoje > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🔧 ${totalHoje} serviço(s) hoje`,
          body: `Você tem ${totalHoje} agendamento(s) para hoje.`,
          data: { route: "/agenda" },
        },
        trigger: null,
      });
    }
  } catch (e) {
    console.warn("[notificacoes-inteligentes] erro:", e);
  }
}
