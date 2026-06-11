import { ScrollView, Text, View, Pressable, Alert, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getEventos, deleteEvento, saveEvento, Evento, EventoTipo } from "@/lib/store";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AgendaScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 62 + Math.max(insets.bottom, 10) + 24;
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [tipo, setTipo] = useState<EventoTipo>("compromisso");
  const [local, setLocal] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadEventos();
    }, [])
  );

  const loadEventos = async () => {
    try {
      const eventosData = await getEventos();
      setEventos(eventosData);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    }
  };

  const handleEditEvento = (evento: Evento) => {
    setEditandoId(evento.id);
    setTitulo(evento.titulo);
    setDescricao(evento.descricao);
    setData(evento.data); // Será formatado no input
    setHora(evento.hora);
    setTipo(evento.tipo);
    setLocal(evento.local || "");
    setClienteNome(evento.clienteNome || "");
  };

  const handleCancelEdit = () => {
    setEditandoId(null);
    limparFormulario();
  };

  const limparFormulario = () => {
    setTitulo("");
    setDescricao("");
    setData("");
    setHora("");
    setTipo("compromisso" as EventoTipo);
    setLocal("");
    setClienteNome("");
  };

  const handleAddEvento = async () => {
    if (!titulo || !data || !hora) {
      Alert.alert("Erro", "Preencha título, data e hora");
      return;
    }

    try {
      // Converter DD/MM/YYYY para YYYY-MM-DD para armazenamento
      const partes = data.split("/");
      const dataFormatada = partes.length === 3 ? `${partes[2]}-${partes[1]}-${partes[0]}` : data;

      const evento: Evento = {
        id: editandoId || Date.now().toString(),
        titulo,
        descricao,
        data: dataFormatada,
        hora,
        tipo,
        local,
        clienteNome,
        notificacaoEnviada: false,
        criadoEm: editandoId ? new Date().toISOString() : new Date().toISOString(),
      };

      console.log(editandoId ? "Atualizando evento:" : "Salvando evento:", evento);
      await saveEvento(evento);
      console.log("Evento salvo com sucesso");
      limparFormulario();
      setEditandoId(null);
      await loadEventos();
      console.log("Eventos recarregados");
      Alert.alert("Sucesso", editandoId ? "Compromisso atualizado" : "Compromisso adicionado");
    } catch (error) {
      console.error("Erro ao adicionar evento:", error);
      Alert.alert("Erro", "Não foi possível adicionar o compromisso");
    }
  };

  const handleDeleteEvento = async (id: string) => {
    setDeletandoId(id);
  };

  const confirmarDelete = async () => {
    if (!deletandoId) return;
    
    try {
      console.log("Deletando evento com ID:", deletandoId);
      await deleteEvento(deletandoId);
      console.log("Evento deletado com sucesso");
      await loadEventos();
      console.log("Eventos recarregados após deletar");
      setDeletandoId(null);
      Alert.alert("Sucesso", "Compromisso deletado");
    } catch (error) {
      console.error("Erro ao deletar evento:", error);
      Alert.alert("Erro", "Não foi possível deletar o compromisso");
      setDeletandoId(null);
    }
  };

  const cancelarDelete = () => {
    setDeletandoId(null);
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return "";
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
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

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight }}>
        {/* Header Premium */}
        <View style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
          marginBottom: 16,
        }}>
          <View>
            <Text style={{ fontSize: 12, fontWeight: "500", color: colors.muted, marginBottom: 2 }}>Planejamento</Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground, letterSpacing: -0.5 }}>Agenda</Text>
          </View>
          <View style={[{
            width: 44, height: 44, borderRadius: 14,
            backgroundColor: colors.primary, justifyContent: "center", alignItems: "center",
            shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
          }]}>
            <MaterialIcons name="calendar-today" size={20} color="#fff" />
          </View>
        </View>

        {/* Formulário de Novo Evento */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            marginHorizontal: 16,
            borderWidth: 1,
            borderColor: colors.borderLight,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
              {editandoId ? "Editar Compromisso" : "Novo Compromisso"}
            </Text>
            {editandoId && (
              <Pressable
                onPress={handleCancelEdit}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <MaterialIcons name="close" size={20} color={colors.muted} />
              </Pressable>
            )}
          </View>

          <TextInput
            placeholder="Título"
            placeholderTextColor={colors.muted}
            value={titulo}
            onChangeText={setTitulo}
            style={{
              backgroundColor: colors.background,
              borderRadius: 8,
              padding: 10,
              marginBottom: 10,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />

          <TextInput
            placeholder="Descrição (opcional)"
            placeholderTextColor={colors.muted}
            value={descricao}
            onChangeText={setDescricao}
            multiline
            style={{
              backgroundColor: colors.background,
              borderRadius: 8,
              padding: 10,
              marginBottom: 10,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: 60,
            }}
          />

          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <TextInput
              placeholder="Data (DD/MM/YYYY)"
              placeholderTextColor={colors.muted}
              value={data}
              onChangeText={(text) => {
                // Remover caracteres não numéricos
                const numeros = text.replace(/\D/g, "");
                
                // Aplicar máscara DD/MM/YYYY
                let formatado = "";
                if (numeros.length > 0) {
                  formatado = numeros.substring(0, 2);
                }
                if (numeros.length > 2) {
                  formatado += "/" + numeros.substring(2, 4);
                }
                if (numeros.length > 4) {
                  formatado += "/" + numeros.substring(4, 8);
                }
                
                setData(formatado);
              }}
              keyboardType="numeric"
              maxLength={10}
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderRadius: 8,
                padding: 10,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <TextInput
              placeholder="Hora (HH:mm)"
              placeholderTextColor={colors.muted}
              value={hora}
              onChangeText={setHora}
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderRadius: 8,
                padding: 10,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </View>

          <TextInput
            placeholder="Cliente (opcional)"
            placeholderTextColor={colors.muted}
            value={clienteNome}
            onChangeText={setClienteNome}
            style={{
              backgroundColor: colors.background,
              borderRadius: 8,
              padding: 10,
              marginBottom: 10,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />

          <TextInput
            placeholder="Local (opcional)"
            placeholderTextColor={colors.muted}
            value={local}
            onChangeText={setLocal}
            style={{
              backgroundColor: colors.background,
              borderRadius: 8,
              padding: 10,
              marginBottom: 10,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />

          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 6 }}>Tipo</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["compromisso", "visita", "manutencao", "reuniao"] as EventoTipo[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTipo(t)}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      borderRadius: 8,
                      backgroundColor: tipo === t ? getTipoCor(t) : colors.background,
                      borderWidth: 1,
                      borderColor: getTipoCor(t),
                      opacity: pressed ? 0.8 : 1,
                      alignItems: "center",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: tipo === t ? "#FFF" : getTipoCor(t),
                      textTransform: "capitalize",
                    }}
                  >
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            onPress={handleAddEvento}
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                opacity: pressed ? 0.85 : 1,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              },
            ]}
          >
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 14, letterSpacing: 0.3 }}>
              {editandoId ? "Atualizar Compromisso" : "Adicionar Compromisso"}
            </Text>
          </Pressable>
        </View>

        {/* Modal de Confirmação de Exclusão */}
        {deletandoId && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 20,
                width: "80%",
                maxWidth: 300,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
                Confirmar exclusão
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 20 }}>
                Deseja deletar este compromisso? Esta ação não pode ser desfeita.
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={cancelarDelete}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: colors.border,
                      alignItems: "center",
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={confirmarDelete}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: colors.error,
                      alignItems: "center",
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={{ color: "#FFF", fontWeight: "600" }}>Deletar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Lista de Eventos */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            Compromissos ({eventos.length})
          </Text>

          {eventos.length === 0 ? (
            <View
              style={{
              backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 24,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.borderLight,
              }}
            >
              <MaterialIcons name="event-note" size={36} color={colors.muted} />
              <Text className="text-muted text-sm mt-2">Nenhum compromisso agendado</Text>
            </View>
          ) : (
            eventos.map((evento) => (
              <View
                key={evento.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  borderLeftWidth: 4,
                  borderLeftColor: getTipoCor(evento.tipo),
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                      <MaterialIcons name={getTipoIcone(evento.tipo) as any} size={16} color={getTipoCor(evento.tipo)} />
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: colors.foreground,
                          marginLeft: 8,
                        }}
                      >
                        {evento.titulo}
                      </Text>
                    </View>
                    <View style={{ marginLeft: 24 }}>
                      <Text style={{ fontSize: 12, color: colors.muted }}>
                        📅 {formatarData(evento.data)} às {evento.hora}
                      </Text>
                      {evento.clienteNome && (
                        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>👤 {evento.clienteNome}</Text>
                      )}
                      {evento.local && (
                        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>📍 {evento.local}</Text>
                      )}
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      onPress={() => handleEditEvento(evento)}
                      style={({ pressed }) => [
                        {
                          padding: 8,
                          opacity: pressed ? 0.6 : 1,
                        },
                      ]}
                    >
                      <MaterialIcons name="edit" size={18} color={colors.primary} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteEvento(evento.id)}
                      style={({ pressed }) => [
                        {
                          padding: 8,
                          opacity: pressed ? 0.6 : 1,
                        },
                      ]}
                    >
                      <MaterialIcons name="delete" size={18} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
