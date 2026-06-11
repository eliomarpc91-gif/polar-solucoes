import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Notification, NotificationBehavior } from 'expo-notifications';

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

export interface NotificationData {
  type: 'orcamento' | 'ordem_servico' | 'pagamento' | 'inadimplencia' | 'alerta';
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Solicitar permissão para enviar notificações
 */
export async function requestNotificationPermissions() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificações:', error);
    return false;
  }
}

/**
 * Enviar notificação local
 */
export async function sendLocalNotification(notification: NotificationData) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: {
          type: notification.type,
          ...notification.data,
        },
        sound: 'default',
        badge: 1,
      },
      trigger: null, // Enviar imediatamente
    });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
}

/**
 * Enviar notificação de orçamento criado
 */
export async function notifyOrcamentoCriado(clienteNome: string, valor: number) {
  await sendLocalNotification({
    type: 'orcamento',
    title: 'Novo Orçamento',
    body: `Orçamento criado para ${clienteNome} - R$ ${valor.toFixed(2)}`,
    data: { clienteNome, valor },
  });
}

/**
 * Enviar notificação de orçamento aprovado
 */
export async function notifyOrcamentoAprovado(clienteNome: string, valor: number) {
  await sendLocalNotification({
    type: 'orcamento',
    title: 'Orçamento Aprovado',
    body: `${clienteNome} aprovou o orçamento de R$ ${valor.toFixed(2)}`,
    data: { clienteNome, valor },
  });
}

/**
 * Enviar notificação de pagamento pendente
 */
export async function notifyPagamentoPendente(clienteNome: string, valor: number, diasAtraso: number) {
  await sendLocalNotification({
    type: 'pagamento',
    title: 'Pagamento Pendente',
    body: `${clienteNome} deve R$ ${valor.toFixed(2)} (${diasAtraso} dias de atraso)`,
    data: { clienteNome, valor, diasAtraso },
  });
}

/**
 * Enviar notificação de ordem de serviço concluída
 */
export async function notifyOrdemConcluida(clienteNome: string, descricao: string) {
  await sendLocalNotification({
    type: 'ordem_servico',
    title: 'Ordem de Serviço Concluída',
    body: `${descricao} finalizada para ${clienteNome}`,
    data: { clienteNome, descricao },
  });
}

/**
 * Enviar notificação de alerta
 */
export async function notifyAlerta(titulo: string, mensagem: string) {
  await sendLocalNotification({
    type: 'alerta',
    title: titulo,
    body: mensagem,
  });
}

/**
 * Configurar listener para notificações recebidas
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (notification: Notifications.Notification) => void
) {
  // Listener para notificações recebidas enquanto app está em foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notificação recebida:', notification);
    onNotificationReceived?.(notification);
  });

  // Listener para quando usuário toca na notificação
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notificação tocada:', response.notification);
    onNotificationTapped?.(response.notification);
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Obter token de notificação (para push notifications via servidor)
 */
export async function getNotificationToken() {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (error) {
    console.error('Erro ao obter token de notificação:', error);
    return null;
  }
}
