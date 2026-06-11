import { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getOrdens, getOrcamentos, OrdemServico, Orcamento } from "@/lib/store";

interface Notificacao {
  id: string;
  tipo: "os_pendente" | "orc_aguardando" | "os_atrasada" | "info";
  titulo: string;
  descricao: string;
  data: string;
  route?: string;
  naoLida?: boolean;
}

export default function NotificacoesScreen() {
  const colors = useColors();
  const router = useRouter();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const ordens = await getOrdens();
    const orcamentos = await getOrcamentos();
    const notifs: Notificacao[] = [];

    // OS pendentes há mais de 3 dias
    const tresDiasAtras = new Date();
    tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);
    ordens
      .filter((o) => o.status === "pendente" && new Date(o.criadoEm) < tresDiasAtras)
      .forEach((o) => {
        notifs.push({
          id: `os_atrasada_${o.id}`,
          tipo: "os_atrasada",
          titulo: `OS #${o.numero} atrasada`,
          descricao: `Pendente há mais de 3 dias - ${o.clienteNome}`,
          data: o.criadoEm,
          route: `/os/${o.id}`,
        });
      });

    // OS abertas
    ordens
      .filter((o) => o.status === "aberto")
      .slice(0, 5)
      .forEach((o) => {
        notifs.push({
          id: `os_aberta_${o.id}`,
          tipo: "os_pendente",
          titulo: `OS #${o.numero} aguardando`,
          descricao: `${o.clienteNome} - ${o.problema || "Sem descrição"}`,
          data: o.criadoEm,
          route: `/os/${o.id}`,
        });
      });

    // Orçamentos aguardando resposta
    orcamentos
      .filter((o) => o.status === "enviado")
      .forEach((o) => {
        notifs.push({
          id: `orc_${o.id}`,
          tipo: "orc_aguardando",
          titulo: `Orçamento #${o.numero} sem resposta`,
          descricao: `${o.clienteNome} - R$ ${o.valorTotal.toFixed(2)}`,
          data: o.criadoEm,
          route: `/orcamento/${o.id}`,
        });
      });

    setNotificacoes(notifs.sort((a, b) => b.data.localeCompare(a.data)));
  };

  const tipoIcon = (tipo: string) => {
    switch (tipo) {
      case "os_atrasada": return { icon: "warning", color: colors.error };
      case "os_pendente": return { icon: "assignment", color: colors.primary };
      case "orc_aguardando": return { icon: "request-quote", color: colors.warning };
      default: return { icon: "info", color: colors.muted };
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">Notificações</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {notificacoes.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <MaterialIcons name="notifications-none" size={56} color={colors.muted} />
            <Text className="text-muted text-sm mt-3">Nenhuma notificação</Text>
            <Text className="text-muted text-xs mt-1">Tudo em dia!</Text>
          </View>
        ) : (
          notificacoes.map((notif) => {
            const { icon, color } = tipoIcon(notif.tipo);
            return (
              <Pressable
                key={notif.id}
                onPress={() => notif.route && router.push(notif.route as any)}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed ? colors.border : colors.surface,
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                  },
                ]}
              >
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: color + "15", alignItems: "center", justifyContent: "center" }}>
                  <MaterialIcons name={icon as any} size={22} color={color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text className="text-foreground text-sm font-semibold">{notif.titulo}</Text>
                  <Text className="text-muted text-xs mt-1" numberOfLines={1}>{notif.descricao}</Text>
                </View>
                <Text className="text-muted text-xs">{new Date(notif.data).toLocaleDateString("pt-BR")}</Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
