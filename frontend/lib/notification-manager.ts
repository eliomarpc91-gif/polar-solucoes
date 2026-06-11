import * as Notifications from "expo-notifications";
import { Evento } from "@/lib/store";

// Configurar comportamento de notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Agendar notificação para um evento
 */
export async function agendarNotificacaoEvento(evento: Evento): Promise<string | null> {
  try {
    // Verificar permissões
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      console.warn("Permissão de notificação não concedida");
      return null;
    }

    // Calcular tempo até o evento (15 minutos antes)
    const [ano, mes, dia] = evento.data.split("-");
    const [hora, minuto] = evento.hora.split(":");

    const dataEvento = new Date(
      parseInt(ano),
      parseInt(mes) - 1,
      parseInt(dia),
      parseInt(hora),
      parseInt(minuto)
    );

    // 15 minutos antes do evento
    const dataNotificacao = new Date(dataEvento.getTime() - 15 * 60 * 1000);

    // Se a notificação já passou, não agendar
    if (dataNotificacao < new Date()) {
      console.warn("Evento já passou, não agendando notificação");
      return null;
    }

    // Calcular segundos até a notificação
    const segundosAteNotificacao = Math.floor((dataNotificacao.getTime() - Date.now()) / 1000);

    // Agendar notificação
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Lembrete de Compromisso",
        body: `${evento.titulo} em 15 minutos`,
        data: {
          eventoId: evento.id,
          titulo: evento.titulo,
          hora: evento.hora,
          tipo: evento.tipo,
        },
        sound: "default",
        badge: 1,
      },
      trigger: {
        seconds: Math.max(segundosAteNotificacao, 1),
      } as any,
    });

    console.log(`Notificação agendada para ${evento.titulo} em ${dataNotificacao}`);
    return notificationId;
  } catch (error) {
    console.error("Erro ao agendar notificação:", error);
    return null;
  }
}

/**
 * Cancelar notificação agendada
 */
export async function cancelarNotificacaoEvento(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Notificação ${notificationId} cancelada`);
  } catch (error) {
    console.error("Erro ao cancelar notificação:", error);
  }
}

/**
 * Solicitar permissão para notificações
 */
export async function solicitarPermissaoNotificacoes(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Erro ao solicitar permissão de notificação:", error);
    return false;
  }
}

/**
 * Enviar notificação imediata (para testes)
 */
export async function enviarNotificacaoImediata(titulo: string, mensagem: string): Promise<void> {
  try {
    // Usar scheduleNotificationAsync com trigger imediato (1 segundo no futuro)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: mensagem,
        sound: "default",
        badge: 1,
      },
      trigger: {
        seconds: 1,
      } as any,
    });
  } catch (error) {
    console.error("Erro ao enviar notificação imediata:", error);
  }
}
