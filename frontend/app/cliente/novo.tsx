import { useState } from "react";
import { ScrollView, Text, View, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { saveCliente, generateId, Cliente } from "@/lib/store";

// IMPORTANTE: definido FORA do componente para não ser recriado a cada render
// (era o motivo do teclado fechar a cada letra digitada)
type FieldProps = {
  colors: any;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "email-address" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words";
  multiline?: boolean;
};

function InputField({
  colors, label, value, onChangeText, placeholder, keyboardType, autoCapitalize, multiline,
}: FieldProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text className="text-muted text-xs font-semibold mb-2 ml-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          padding: 14,
          color: colors.foreground,
          fontSize: 14,
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

export default function NovoClienteScreen() {
  const colors = useColors();
  const router = useRouter();
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

  const salvar = async () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "Preencha pelo menos o nome do cliente");
      return;
    }

    const cliente: Cliente = {
      id: generateId(),
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
      criadoEm: new Date().toISOString(),
    };

    await saveCliente(cliente);
    Alert.alert("Sucesso", "Cliente cadastrado com sucesso!", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  const InputFieldOld = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    autoCapitalize,
  }: {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    keyboardType?: "default" | "phone-pad" | "email-address" | "numeric";
    autoCapitalize?: "none" | "sentences" | "words";
  }) => (
    <View style={{ marginBottom: 14 }}>
      <Text className="text-muted text-xs font-semibold mb-2 ml-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          padding: 14,
          color: colors.foreground,
          fontSize: 14,
        }}
      />
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-foreground text-xl font-bold ml-4">Novo Cliente</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <InputField colors={colors} label="NOME *" value={nome} onChangeText={setNome} placeholder="Nome completo ou empresa" autoCapitalize="words" />
        <InputField colors={colors} label="TELEFONE" value={telefone} onChangeText={setTelefone} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
        <InputField colors={colors} label="EMAIL" value={email} onChangeText={setEmail} placeholder="email@exemplo.com" keyboardType="email-address" autoCapitalize="none" />
        <InputField colors={colors} label="CPF/CNPJ" value={cpfCnpj} onChangeText={setCpfCnpj} placeholder="000.000.000-00" keyboardType="numeric" />

        <Text className="text-muted text-xs font-semibold mb-2 ml-1 mt-2">ENDEREÇO</Text>
        <InputField colors={colors} label="CEP" value={cep} onChangeText={setCep} placeholder="00000-000" keyboardType="numeric" />
        <InputField colors={colors} label="Rua/Endereço" value={endereco} onChangeText={setEndereco} placeholder="Rua" autoCapitalize="words" />
        <InputField colors={colors} label="Número" value={numero} onChangeText={setNumero} placeholder="Número" keyboardType="numeric" />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <InputField colors={colors} label="Bairro" value={bairro} onChangeText={setBairro} placeholder="Bairro" autoCapitalize="words" />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 2 }}>
            <InputField colors={colors} label="Cidade" value={cidade} onChangeText={setCidade} placeholder="Cidade" autoCapitalize="words" />
          </View>
          <View style={{ flex: 1 }}>
            <InputField colors={colors} label="Estado" value={estado} onChangeText={setEstado} placeholder="UF" autoCapitalize="none" />
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
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "bold" }}>Salvar Cliente</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
