import { ScrollView, Text, View, Pressable, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificacaoItem {
  id: string;
  type: 'orcamento' | 'ordem_servico' | 'pagamento' | 'inadimplencia' | 'alerta';
  title: string;
  body: string;
  timestamp: number;
  lida: boolean;
  data?: Record<string, any>;
}

export default function NotificacoesLista() {
  const router = useRouter();
  const colors = useColors();
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([]);
  const [filtro, setFiltro] = useState<'todas' | 'nao_lidas'>('todas');

  useEffect(() => {
    loadNotificacoes();
  }, []);

  const loadNotificacoes = async () => {
    try {
      const stored = await AsyncStorage.getItem('@polar/notificacoes');
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotificacoes(parsed.sort((a: NotificacaoItem, b: NotificacaoItem) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const markAsRead = async (id: string) => {
    const updated = notificacoes.map(n => 
      n.id === id ? { ...n, lida: true } : n
    );
    setNotificacoes(updated);
    await AsyncStorage.setItem('@polar/notificacoes', JSON.stringify(updated));
  };

  const deleteNotificacao = async (id: string) => {
    const updated = notificacoes.filter(n => n.id !== id);
    setNotificacoes(updated);
    await AsyncStorage.setItem('@polar/notificacoes', JSON.stringify(updated));
  };

  const clearAll = async () => {
    setNotificacoes([]);
    await AsyncStorage.removeItem('@polar/notificacoes');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'orcamento':
        return 'description';
      case 'ordem_servico':
        return 'assignment';
      case 'pagamento':
        return 'payment';
      case 'inadimplencia':
        return 'warning';
      default:
        return 'notifications';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'orcamento':
        return '#0a7ea4';
      case 'ordem_servico':
        return '#22C55E';
      case 'pagamento':
        return '#3B82F6';
      case 'inadimplencia':
        return '#EF4444';
      default:
        return colors.primary;
    }
  };

  const formatarData = (timestamp: number) => {
    const date = new Date(timestamp);
    const agora = new Date();
    const diff = agora.getTime() - date.getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Agora';
    if (minutos < 60) return `${minutos}m atrás`;
    if (horas < 24) return `${horas}h atrás`;
    if (dias < 7) return `${dias}d atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  const notificacoesExibidas = filtro === 'nao_lidas' 
    ? notificacoes.filter(n => !n.lida)
    : notificacoes;

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View style={{ backgroundColor: colors.surface, paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
            </Pressable>
            <Text className="text-2xl font-bold text-foreground">Notificações</Text>
            {naoLidas > 0 && (
              <View style={{ backgroundColor: '#EF4444', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text className="text-white text-xs font-bold">{naoLidas}</Text>
              </View>
            )}
          </View>
          {notificacoes.length > 0 && (
            <Pressable onPress={clearAll}>
              <MaterialIcons name="delete-sweep" size={24} color={colors.foreground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filtros */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable
          onPress={() => setFiltro('todas')}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: filtro === 'todas' ? colors.primary : colors.surface,
          }}
        >
          <Text style={{ color: filtro === 'todas' ? '#fff' : colors.foreground, fontWeight: '500' }}>
            Todas
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFiltro('nao_lidas')}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: filtro === 'nao_lidas' ? colors.primary : colors.surface,
          }}
        >
          <Text style={{ color: filtro === 'nao_lidas' ? '#fff' : colors.foreground, fontWeight: '500' }}>
            Não lidas ({naoLidas})
          </Text>
        </Pressable>
      </View>

      {/* Lista de Notificações */}
      {notificacoesExibidas.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
          <MaterialIcons name="notifications-none" size={64} color={colors.border} />
          <Text className="text-muted text-center mt-4">
            {filtro === 'nao_lidas' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notificacoesExibidas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => markAsRead(item.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                backgroundColor: !item.lida ? colors.surface : 'transparent',
              }}
            >
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: getColor(item.type),
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <MaterialIcons name={getIcon(item.type) as any} size={24} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text className="text-foreground font-bold flex-1">{item.title}</Text>
                    <Text className="text-muted text-xs">{formatarData(item.timestamp)}</Text>
                  </View>
                  <Text className="text-muted text-sm mt-1">{item.body}</Text>
                </View>
                <Pressable
                  onPress={() => deleteNotificacao(item.id)}
                  style={{ padding: 4 }}
                >
                  <MaterialIcons name="close" size={20} color={colors.border} />
                </Pressable>
              </View>
            </Pressable>
          )}
          scrollEnabled={true}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </ScreenContainer>
  );
}
