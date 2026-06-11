import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const FAQ = [
  {
    q: "Como criar uma nova OS?",
    a: "Na tela inicial, toque em 'Nova OS' ou vá até a aba OS e toque no botão + no canto superior direito.",
  },
  {
    q: "Como cadastrar um cliente?",
    a: "Vá até a aba Clientes e toque no botão + no canto superior direito, ou use o atalho 'Novo Cliente' na tela inicial.",
  },
  {
    q: "Como alterar o status de uma OS?",
    a: "Abra a OS desejada e toque no status que deseja aplicar (Aberto, Em andamento, Pendente ou Concluído).",
  },
  {
    q: "Como criar um orçamento?",
    a: "Vá até a aba Orçamentos e toque no botão +, ou use o atalho na tela inicial.",
  },
  {
    q: "Como fazer backup dos dados?",
    a: "Vá em Mais > Backup para criar um backup dos seus dados.",
  },
  {
    q: "Os dados são salvos na nuvem?",
    a: "Atualmente os dados são salvos localmente no dispositivo. Recomendamos fazer backups regulares.",
  },
  {
    q: "Como entrar em contato com o suporte?",
    a: "Envie um email para suporte@polarsolucoes.com.br ou entre em contato pelo WhatsApp.",
  },
];

export default function AjudaScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">Ajuda</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text className="text-foreground text-lg font-semibold mb-4">Perguntas Frequentes</Text>

        {FAQ.map((item, index) => (
          <View
            key={index}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <MaterialIcons name="help-outline" size={18} color={colors.primary} style={{ marginTop: 2 }} />
              <Text className="text-foreground text-sm font-semibold ml-2 flex-1">{item.q}</Text>
            </View>
            <Text className="text-muted text-sm mt-2 ml-7">{item.a}</Text>
          </View>
        ))}

        <View style={{ marginTop: 16, alignItems: "center" }}>
          <Text className="text-muted text-xs">Polar Soluções v1.0.0</Text>
          <Text className="text-muted text-xs mt-1">Gestão de Assistência Técnica</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
