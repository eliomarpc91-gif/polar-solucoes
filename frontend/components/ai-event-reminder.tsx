import { View, Text, Pressable } from "react-native";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Evento } from "@/lib/store";

interface AIEventReminderProps {
  evento: Evento | null;
  onDismiss?: () => void;
}

export function AIEventReminder({ evento, onDismiss }: AIEventReminderProps) {
  const colors = useColors();

  if (!evento) return null;

  const formatarHora = (hora: string) => {
    return hora; // Já está em formato HH:mm
  };

  const getTipoIcone = (tipo: string) => {
    switch (tipo) {
      case "compromisso":
        return "event";
      case "visita":
        return "location-on";
      case "manutencao":
        return "build";
      case "reuniao":
        return "people";
      default:
        return "event-note";
    }
  };

  const getTipoCor = (tipo: string) => {
    switch (tipo) {
      case "compromisso":
        return colors.primary;
      case "visita":
        return colors.warning;
      case "manutencao":
        return colors.error;
      case "reuniao":
        return colors.success;
      default:
        return colors.muted;
    }
  };

  const gerarMensagemIA = (evento: Evento): string => {
    const tipo = evento.tipo.toLowerCase();
    const hora = formatarHora(evento.hora);

    const mensagens: Record<string, string> = {
      compromisso: `Você tem um compromisso com ${evento.clienteNome || "um cliente"} às ${hora}. Não esqueça de preparar os materiais necessários!`,
      visita: `Lembrete: Você tem uma visita agendada para ${evento.clienteNome || "um cliente"} às ${hora}. Verifique o endereço: ${evento.local || "não informado"}.`,
      manutencao: `Manutenção programada para ${evento.clienteNome || "um cliente"} às ${hora}. Leve as ferramentas e peças necessárias!`,
      reuniao: `Reunião com ${evento.clienteNome || "equipe"} às ${hora}. Prepare a documentação necessária.`,
    };

    return mensagens[tipo] || `Você tem um evento: ${evento.titulo} às ${hora}`;
  };

  return (
    <View
      style={{
        backgroundColor: colors.primary + "15",
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "flex-start",
      }}
    >
      <MaterialIcons name="lightbulb" size={20} color={colors.primary} style={{ marginRight: 12, marginTop: 2 }} />

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary, marginBottom: 4 }}>
          💡 Dica da IA
        </Text>
        <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 18 }}>
          {gerarMensagemIA(evento)}
        </Text>
      </View>

      {onDismiss && (
        <Pressable onPress={onDismiss} style={{ padding: 4, marginLeft: 8 }}>
          <MaterialIcons name="close" size={18} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}
