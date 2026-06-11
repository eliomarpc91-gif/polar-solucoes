import { useState, useEffect } from "react";
import { ScrollView, Text, View, TextInput, Pressable, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { InputField } from "@/components/input-field";
import { useColors } from "@/hooks/use-colors";
import { saveCliente, getClientes, Cliente } from "@/lib/store";

export default function EditarClienteScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const clientes = await getClientes();
    const found = clientes.find((c) => c.id === id);
    if (found) {
      setCliente(found);
      setNome(found.nome);
      setTelefone(found.telefone);
      setEmail(found.email);
      setCpfCnpj(found.cpfCnpj);
      setEndereco(found.endereco);
      setNumero(found.numero);
      setCidade(found.cidade);
      setEstado(found.estado);
      setBairro(found.bairro);
      setCep(found.cep);
      setObservacoes(found.observacoes);
    }
  };

  const salvar = async () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "Preencha pelo menos o nome do cliente");
      return;
    }

    if (!cliente) {
      Alert.alert("Erro", "Cliente não encontrado");
      return;
    }

    const clienteAtualizado: Cliente = {
      ...cliente,
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      cpfCnpj: cpfCnpj.trim(),
      endereco: endereco.trim(),
      numero: numero.trim(),
      cidade: cidade.trim(),
      estado: estado.trim(),
      bairro: bairro.trim(),
      cep: cep.trim(),
      observacoes: observacoes.trim(),
    };

    await saveCliente(clienteAtualizado);
    Alert.alert("Sucesso", "Cliente atualizado com sucesso!", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  if (!cliente) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text className="text-muted">Carregando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">Editar Cliente</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <InputField label="NOME *" value={nome} onChangeText={setNome} placeholder="Nome completo ou empresa" autoCapitalize="words" />
        <InputField label="TELEFONE" value={telefone} onChangeText={setTelefone} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
        <InputField label="EMAIL" value={email} onChangeText={setEmail} placeholder="email@exemplo.com" keyboardType="email-address" autoCapitalize="none" />
        <InputField label="CPF/CNPJ" value={cpfCnpj} onChangeText={setCpfCnpj} placeholder="000.000.000-00" keyboardType="numeric" />

        <Text className="text-muted text-xs font-semibold mb-2 ml-1 mt-2">ENDEREÇO</Text>
        <InputField label="CEP" value={cep} onChangeText={setCep} placeholder="00000-000" keyboardType="numeric" />
        <InputField label="Rua/Endereço" value={endereco} onChangeText={setEndereco} placeholder="Rua" autoCapitalize="words" />
        <InputField label="Número" value={numero} onChangeText={setNumero} placeholder="Número" keyboardType="numeric" />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <InputField label="Bairro" value={bairro} onChangeText={setBairro} placeholder="Bairro" autoCapitalize="words" />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 2 }}>
            <InputField label="Cidade" value={cidade} onChangeText={setCidade} placeholder="Cidade" autoCapitalize="words" />
          </View>
          <View style={{ flex: 1 }}>
            <InputField label="Estado" value={estado} onChangeText={setEstado} placeholder="UF" autoCapitalize="none" />
          </View>
        </View>

        <View style={{ marginTop: 8 }}>
          <Text className="text-muted text-xs font-semibold mb-2 ml-1">OBSERVAÇÕES</Text>
          <TextInput
            value={observacoes}
            onChangeText={setObservacoes}
            placeholder="Observações sobre o cliente..."
            placeholderTextColor={colors.muted}
            multiline
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 14,
              color: colors.foreground,
              fontSize: 14,
              minHeight: 80,
              textAlignVertical: "top",
            }}
          />
        </View>

        {/* Save Button */}
        <Pressable
          onPress={salvar}
          style={({ pressed }) => [
            {
              backgroundColor: colors.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              marginTop: 24,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "bold" }}>Atualizar Cliente</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
