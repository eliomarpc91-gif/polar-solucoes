import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type Item = {
  label: string;
  icon: string;
  color: string;
  route: string;
};

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: "OPERACIONAL",
    items: [
      { label: "Cobranças", icon: "receipt", color: "#EF4444", route: "/cobrancas" },
      { label: "Fluxo de Caixa", icon: "trending-up", color: "#10B981", route: "/fluxo-caixa" },
      { label: "Agenda", icon: "calendar-today", color: "#3B82F6", route: "/agenda" },
      { label: "Estoque", icon: "inventory-2", color: "#8B5CF6", route: "/estoque" },
      { label: "Equipamentos", icon: "memory", color: "#06B6D4", route: "/equipamento" },
    ],
  },
  {
    title: "CADASTROS",
    items: [
      { label: "Clientes", icon: "people", color: "#1E88E5", route: "/clientes" },
      { label: "Equipamentos", icon: "kitchen", color: "#7C3AED", route: "/equipamento" },
      { label: "Serviços", icon: "build-circle", color: "#10B981", route: "/servicos-cadastrados" },
      { label: "Produtos/Estoque", icon: "inventory-2", color: "#F59E0B", route: "/estoque" },
    ],
  },
  {
    title: "FINANCEIRO",
    items: [
      { label: "Carteiras Financeiras", icon: "account-balance-wallet", color: "#0D3B66", route: "/carteiras" },
      { label: "Contas a Receber", icon: "call-received", color: "#10B981", route: "/contas-receber" },
      { label: "Contas a Pagar", icon: "call-made", color: "#EF4444", route: "/contas-pagar" },
      { label: "Centro de Custos", icon: "account-tree", color: "#F59E0B", route: "/centro-custos" },
      { label: "Lucratividade", icon: "leaderboard", color: "#16A34A", route: "/lucratividade-servicos" },
      { label: "Impostos", icon: "request-quote", color: "#6366F1", route: "/impostos" },
    ],
  },
  {
    title: "RELATÓRIOS E IA",
    items: [
      { label: "Dashboard Empresarial", icon: "dashboard", color: "#0EA5E9", route: "/dashboard-empresarial" },
      { label: "Análise IA", icon: "smart-toy", color: "#7C3AED", route: "/analise-ia" },
      { label: "Assistente IA", icon: "auto-awesome", color: "#A855F7", route: "/assistente-ia" },
      { label: "IA Técnica", icon: "psychology", color: "#9333EA", route: "/ia-tecnica" },
    ],
  },
  {
    title: "OUTROS",
    items: [
      { label: "Mapa de Clientes", icon: "map", color: "#22C55E", route: "/mapa" },
      { label: "Contratos", icon: "assignment", color: "#F97316", route: "/contratos" },
      { label: "Garantias", icon: "verified-user", color: "#0891B2", route: "/garantias" },
      { label: "Notificações", icon: "notifications", color: "#EAB308", route: "/notificacoes-lista" },
      { label: "Mensagens", icon: "chat", color: "#14B8A6", route: "/mensagens" },
      { label: "Configurações", icon: "settings", color: "#475569", route: "/configuracoes" },
      { label: "Ajuda", icon: "help-outline", color: "#64748B", route: "/ajuda" },
      { label: "Backup", icon: "cloud-upload", color: "#0284C7", route: "/backup" },
    ],
  },
];

export default function MaisTab() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            color: colors.foreground,
            fontSize: 22,
            fontWeight: "800",
            marginBottom: 4,
          }}
        >
          Mais opções
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 20 }}>
          Acesse todos os módulos do Polar Soluções
        </Text>

        {SECTIONS.map((sec) => (
          <View key={sec.title} style={{ marginBottom: 22 }}>
            <Text
              style={{
                color: colors.muted,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.4,
                marginBottom: 10,
                marginLeft: 4,
              }}
            >
              {sec.title}
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              {sec.items.map((item, idx) => (
                <Pressable
                  key={item.label}
                  onPress={() => router.push(item.route as any)}
                  testID={`mais-${item.label.replace(/\s+/g, "-").toLowerCase()}`}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    borderBottomWidth: idx === sec.items.length - 1 ? 0 : 1,
                    borderBottomColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View
                    style={{
                      backgroundColor: item.color + "20",
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      marginLeft: 12,
                      color: colors.foreground,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {item.label}
                  </Text>
                  <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
