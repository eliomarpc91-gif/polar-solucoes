import { useState, useEffect } from "react";
import { ScrollView, Text, View, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getClientes, saveEquipamento, generateId, Cliente, Equipamento } from "@/lib/store";

export default function NovoEquipamentoScreen() {
  const colors = useColors();
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [searchCliente, setSearchCliente] = useState("");
  const [showClienteList, setShowClienteList] = useState(false);
  const [tipo, setTipo] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [serie, setSerie] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    const data = await getClientes();
    setClientes(data);
  };

  const filteredClientes = clientes.filter(
    (c) => searchCliente === "" || c.nome.toLowerCase().includes(searchCliente.toLowerCase())
  );

  const salvar = async () => {
    if (!clienteSelecionado) {
      Alert.alert("Erro", "Selecione um cliente");
      return;
    }
    if (!tipo) {
      Alert.alert("Erro", "Informe o tipo do equipamento");
      return;
    }

    const equipId = generateId();
    const equip: Equipamento = {
      id: equipId,
      codigoInterno: `EQ-${equipId.slice(-6).toUpperCase()}`,
      clienteId: clienteSelecionado.id,
      tipo,
      marca,
      modelo,
      serie,
      observacoes,
      statusOperacional: "ativo",
      infoTecnica: {},
      fotos: [],
      qrData: `polarsolucoes://equipamento/${equipId}`,
      criadoEm: new Date().toISOString(),
    };

    await saveEquipamento(equip);
    Alert.alert("Sucesso", "Equipamento cadastrado!", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">Novo Equipamento</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Cliente */}
        <Text className="text-muted text-xs font-semibold mb-2 ml-1">CLIENTE *</Text>
        {clienteSelecionado ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.primary, flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text className="text-foreground font-semibold">{clienteSelecionado.nome}</Text>
              <Text className="text-muted text-xs mt-1">{clienteSelecionado.telefone}</Text>
            </View>
            <Pressable onPress={() => { setClienteSelecionado(null); setShowClienteList(true); }}>
              <MaterialIcons name="close" size={20} color={colors.muted} />
            </Pressable>
          </View>
        ) : (
          <View style={{ marginBottom: 16 }}>
            <TextInput
              value={searchCliente}
              onChangeText={(t) => { setSearchCliente(t); setShowClienteList(true); }}
              placeholder="Buscar cliente..."
              placeholderTextColor={colors.muted}
              onFocus={() => setShowClienteList(true)}
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, color: colors.foreground, fontSize: 15 }}
            />
            {showClienteList && filteredClientes.length > 0 && (
              <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginTop: 4, maxHeight: 180 }}>
                {filteredClientes.slice(0, 5).map((c) => (
                  <Pressable key={c.id} onPress={() => { setClienteSelecionado(c); setShowClienteList(false); setSearchCliente(""); }} style={({ pressed }) => [{ padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: pressed ? colors.border : "transparent" }]}>
                    <Text className="text-foreground text-sm font-medium">{c.nome}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tipo rápido */}
        <Text className="text-muted text-xs font-semibold mb-2 ml-1">TIPO *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {["Ar Condicionado", "Geladeira", "Freezer", "Máq. Lavar", "Micro-ondas", "Câmara Fria", "Outro"].map((t) => (
            <Pressable
              key={t}
              onPress={() => setTipo(t)}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 10,
                  marginRight: 8,
                  backgroundColor: tipo === t ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: tipo === t ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={{ color: tipo === t ? "#FFF" : colors.foreground, fontWeight: "600", fontSize: 13 }}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 6, marginLeft: 4 }}>MARCA</Text>
        <TextInput
          value={marca}
          onChangeText={setMarca}
          placeholder="Ex: Samsung, LG, Consul"
          placeholderTextColor={colors.muted}
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.foreground, fontSize: 15, marginBottom: 14 }}
        />
        <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 6, marginLeft: 4 }}>MODELO</Text>
        <TextInput
          value={modelo}
          onChangeText={setModelo}
          placeholder="Ex: AR12BVHZCWK"
          placeholderTextColor={colors.muted}
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.foreground, fontSize: 15, marginBottom: 14 }}
        />
        <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 6, marginLeft: 4 }}>Nº SÉRIE</Text>
        <TextInput
          value={serie}
          onChangeText={setSerie}
          placeholder="Número de série"
          placeholderTextColor={colors.muted}
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.foreground, fontSize: 15, marginBottom: 14 }}
        />
        <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", marginBottom: 6, marginLeft: 4 }}>OBSERVAÇÕES</Text>
        <TextInput
          value={observacoes}
          onChangeText={setObservacoes}
          placeholder="Observações..."
          placeholderTextColor={colors.muted}
          multiline
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.foreground, fontSize: 15, marginBottom: 14, minHeight: 80, textAlignVertical: "top" }}
        />

        <Pressable
          onPress={salvar}
          style={({ pressed }) => [
            {
              backgroundColor: colors.primary,
              borderRadius: 14,
              padding: 18,
              alignItems: "center",
              marginTop: 8,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "800" }}>Cadastrar Equipamento</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
