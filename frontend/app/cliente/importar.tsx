import { useState, useEffect } from "react";
import { FlatList, Text, View, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as Contacts from "expo-contacts";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getClientes, saveCliente, generateId, Cliente } from "@/lib/store";

interface ContatoAgenda {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
}

export default function ImportarClientesScreen() {
  const colors = useColors();
  const router = useRouter();
  const [contatos, setContatos] = useState<ContatoAgenda[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [clientesExistentes, setClientesExistentes] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar clientes existentes para evitar duplicatas
      const clientes = await getClientes();
      const telefonesExistentes = clientes
        .map((c) => c.telefone.replace(/\D/g, ""))
        .filter((t) => t.length > 0);
      setClientesExistentes(telefonesExistentes);

      // Solicitar permissão de acesso aos contatos
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão Negada", "É necessário permitir acesso aos contatos");
        setLoading(false);
        return;
      }

      // Carregar contatos
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
      });

      if (data.length > 0) {
        const contatosFormatados = data
          .filter((c) => c.name && c.name.trim().length > 0)
          .map((c) => ({
            id: c.id || generateId(),
            nome: c.name || "Sem nome",
            telefone:
              c.phoneNumbers && c.phoneNumbers.length > 0
                ? c.phoneNumbers[0].number || ""
                : "",
            email:
              c.emails && c.emails.length > 0
                ? c.emails[0].email || ""
                : "",
          }))
          .filter((c) => c.telefone && c.telefone.replace(/\D/g, "").length > 0);

        setContatos(contatosFormatados);
      }
    } catch (error) {
      console.error("Erro ao carregar contatos:", error);
      Alert.alert("Erro", "Não foi possível carregar os contatos");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelecionado = (id: string) => {
    const novo = new Set(selecionados);
    if (novo.has(id)) {
      novo.delete(id);
    } else {
      novo.add(id);
    }
    setSelecionados(novo);
  };

  const importarSelecionados = async () => {
    if (selecionados.size === 0) {
      Alert.alert("Aviso", "Selecione pelo menos um contato para importar");
      return;
    }

    try {
      const contatosSelecionados = contatos.filter((c) => selecionados.has(c.id));
      let importados = 0;

      for (const contato of contatosSelecionados) {
        // Verificar se já existe cliente com este telefone
        const telefoneLimpo = contato.telefone?.replace(/\D/g, "") || "";
        if (clientesExistentes.includes(telefoneLimpo)) {
          continue;
        }

        const novoCliente: Cliente = {
          id: generateId(),
          nome: contato.nome,
          telefone: contato.telefone || "",
          email: contato.email || "",
          cpfCnpj: "",
          endereco: "",
          numero: "",
          cidade: "",
          estado: "",
          bairro: "",
          cep: "",
          observacoes: "Importado da agenda do telefone",
          criadoEm: new Date().toISOString(),
        };

        await saveCliente(novoCliente);
        importados++;
      }

      Alert.alert("Sucesso", `${importados} contato(s) importado(s) com sucesso!`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Erro ao importar contatos:", error);
      Alert.alert("Erro", "Não foi possível importar os contatos");
    }
  };

  const renderItem = ({ item }: { item: ContatoAgenda }) => {
    const telefoneLimpo = item.telefone?.replace(/\D/g, "") || "";
    const jaExiste = clientesExistentes.includes(telefoneLimpo);
    const selecionado = selecionados.has(item.id);

    return (
      <Pressable
        onPress={() => !jaExiste && toggleSelecionado(item.id)}
        disabled={jaExiste}
        style={({ pressed }) => [
          {
            backgroundColor: jaExiste
              ? colors.border + "30"
              : selecionado
                ? colors.primary + "20"
                : colors.surface,
            borderRadius: 12,
            padding: 16,
            marginHorizontal: 20,
            marginBottom: 10,
            borderWidth: 2,
            borderColor: selecionado ? colors.primary : colors.border,
            opacity: jaExiste ? 0.5 : pressed ? 0.8 : 1,
            flexDirection: "row",
            alignItems: "center",
          },
        ]}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: selecionado ? colors.primary : colors.border,
            backgroundColor: selecionado ? colors.primary : "transparent",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          {selecionado && <MaterialIcons name="check" size={16} color="#FFF" />}
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.foreground,
              fontWeight: "600",
              fontSize: 16,
            }}
            numberOfLines={1}
          >
            {item.nome}
          </Text>
          {item.telefone && (
            <Text
              style={{
                color: colors.muted,
                fontSize: 14,
                marginTop: 4,
              }}
            >
              {item.telefone}
            </Text>
          )}
          {jaExiste && (
            <Text
              style={{
                color: colors.warning,
                fontSize: 12,
                marginTop: 4,
              }}
            >
              Já existe na agenda
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: "bold" }}>
            Importar Contatos
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted }}>Carregando contatos...</Text>
        </View>
      ) : contatos.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 }}>
          <MaterialIcons name="contacts" size={48} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 12 }}>
            Nenhum contato encontrado
          </Text>
          <Pressable
            onPress={loadData}
            style={({ pressed }) => [
              {
                marginTop: 16,
                backgroundColor: colors.primary,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 13 }}>
              Tentar Novamente
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={contatos}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
          />

          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.background,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              padding: 16,
              flexDirection: "row",
              gap: 10,
            }}
          >
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                {
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancelar</Text>
            </Pressable>

            <Pressable
              onPress={importarSelecionados}
              disabled={selecionados.size === 0}
              style={({ pressed }) => [
                {
                  flex: 1,
                  backgroundColor: selecionados.size === 0 ? colors.muted : colors.primary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 14 }}>
                Importar ({selecionados.size})
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </ScreenContainer>
  );
}
